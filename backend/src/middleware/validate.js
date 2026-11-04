import { z } from "zod";

// =====================================================
// Request validation with Zod
// Replaces req.body with the parsed (trimmed / stripped)
// value so controllers only see validated input.
// =====================================================

export function validate({ body, params }) {

    return (req, res, next) => {

        if (params) {

            const result = params.safeParse(req.params);

            if (!result.success) {

                return badRequest(res, result.error);

            }

        }

        if (body) {

            const result = body.safeParse(req.body ?? {});

            if (!result.success) {

                return badRequest(res, result.error);

            }

            req.body = result.data;

        }

        next();

    };

}

function badRequest(res, error) {

    return res.status(400).json({

        message: "Invalid request",

        errors: error.issues.map(i => ({

            path: i.path.join("."),

            message: i.message

        }))

    });

}

// =====================================================
// Shared schemas
// =====================================================

export const interviewId = z.string().uuid();

// Problem IDs are knowledge folder names; this also blocks "../"
export const problemId = z.string().regex(/^[a-z0-9_]{1,64}$/);

export const Schemas = {

    interviewParams: z.object({

        interviewId

    }),

    interviewBody: z.object({

        interviewId

    }),

    start: z.object({

        problemId,

        difficulty: z.enum(["SDE1", "SDE2", "Senior"])

    }),

    message: z.object({

        interviewId,

        message: z.string().trim().min(1).max(4000)

    }),

    graph: z.object({

        interviewId,

        graph: z.object({

            // passthrough keeps React Flow's extra fields
            // (position, data, style...) intact
            nodes: z.array(

                z.object({ id: z.string() }).passthrough()

            ).max(200),

            edges: z.array(

                z.object({

                    source: z.string(),

                    target: z.string()

                }).passthrough()

            ).max(400)

        })

    }),

    problemParams: z.object({

        problemId

    })

};
