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
// Only what the interviewer prompt uses. Sending the whole state
// (full knowledge base, every message and evaluation) made each
// turn slower and more expensive as the interview went on.
export function buildInterviewerContext(state) {

    const conversation = state.conversation ?? {};

    return {

        problem:
            state.knowledge.problem,

        interview: {

            stage:
                state.interview.stage,

            progress:
                state.interview.progress,

            // After MOVE_TOPIC this is already the next stage's
            // entry question
            currentQuestion:
                state.interview.currentQuestion,

            objective: {

                name:
                    state.interview.objective?.name,

                description:
                    state.interview.objective?.description

            }

        },

        decision: {

            decision:
                conversation.decision,

            targetTopic:
                conversation.targetTopic,

            targetConcept:
                conversation.targetConcept,

            reason:
                conversation.reason,

            // The ANSWER instructions read this field; it was never
            // filled in before, so pass the candidate's own message
            candidateQuestion:

                conversation.decision === "ANSWER"

                    ? state.candidate.latestMessage

                    : ""

        },

        style: {

            tone:
                conversation.tone,

            responseStyle:
                conversation.responseStyle,

            hintLevel:
                conversation.hintLevel,

            acknowledge:
                conversation.acknowledge,

            acknowledgement:
                conversation.acknowledgement

        },

        candidate: {

            level:
                state.candidate.level,

            latestMessage:
                state.candidate.latestMessage

        },

        conversationSummary:
            state.memory?.summary ?? "",

        // Avoid repeating recent questions
        previousQuestions:
            (state.memory?.previousQuestions ?? []).slice(-5),

        graphAnalysis:
            state.graphAnalysis

    };

}