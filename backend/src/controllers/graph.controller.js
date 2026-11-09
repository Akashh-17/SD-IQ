import { logError } from "../utils/logger.js";
import { GraphService } from "../services/graph/graph.service.js";
import { InterviewService } from "../services/interview/interview.service.js";

export async function saveGraph(req, res) {

    try {

        const {

            interviewId,

            graph

        } = req.body;

        // Save graph into Redis (cheap, runs on every autosave)
        const result = await GraphService.update(

            interviewId,

            graph

        );

        if (!result) {

            return res.status(404).json({

                message: "Interview not found"

            });

        }

        // Analyze only structural changes, debounced so a burst of
        // edits results in a single LLM call
        if (result.changed) {

            GraphService.scheduleAnalysis(

                interviewId,

                () => InterviewService.analyzeGraph(interviewId)

            );

        }

        res.json({

            success: true

        });

    }

    catch (err) {

        logError(err);

        res.status(500).json({

            message: err.message

        });

    }

}
