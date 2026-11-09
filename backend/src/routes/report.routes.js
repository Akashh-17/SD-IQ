import { logError } from "../utils/logger.js";
import { Router } from "express";
import { ownsInterview } from "../middleware/ownsInterview.js";
import { ReportService } from "../services/report/report.service.js";
import { auth } from "../middleware/auth.js";
import { validate, Schemas } from "../middleware/validate.js";
import { PersistenceService } from "../services/interview/persistence.service.js";

const router = Router();

router.get(
    "/:interviewId/status",
    auth,
    validate({ params: Schemas.interviewParams }),
    ownsInterview,
    async (req, res) => {
        try {
            res.set("Cache-Control", "no-store");
            res.json(await ReportService.status(req.params.interviewId));
        } catch (error) {
            logError(error);
            res.status(503).json({ message: "Report status is temporarily unavailable." });
        }
    }
);


router.get(

    "/:interviewId",

    auth,

    validate({ params: Schemas.interviewParams }),

    async (req, res) => {

        try {

            const result = await PersistenceService.getReport(

                req.params.interviewId,

                { userId: req.user.id, includeGraph: true }

            );

            // Someone else's report is reported as missing, so its
            // existence (and transcript) is never exposed
            if (
                !result ||
                result.interview.user_id !== req.user.id
            ) {

                return res.status(404).json({

                    message: "Report not found"

                });

            }

            res.json(result);

        }

        catch (err) {

            logError(err);

            res.status(500).json({

                message: err.message

            });

        }

    }

);

export default router;
