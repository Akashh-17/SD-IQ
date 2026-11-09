import { z } from "zod";

export const TopicClassificationSchema = z.strictObject({
    classification: z.enum(["SYSTEM_DESIGN", "LOW_LEVEL_DESIGN", "NOT_A_DESIGN_PROBLEM"]),
    matchedProblemId: z.string().regex(/^[a-z0-9_]{1,64}$/).nullable(),
    suggestedHldTopic: z.string().trim().min(3).max(120).nullable()
});
