// ======================================================
// Intent
// ======================================================

export function buildIntentContext(state) {

    return {

        latestMessage:
            state.candidate.latestMessage,

        interviewStage:
            state.interview.stage

    };

}

// ======================================================
// Evaluator
// ======================================================

export function buildEvaluatorContext(state) {

    return {

        problem:
            state.knowledge.problem,

        evaluationRubric:
            state.knowledge.evaluation,

        architectureKnowledge:
            state.knowledge.architecture,

        currentStage:
            state.interview.stage,

        currentQuestion:
            state.interview.currentQuestion,

        currentObjective:
            state.interview.objective,

        candidateAnswer:
            state.candidate.latestMessage,

        interviewSummary:
            state.memory.summary,

        graphAnalysis:
            state.graphAnalysis

    };

}

// ======================================================
// Conversation
// ======================================================

export function buildConversationContext(
    state,
    decision
) {

    return {

        decision,

        interview: {

            stage:
                state.interview.stage,

            question:
                state.interview.currentQuestion,

            objective:
                state.interview.objective,

            progress:
                state.interview.progress

        },

        evaluation:
            state.candidate.evaluation,

        summary:
            state.memory.summary

    };

}

// ======================================================
// Interviewer
// ======================================================
export function buildInterviewerContext(state) {

    return {

        ...state,

        graphAnalysis:

            state.graphAnalysis

    };

}