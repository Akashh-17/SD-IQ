import { llm } from "../../services/llm.js";
import { interviewerPrompt } from "./prompt.js";

export async function generateInterviewerResponse(state) {

    const response = await llm.invoke([

        {
            role: "system",
            content: interviewerPrompt
        },

        {
            role: "user",
            content: JSON.stringify(state, null, 2)
        }

    ]);

    return response.content.trim();

}