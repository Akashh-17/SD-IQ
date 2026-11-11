import { logError } from "../utils/logger.js";
import { SessionService } from "../services/interview/session.service.js";
import { agent } from "./interview.controller.js";

export async function getInterviewState(req, res) {

    try {

        const { interviewId } = req.params;

        const session = await SessionService.get(interviewId);

        if (!session) {

            return res.status(404).json({

                message: "Interview not found"

            });

        }

        // Keep session reads available even if the optional live-stage lookup fails.
        let stage;
        try {
            const state = await agent?.getState({ configurable: { thread_id: interviewId } });
            stage = state?.values?.interview?.stage;
        } catch { /* Existing metadata/graph remains useful during checkpoint outages. */ }

        res.json({

            interview: { ...session.interview, ...(typeof stage === "string" ? { stage } : {}) },

            transcript: session.transcript,

            graph: session.graph,

            // Full whiteboard drawing, so the canvas restores exactly on reload
            scene: session.scene ?? null,

            report: session.report

        });

    }

    catch (err) {

        logError(err);

        res.status(500).json({

            message: err.message

        });

    }

}
