import { Router } from "express";
import crypto from "crypto";

import { auth } from "../middleware/auth.js";
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
router.post("/start", auth, async (req, res) => {

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

        console.error(err);

        res.status(500).json({

            message: err.message

        });

    }

});

router.post("/initialize", auth, initializeInterview);

router.post("/message", auth, sendMessage);

router.post("/graph", auth, saveGraph);

router.post("/end", auth, endInterview);

router.get("/state/:interviewId", auth, getInterviewState);

export default router;