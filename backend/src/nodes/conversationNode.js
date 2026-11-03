import { decideConversation } from "../agents/conversation/agent.js";
import { buildConversationContext } from "../services/contextBuilder.js";
import { SessionManager } from "../services/sessionManager.js";
import { decideNextAction } from "../services/decisionEngine.js";
import { log } from "../utils/logger.js";

export async function conversationNode(state) {

    // --------------------------------------------
    // JS decides interview flow
    // --------------------------------------------

    const decision = decideNextAction(state);

    log("DECISION", decision);

    // --------------------------------------------
    // LLM decides conversation style
    // --------------------------------------------

    const context = buildConversationContext(

        state,

        decision

    );

    const style = await decideConversation(context);

    log("CONVERSATION", style);

    return SessionManager.applyConversationDecision(

        state,

        {

            ...decision,

            ...style

        }

    );

}