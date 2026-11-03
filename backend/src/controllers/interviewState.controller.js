import { SessionService } from "../services/interview/session.service.js";

export async function getInterviewState(req, res) {

    try {

        const { interviewId } = req.params;

        const session = await SessionService.get(interviewId);

        if (!session) {

            return res.status(404).json({

                message: "Interview not found"

            });

        }

        res.json({

            interview: session.interview,

            transcript: session.transcript,

            graph: session.graph,

            report: session.report

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            message: err.message

        });

    }

}