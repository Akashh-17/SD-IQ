import { classifyIntent } from "../agents/intent/agent.js";
import { SessionManager } from "../services/sessionManager.js";
import { log } from "../utils/logger.js";

export async function intentNode(state) {

    const result = await classifyIntent(
        state.candidate.latestMessage
    );

    log("INTENT", {

        message: state.candidate.latestMessage,

        intent: result.intent

    });

    return SessionManager.setIntent(
        state,
        result
    );

}