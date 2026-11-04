import { SessionService } from "../interview/session.service.js";
import { PersistenceService } from "../interview/persistence.service.js";
import { generateInterviewReport } from "./reportGenerator.js";

// Longer than the slowest report LLM call; the lock expires on its
// own if the process crashes mid-generation
const LOCK_TTL_SECONDS = 120;

const WAIT_STEP_MS = 1000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export class ReportService {

    // Safe to call repeatedly or concurrently (the agent ending the
    // interview and the End button at the same moment):
    // - a report that's already saved is returned as-is
    // - only one caller generates; the others wait for its result
    static async generate(interviewId, state) {

        const existing = await this.findSaved(interviewId);

        if (existing) return existing;

        const acquired = await SessionService.acquireLock(

            "report",

            interviewId,

            LOCK_TTL_SECONDS

        );

        if (!acquired) {

            return await this.waitForReport(interviewId);

        }

        try {

            // =====================================================
            // Load Active Session
            // =====================================================

            const session = await SessionService.get(interviewId);

            if (!session) {

                // Another caller finished between our check and the lock
                const saved = await this.findSaved(interviewId);

                if (saved) return saved;

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

            return report;

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

        }

        throw new Error("Timed out waiting for the report.");

    }

}
