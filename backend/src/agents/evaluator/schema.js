import { z } from "zod";

export const MentionedTopicSchema = z.object({

    topic: z.string(),

    needsProbe: z.boolean(),

    explanationQuality: z.enum([
        "POOR",
        "FAIR",
        "GOOD",
        "EXCELLENT"
    ])

});

export const EvaluationSchema = z.object({

    answeredCurrentQuestion: z.boolean(),

    score: z.number().min(0).max(10),

    candidateLevel: z.enum([
        "BEGINNER",
        "INTERMEDIATE",
        "ADVANCED",
        "STRONG"
    ]),

    strengths: z.array(z.string()),

    weaknesses: z.array(z.string()),

    architectureChoices: z.array(z.string()),

    assumptions: z.array(z.string()),

    mentionedTopics: z.array(MentionedTopicSchema),

    completedCriteria: z.array(z.string()),

    criticalMissingConcepts: z.array(z.string()),

    reasoning: z.string()

});