import { InterviewService } from "../services/interview/interview.service.js";

export async function initializeInterview(req, res) {

    try {

        const { interviewId } = req.body;

        const result = await InterviewService.initialize(interviewId);

        const reply = result.messages?.at(-1)?.content;

        res.json({

            reply

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            message: err.message

        });

    }

}