export const InterviewStage = {
    INTRO: "intro",
    REQUIREMENTS: "requirements",
    HIGH_LEVEL: "high_level",
    DEEP_DIVE: "deep_dive",
    SCALING: "scaling",
    TRADEOFFS: "tradeoffs",
    WRAPUP: "wrapup",
};

export const CandidateLevel = {
    UNKNOWN: "unknown",
    BEGINNER: "beginner",
    INTERMEDIATE: "intermediate",
    ADVANCED: "advanced",
};

export const PlannerAction = {
    ASK_NEW: "ask_new",
    FOLLOW_UP: "follow_up",
    ANSWER_CANDIDATE: "answer_candidate",
    ACKNOWLEDGE: "acknowledge",
    MOVE_TOPIC: "move_topic",
    WRAP_UP: "wrap_up",
};

// Single source of truth for intent labels. The intent schema,
// prompt, orchestrator and decision engine must all use these.
export const IntentType = {
    ANSWER: "ANSWER",
    QUESTION: "QUESTION",
    ACKNOWLEDGEMENT: "ACKNOWLEDGEMENT",
    SMALL_TALK: "SMALL_TALK",
    CLARIFICATION: "CLARIFICATION",
    WRAP_UP: "WRAP_UP",
    UNKNOWN: "UNKNOWN",
};