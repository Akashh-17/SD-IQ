import { InterviewService } from "../services/interview/interview.service.js";

export async function sendMessage(req, res) {

    try {

        const {

            interviewId,

            message

        } = req.body;

        const reply = await InterviewService.sendMessage(

            interviewId,

            message

        );

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