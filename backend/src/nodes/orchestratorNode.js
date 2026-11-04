import { log } from "../utils/logger.js";
import { IntentType } from "../models/InterviewEnums.js";

export async function orchestratorNode(state) {

    const intent = state.candidate.intent?.intent;

    log("ORCHESTRATOR", {
        intent
    });

    let nextNode;

    switch (intent) {

        // =====================================================
        // Candidate answered interviewer
        // =====================================================

        case IntentType.ANSWER:

            nextNode = "evaluator";
            break;

        // =====================================================
        // Candidate asked interviewer something
        // =====================================================

        case IntentType.CLARIFICATION:

        case IntentType.QUESTION:

        case IntentType.ACKNOWLEDGEMENT:

        case IntentType.SMALL_TALK:

        case IntentType.WRAP_UP:

        case IntentType.UNKNOWN:

            nextNode = "conversationManager";
            break;

        default:

            nextNode = "conversationManager";

    }

    log("NEXT NODE", nextNode);

    return {

        nextNode

    };

}