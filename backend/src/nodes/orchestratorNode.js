import { log } from "../utils/logger.js";

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

        case "ANSWER":

            nextNode = "evaluator";
            break;

        // =====================================================
        // Candidate asked interviewer something
        // =====================================================

        case "CLARIFICATION":

        case "QUESTION":

        case "ACKNOWLEDGEMENT":

        case "SMALL_TALK":

        case "WRAP_UP":

        case "UNKNOWN":

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