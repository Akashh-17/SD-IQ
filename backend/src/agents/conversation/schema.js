import { z } from "zod";

export const ConversationSchema = z.object({

    acknowledge: z.boolean(),

    acknowledgement: z.string(),

    tone: z.enum([

        "NEUTRAL",

        "ENCOURAGING",

        "CHALLENGING",

        "CURIOUS"

    ]),

    hintLevel: z.enum([

        "NONE",

        "MINIMAL",

        "MEDIUM"

    ]),

    responseStyle: z.enum([

        "DIRECT",

        "SOCRATIC",

        "CONVERSATIONAL"

    ])

});