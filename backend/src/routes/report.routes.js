import { Router } from "express";
import { PersistenceService } from "../services/interview/persistence.service.js";

const router = Router();

router.get(

    "/:interviewId",

    async (req, res) => {

        try {

            const result = await PersistenceService.getReport(

                req.params.interviewId

            );

            if (!result) {

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