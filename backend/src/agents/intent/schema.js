import { z } from "zod";

export const IntentSchema = z.object({

  intent: z.enum([
    "ANSWER",
    "QUESTION",
    "ACKNOWLEDGEMENT",
    "SMALL_TALK",
    "CLARIFICATION",
    "WRAPUP",
    "UNKNOWN"
  ]),

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