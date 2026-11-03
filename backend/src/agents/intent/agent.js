import { llm } from "../../services/llm.js";
import { IntentSchema } from "./schema.js";
import { intentPrompt } from "./prompt.js";

const structured = llm.withStructuredOutput(IntentSchema);

export async function classifyIntent(message) {

    return await structured.invoke([

        {
            role: "system",
            content: intentPrompt
        },

        {
            role: "user",
            content: message
        }

    ]);

}