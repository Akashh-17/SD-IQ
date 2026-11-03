import { Router } from "express";
import { ProblemService } from "../services/problem/problem.service.js";

const router = Router();

// =====================================================
// All Problems
// =====================================================

router.get("/", async (_, res) => {

    try {

        const problems =

            await ProblemService.getAll();

        res.json(problems);

    }

    catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

});

// =====================================================
// Single Problem
// =====================================================

router.get("/:problemId", async (req, res) => {

    try {

        const problem =

            await ProblemService.get(

                req.params.problemId

            );

        res.json(problem);

    }

    catch {

        res.status(404).json({

            message: "Problem not found"

        });

    }

});

export default router;