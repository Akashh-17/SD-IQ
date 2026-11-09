import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";
import { redis } from "../config/redis.js";
import { SessionService } from "../services/interview/session.service.js";
import { logError } from "../utils/logger.js";
import { ReportService } from "../services/report/report.service.js";

const router = Router();

function scoreOnly(value) {

    const entries = Array.isArray(value) ? value : Object.entries(value ?? {}).map(([stage, score]) => ({ stage, score }));

    return entries.filter(item => item && typeof (item.stage ?? item.name) === "string")

        .map(item => ({ stage: item.stage ?? item.name, score: item.score ?? item.value }));

}

// Keep history compatible with existing clients; enrich each owned row
// with scores only. Never return report transcripts or candidate answers.
router.get("/", auth, async (req, res) => {

    try {

        const { data, error } = await supabase

            .from("interviews")

            .select("*")

            .eq("user_id", req.user.id)

            .order("started_at", { ascending: false });

        if (error) throw error;

        const interviews = data ?? [];

        const stages = new Map();

        // Batch owned IDs to bound REST URL length and avoid one query per report.
        for (let offset = 0; offset < interviews.length; offset += 100) {

            const ids = interviews.slice(offset, offset + 100).map(item => item.id);

            const { data: reports, error: reportError } = await supabase

                .from("reports")

                .select("interview_id,stage_breakdown")

                .in("interview_id", ids);

            if (reportError) throw reportError;

            for (const report of reports ?? [])

                stages.set(report.interview_id, scoreOnly(report.stage_breakdown));

        }

        const history = await Promise.all(interviews.map(async interview => {

            let status = interview.status;

            if (status === "ACTIVE") {

                const [live, reportState] = await Promise.all([

                    redis.get(SessionService.key(interview.interview_id)),

                    redis.get(`report:${interview.interview_id}:status`)

                ]);

                if (reportState?.status === "generating") {

                    const report = await ReportService.status(interview.interview_id);

                    status = report.status === "ready" ? "COMPLETED" : report.status.toUpperCase();

                }

                else if (reportState?.status === "failed") status = "FAILED";

                else if (!live || live.interview?.userId !== req.user.id) status = "EXPIRED";

            }

            return { ...interview, status, stage_breakdown: stages.get(interview.id) ?? [] };

        }));

        res.json(history);

    } catch (error) {

        logError(error);

        res.status(500).json({ message: "Unable to load interview history" });

    }

});

export default router;
