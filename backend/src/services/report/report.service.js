import { redis } from "../../config/redis.js";
import { logError } from "../../utils/logger.js";
import { SessionService } from "../interview/session.service.js";
import { PersistenceService } from "../interview/persistence.service.js";
import { generateInterviewReport } from "./reportGenerator.js";

// Longer than the slowest report LLM call; the lock expires on its
// own if the process crashes mid-generation
const LOCK_TTL_SECONDS = 120;

const WAIT_STEP_MS = 1000;
const STATUS_TTL_SECONDS = 24 * 60 * 60;
const JOB_TTL_SECONDS = LOCK_TTL_SECONDS + 30;
const SAFE_FAILURE = "Report generation failed. Please try again.";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export class ReportService {

    // Jobs live in this process; Redis coordinates admission across replicas.
    static jobs = new Set();

    static statusKey(interviewId) {
        return `report:${interviewId}:status`;
    }

    static async writeStatus(interviewId, status, error) {
        await redis.set(this.statusKey(interviewId), {
            status,
            ...(error ? { error } : {})
        }, { ex: STATUS_TTL_SECONDS });
    }

    static async noteStatus(interviewId, status, error) {
        // Telemetry/status failure must not turn a durably saved report into
        // a failed report. findSaved() remains the source of truth for readiness.
        try { await this.writeStatus(interviewId, status, error); }
        catch (failure) { logError(failure); }
    }

    static async status(interviewId) {
        if (await this.findSaved(interviewId)) return { status: "ready" };
        const record = await redis.get(this.statusKey(interviewId));
        const [queued, generating] = await Promise.all([
            redis.exists(`lock:report-job:${interviewId}`),
            redis.exists(`lock:report:${interviewId}`)
        ]);
        if (queued || generating) return { status: "generating" };
        if (record?.status === "generating") await this.noteStatus(interviewId, "failed", SAFE_FAILURE);
        return { status: "failed", error: SAFE_FAILURE };
    }

    static async start(interviewId, state) {
        if (await this.findSaved(interviewId)) return { status: "ready" };
        const admitted = await SessionService.acquireLock("report-job", interviewId, JOB_TTL_SECONDS);
        if (!admitted) return { status: "generating" };
        try {
            // Recheck after admission in case another path just finished.
            if (await this.findSaved(interviewId)) {
                await SessionService.releaseLock("report-job", interviewId);
                return { status: "ready" };
            }
            await this.writeStatus(interviewId, "generating");
        } catch (error) {
            await SessionService.releaseLock("report-job", interviewId);
            throw error;
        }
        const job = new Promise(resolve => setImmediate(resolve))
            .then(() => this.generate(interviewId, state))
            .catch(async error => {
                await this.noteStatus(interviewId, "failed", SAFE_FAILURE);
                logError(error);
            })
            .finally(() => SessionService.releaseLock("report-job", interviewId))
            .catch(error => logError(error))
            .finally(() => this.jobs.delete(job));
        this.jobs.add(job);
        return { status: "generating" };
    }


    // Safe to call repeatedly or concurrently (the agent ending the
    // interview and the End button at the same moment):
    // - a report that's already saved is returned as-is
    // - only one caller generates; the others wait for its result
    static async generate(interviewId, state) {

        const existing = await this.findSaved(interviewId);

        if (existing) {
            await this.noteStatus(interviewId, "ready");
            return existing;
        }

        const acquired = await SessionService.acquireLock(

            "report",

            interviewId,

            LOCK_TTL_SECONDS

        );

        if (!acquired) {

            return await this.waitForReport(interviewId);

        }

        try {

            await this.noteStatus(interviewId, "generating");

            // =====================================================
            // Load Active Session
            // =====================================================

            const session = await SessionService.get(interviewId);

            if (!session) {

                // Another caller finished between our check and the lock
                const saved = await this.findSaved(interviewId);

                if (saved) {
                    await this.noteStatus(interviewId, "ready");
                    return saved;
                }

                throw new Error("Interview session not found.");

            }

            // =====================================================
            // Generate Report
            // Reuse one from an earlier attempt that failed while
            // saving, instead of paying for another LLM call
            // =====================================================

            const report = session.report ?? await generateInterviewReport(

                state,

                session

            );

            await SessionService.saveReport(

                interviewId,

                report

            );

            session.report = report;

            // =====================================================
            // Persist to Supabase (upserts, so a retry is safe)
            // =====================================================

            await PersistenceService.save(

                session

            );

            // =====================================================
            // Remove Redis Session (only after it's safely persisted)
            // =====================================================

            await SessionService.delete(

                interviewId

            );

            await this.noteStatus(interviewId, "ready");

            return report;

        }

        catch (error) {
            await this.noteStatus(interviewId, "failed", SAFE_FAILURE);
            throw error;
        }

        finally {

            await SessionService.releaseLock("report", interviewId);

        }

    }

    static async findSaved(interviewId) {

        const saved = await PersistenceService.getReport(interviewId);

        return saved?.report ?? null;

    }

    static async waitForReport(interviewId) {

        const deadline = Date.now() + LOCK_TTL_SECONDS * 1000;

        while (Date.now() < deadline) {

            await sleep(WAIT_STEP_MS);

            const saved = await this.findSaved(interviewId);

            if (saved) return saved;

            const record = await redis.get(this.statusKey(interviewId));
            if (record?.status === "failed") throw new Error(SAFE_FAILURE);

        }

        throw new Error("Timed out waiting for the report.");

    }

}
