import { Router } from "express";
import { ProblemService } from "../services/problem/problem.service.js";
import { CustomProblemService } from "../services/problem/customProblem.service.js";
import { auth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validate, Schemas } from "../middleware/validate.js";

const router = Router();

function optionalAuth(req, res, next) {
    return req.get("Authorization") !== undefined ? auth(req, res, next) : next();
}

function failure(res, error, fallback) {
    const status = error?.status ?? (error?.code === "ENOENT" ? 404 : 500);
    return res.status(status).json({
        message: error?.status ? error.message : status === 404 ? "Problem not found" : fallback,
        ...(error?.status && error.code ? { code: error.code } : {}),
        ...(error?.suggestion ? { suggestion: error.suggestion } : {})
    });
}

// Authentication and the per-user budget run before topic validation.
router.post("/custom", auth,
    rateLimit({ name: "custom-problem", limit: 5, windowSeconds: 3600 }),
    validate({ body: Schemas.customProblem }),
    async (req, res) => {
        try {
            const candidates = await ProblemService.getAll(req.user.id);
            const result = await CustomProblemService.create(req.user.id, req.body.topic, candidates);
            res.status(result.matched ? 200 : 201).json(result);
        } catch (error) {
            failure(res, error, "We couldn’t prepare that interview. Please try again.");
        }
    }
);

// Public browsing retains built-ins; only authenticated owners see custom briefs.
router.get("/", optionalAuth, async (req, res) => {
    try {
        res.json(await ProblemService.getAll(req.user?.id));
    } catch (error) {
        failure(res, error, "Unable to load problems");
    }
});

router.get("/:problemId", optionalAuth, async (req, res) => {
    try {
        res.json(await ProblemService.get(req.params.problemId, req.user?.id));
    } catch (error) {
        failure(res, error, "Unable to load this problem");
    }
});

export default router;
