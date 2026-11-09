import { llm } from "../../services/llm.js";
import { interviewerPrompt } from "./prompt.js";
import { setTimeout as delay } from "node:timers/promises";

export async function generateInterviewerResponse(state, config) {

    const input = [
        { role: "system", content: interviewerPrompt },
        { role: "user", content: JSON.stringify(state, null, 2) }
    ];

    if (!config?.configurable?.streamInterview) {
        return (await llm.invoke(input, config)).content.trim();
    }

    let reply = "";
    const emit = text => {
        config.signal?.throwIfAborted();
        reply += text;
        config.writer?.({ type: "interviewer-token", text });
    };

    if (process.env.MOCK_MODE === "true") {
        // Keep the mock model untouched: simulate incremental provider chunks here.
        const response = await llm.invoke(input, config);
        for (const text of response.content.trim().match(/\S+\s*/g) ?? []) {
            await delay(12, undefined, { signal: config.signal });
            emit(text);
        }
    } else {
        for await (const chunk of await llm.stream(input, config)) {
            const text = typeof chunk.content === "string" ? chunk.content :
                chunk.content.filter(block => block.type === "text").map(block => block.text).join("");
            if (text) emit(text);
        }
    }

    return reply.trim();
}
