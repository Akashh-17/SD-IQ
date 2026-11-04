import { supabase } from "../config/supabase.js";
import { SessionService } from "../services/interview/session.service.js";

// =====================================================
// Ownership guard (run after `auth`)
// Rejects requests for interviews that belong to another user.
// Live interviews are checked against the Redis session;
// finished ones (session removed) against Supabase.
// =====================================================

export async function ownsInterview(req, res, next) {

    try {

        const interviewId =

            req.params.interviewId ??

            req.body?.interviewId;

        if (!interviewId) {

            return res.status(400).json({

                message: "interviewId is required"

            });

        }

        let ownerId;

        const session = await SessionService.get(interviewId);

        if (session) {

            ownerId = session.interview?.userId;

        }

        else {

            const { data } = await supabase

                .from("interviews")

                .select("user_id")

                .eq("interview_id", interviewId)

                .maybeSingle();

            ownerId = data?.user_id;

        }

        if (!ownerId) {

            return res.status(404).json({

                message: "Interview not found"

            });

        }

        // 404 rather than 403, so other users' interview IDs
        // can't be confirmed to exist
        if (ownerId !== req.user.id) {

            return res.status(404).json({

                message: "Interview not found"

            });

        }

        next();

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            message: "Ownership check failed"

        });

    }

}
