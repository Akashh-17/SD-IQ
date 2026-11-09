import { ChatOpenAI } from "@langchain/openai";
import { ZodError } from "zod";
import { llm, llmFast } from "../../services/llm.js";
import { MOCK_MODE } from "../../services/mock/mode.js";
import { KnowledgeBundleSchema } from "../../knowledge/schema.js";
import { TopicClassificationSchema } from "./schema.js";
import { classifyTopicPrompt, generateProblemPrompt, topicData } from "./prompt.js";

const generatorModel = process.env.PROBLEM_GENERATOR_MODEL || process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl:free";

const generator = MOCK_MODE ? llm : new ChatOpenAI({
    model: generatorModel,
    temperature: 0.2,
    modelKwargs: generatorModel === "nvidia/nemotron-3.5-super-vl:free" ? { reasoning: { enabled: false } } : undefined,
    maxTokens: 16384,
    timeout: Number(process.env.PROBLEM_GENERATOR_TIMEOUT_MS) || 45000,
    maxRetries: 0,
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: { baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1" }
});

function failure(message, code) {
    return Object.assign(new Error(message), { status: 502, code });
}

export async function classifyTopic(topic, candidates) {
    try {
        const result = await llmFast.withStructuredOutput(TopicClassificationSchema).invoke([
            { role: "system", content: classifyTopicPrompt },
            { role: "user", content: topicData({ topic, candidates: candidates.map(({ id, title, description }) => ({ id, title, description })) }) }
        ]);
        return TopicClassificationSchema.parse(result);
    } catch {
        throw failure("We couldn’t check that topic. Please try again.", "TOPIC_CHECK_FAILED");
    }
}

export async function generateProblem(topic, id) {
    const structured = generator.withStructuredOutput(KnowledgeBundleSchema, {
        name: "system_design_knowledge", method: "functionCalling", includeRaw: true
    });
    let validationIssues = [];
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const response = await structured.invoke([
                { role: "system", content: generateProblemPrompt },
                { role: "user", content: topicData({ topic, problemId: id, validationRetry: attempt > 0, validationIssues, reminder: "Honor every cross-file invariant, required rubric criterion and numeric calculation." }) }
            ]);
            const pack = KnowledgeBundleSchema.parse(response.parsed ?? response.raw?.tool_calls?.[0]?.args);
            if (pack.problem.id !== id) throw new ZodError([{ code: "custom", path: ["problem", "id"], message: "Use the requested identifier" }]);
            return pack;
        } catch (error) {
            const invalidOutput = error instanceof ZodError || error?.name === "OutputParserException" || error?.lc_error_code === "OUTPUT_PARSING_FAILURE";
            if (!invalidOutput) throw failure("We couldn’t prepare that interview right now. Please try again.", "GENERATION_UNAVAILABLE");
            validationIssues = error instanceof ZodError ? error.issues.slice(0, 12).map(issue => ({ path: issue.path.join("."), message: issue.message.slice(0, 180) })) : [{ path: "", message: "Return a complete object matching the structured schema." }];
            if (attempt === 1) throw failure("The generated brief could not be validated. Please try again.", "INVALID_KNOWLEDGE_PACK");
        }
    }
}
