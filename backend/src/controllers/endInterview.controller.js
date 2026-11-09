import { logError } from "../utils/logger.js";
import { agent } from "./interview.controller.js";
import { ReportService } from "../services/report/report.service.js";

export async function endInterview(req, res) {

    try {

        const { interviewId } = req.body;

        if (await ReportService.findSaved(interviewId)) {
            return res.status(200).json({ status: "ready" });
        }

        // =====================================================
        // Load LangGraph State
        // =====================================================

        const graphState = await agent.getState({

            configurable: {

                thread_id: interviewId

            }

        });

        if (!graphState?.values?.interview) {

            return res.status(404).json({

                message: "Interview state not found."

            });

        }

        const result = await ReportService.start(interviewId, graphState.values);

        res.status(result.status === "ready" ? 200 : 202).json(result);

    }

    catch (err) {

        logError(err);

        res.status(500).json({

            message: "Unable to start report generation. Please try again."

        });

    }

}