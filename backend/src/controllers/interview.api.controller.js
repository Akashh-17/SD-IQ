import { InterviewService } from "../services/interview/interview.service.js";

export async function sendMessage(req, res) {

    try {

        const {

            interviewId,

            message

        } = req.body;

        const {

            reply,

            completed

        } = await InterviewService.sendMessage(

            interviewId,

            message

        );

        res.json({

            reply,

            // true when the interview ended this turn and the
            // report has been generated
            completed

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            message: err.message

        });

    }

}