import { z } from "zod";

export const GraphAnalysisSchema = z.object({

    components: z.array(

        z.object({

            name: z.string(),

            type: z.string(),

            purpose: z.string()

        })

    ),

    connections: z.array(

        z.object({

            from: z.string(),

            to: z.string()

        })

    ),

    strengths: z.array(z.string()),

    issues: z.array(z.string()),

    missingComponents: z.array(z.string()),

    summary: z.string()

});
