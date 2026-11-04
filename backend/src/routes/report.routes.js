import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { validate, Schemas } from "../middleware/validate.js";
import { PersistenceService } from "../services/interview/persistence.service.js";

const router = Router();

router.get(

    "/:interviewId",

    auth,

    validate({ params: Schemas.interviewParams }),

    async (req, res) => {

        try {

            const result = await PersistenceService.getReport(

                req.params.interviewId

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

            console.error(err);

            res.status(500).json({

                message: err.message

            });

        }

    }

);

export default router;
