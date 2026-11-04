import { Router } from "express";
import crypto from "crypto";

import { auth } from "../middleware/auth.js";
import { ownsInterview } from "../middleware/ownsInterview.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validate, Schemas } from "../middleware/validate.js";
import { SessionService } from "../services/interview/session.service.js";
import { ProblemService } from "../services/problem/problem.service.js";
import { sendMessage } from "../controllers/interview.api.controller.js";
import { saveGraph } from "../controllers/graph.controller.js";
import { endInterview } from "../controllers/endInterview.controller.js";
import { getInterviewState } from "../controllers/interviewState.controller.js";
import { initializeInterview } from "../controllers/initializeInterview.controller.js";

const router = Router();

/**
 * Start a new interview
 */
router.post(
    "/start",
    auth,
    rateLimit({ name: "start", limit: 10 }),
    validate({ body: Schemas.start }),
    async (req, res) => {

    try {

        const {

            problemId,

            difficulty

        } = req.body;

        const problem = await ProblemService.get(problemId);

        const interviewId = crypto.randomUUID();

        await SessionService.create(

            interviewId,

            req.user.id,

            {

                problemId: problem.id,

                title: problem.title,

                difficulty,

                problemDifficulty: problem.problemDifficulty

            }

        );

        res.json({

            interviewId

        });

    }

    catch (err) {

        if (err.code === "ENOENT") {

            return res.status(404).json({

                message: "Problem not found"

            });

        }

        console.error(err);

        res.status(500).json({

            message: err.message

        });

    }

});

// Every route below: logged in, valid input, and the
// interview must belong to the caller

router.post(
    "/initialize",
    auth,
    validate({ body: Schemas.interviewBody }),
    ownsInterview,
    initializeInterview
);

router.post(
    "/message",
    auth,
    rateLimit({ name: "message", limit: 30 }),
    validate({ body: Schemas.message }),
    ownsInterview,
    sendMessage
);

router.post(
    "/graph",
    auth,
    // Autosave fires at most every 500ms while editing
    rateLimit({ name: "graph", limit: 240 }),
    validate({ body: Schemas.graph }),
    ownsInterview,
    saveGraph
);

router.post(
    "/end",
    auth,
    rateLimit({ name: "end", limit: 10 }),
    validate({ body: Schemas.interviewBody }),
    ownsInterview,
    endInterview
);

router.get(
    "/state/:interviewId",
    auth,
    validate({ params: Schemas.interviewParams }),
    ownsInterview,
    getInterviewState
);

export default router;