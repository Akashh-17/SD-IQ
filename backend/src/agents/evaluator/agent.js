import { llm } from "../../services/llm.js";
import { evaluatorPrompt } from "./prompt.js";
import { EvaluationSchema } from "./schema.js";

const structured = llm.withStructuredOutput(
    EvaluationSchema
);

export async function evaluateAnswer(context) {

    return await structured.invoke([

        {

            role: "system",

            content: evaluatorPrompt,

        },

        {

            role: "user",

            content: JSON.stringify(context, null, 2)

        }

    ]);

}