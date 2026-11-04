import { z } from "zod";
import { IntentType } from "../../models/InterviewEnums.js";

export const IntentSchema = z.object({

  intent: z.enum(Object.values(IntentType)),

  nextAction: z.enum([
    "EVALUATE_ANSWER",
    "ANSWER_QUESTION",
    "ACKNOWLEDGE",
    "REPEAT_QUESTION",
    "END_INTERVIEW",
    "NONE"
  ]),

  confidence: z.number().min(0).max(1),

  reasoning: z.string()

});