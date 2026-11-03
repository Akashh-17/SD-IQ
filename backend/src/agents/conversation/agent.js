import { llm } from "../../services/llm.js";
import { conversationPrompt } from "./prompt.js";
import { ConversationSchema } from "./schema.js";

const structured =
    llm.withStructuredOutput(
        ConversationSchema
    );

export async function decideConversation(context) {

    return await structured.invoke([

        {

            role: "system",

            content: conversationPrompt

        },

        {

            role: "user",

            content: JSON.stringify(
                context,
                null,
                2
            )

        }

    ]);

}