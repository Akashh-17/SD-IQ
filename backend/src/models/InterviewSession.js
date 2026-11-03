import {
    InterviewStage,
    CandidateLevel,
} from "./InterviewEnums.js";

export function createInterviewSession() {
    return {

        stage: InterviewStage.INTRO,

        difficulty: 1,

        candidateLevel: CandidateLevel.UNKNOWN,

        currentTopic: null,

        currentQuestion: null,

        followupDepth: 0,

        pendingAction: null,

        interviewSummary: "",

        askedQuestions: [],

        coveredTopics: [],

        evaluations: [],

        strengths: [],

        weaknesses: [],

        missingConcepts: [],

        notes: [],

        lastIntent: null,

        lastEvaluation: null,

        lastPlannerAction: null,

        lastResponseType: null,

    };
}