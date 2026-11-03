import { GraphService } from "../services/graph/graph.service.js";
import { InterviewService } from "../services/interview/interview.service.js";

export async function saveGraph(req, res) {

    try {

        const {

            interviewId,

            graph

        } = req.body;

        // Save graph into Redis

        await GraphService.update(

            interviewId,

            graph

        );

        // Run graph analysis

        await InterviewService.analyzeGraph(

            interviewId

        );

        res.json({

            success: true

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            message: err.message

        });

    }

}