import { agent } from "./interview.controller.js";
import { ReportService } from "../services/report/report.service.js";

export async function endInterview(req, res) {

    try {

        const { interviewId } = req.body;

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

        // =====================================================
        // Generate Report
        // Safe to repeat: returns the saved report if the interview
        // already ended (e.g. the candidate said "wrap up"), and
        // waits if another request is generating it right now.
        // =====================================================

        await ReportService.generate(

            interviewId,

            graphState.values

        );

        res.json({

            success: true,

            interviewId

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            message: err.message

        });

    }

}