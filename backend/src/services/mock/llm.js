import { IntentSchema } from "../../agents/intent/schema.js";
import { EvaluationSchema } from "../../agents/evaluator/schema.js";
import { ConversationSchema } from "../../agents/conversation/schema.js";
import { GraphAnalysisSchema } from "../../agents/graph/schema.js";
import { TopicClassificationSchema } from "../../agents/problemGenerator/schema.js";
import { KnowledgeBundleSchema } from "../../knowledge/schema.js";
import { mockTopicData, mockTopicClassification, mockProblemPack } from "./problemGenerator.js";

function content(input) {
    return typeof input === "string" ? input : input.at(-1)?.content ?? "";
}
function context(input) {
    try { return JSON.parse(content(input)); } catch { return {}; }
}
function classify(message) {
    const text = message.toLowerCase().trim();
    let intent = "ANSWER", nextAction = "EVALUATE_ANSWER";
    if (/wrap.?up|let.?s (wrap|finish|end)|end (the )?interview|stop interview/.test(text)) [intent, nextAction] = ["WRAP_UP", "END_INTERVIEW"];
    else if (/^(hi|hello|hey)[!. ]*$/.test(text)) [intent, nextAction] = ["SMALL_TALK", "ACKNOWLEDGE"];
    else if (/^(ok|okay|thanks|ready|yes|sure|let.?s begin)[!. ]*$/.test(text)) [intent, nextAction] = ["ACKNOWLEDGEMENT", "ACKNOWLEDGE"];
    else if (/should we|do we need|clarif|what.*(scope|scale|users)/.test(text)) [intent, nextAction] = ["CLARIFICATION", "ANSWER_QUESTION"];
    else if (text.endsWith("?")) [intent, nextAction] = ["QUESTION", "ANSWER_QUESTION"];
    else if (text.length < 10) [intent, nextAction] = ["UNKNOWN", "NONE"];
    return { intent, nextAction, confidence: 1, reasoning: "Deterministic offline classification." };
}

export class MockLLM {
    withStructuredOutput(schema, options = {}) {
        return { invoke: async input => {
            const ctx = context(input);
            let result;
            if (schema === TopicClassificationSchema) result = mockTopicClassification(mockTopicData(input));
            else if (schema === KnowledgeBundleSchema) result = mockProblemPack(mockTopicData(input));
            else if (schema === IntentSchema) result = classify(content(input));
            else if (schema === EvaluationSchema) {
                const answered = (ctx.candidateAnswer ?? "").trim().length >= 20;
                result = {
                    answeredCurrentQuestion: answered, score: answered ? 7 : 2,
                    candidateLevel: answered ? "INTERMEDIATE" : "BEGINNER",
                    strengths: answered ? ["Explains a concrete design approach."] : [],
                    weaknesses: ["Explore failure handling and quantify capacity."],
                    architectureChoices: [], assumptions: [], mentionedTopics: [],
                    completedCriteria: answered ? (ctx.currentObjective?.completionCriteria ?? []).map(c => c.name) : [],
                    criticalMissingConcepts: [], reasoning: "Offline fixture score; not a real assessment."
                };
            } else if (schema === ConversationSchema) result = {
                acknowledge: true, acknowledgement: "Thanks for explaining your approach.",
                tone: "ENCOURAGING", hintLevel: "NONE", responseStyle: "CONVERSATIONAL"
            };
            else if (schema === GraphAnalysisSchema) {
                const graph = JSON.parse(content(input).split("Graph:").at(-1).trim());
                result = {
                    components: (graph.nodes ?? []).map(node => ({ name: node.label || node.type || "Component", type: node.type || "unknown", purpose: "Candidate-provided diagram component." })),
                    connections: graph.edges ?? [], strengths: [], issues: [], missingComponents: [],
                    summary: "Offline diagram fixture: review connectivity and failure handling."
                };
            }
            else throw new Error("Unsupported mock structured-output schema");
            // Validate using the caller's exact schema, never bypass Zod.
            const parsed = schema.parse(result);
            return options.includeRaw ? { parsed, raw: null } : parsed;
        } };
    }
    async invoke(input) {
        if (typeof input === "string") {
            return { content: JSON.stringify({
                overallScore: 0, candidateLevel: "INTERMEDIATE",
                summary: "Offline practice interview completed. Scores are deterministic demo fixtures.",
                strengths: ["Communicates a concrete approach."], weaknesses: ["Discuss more failure scenarios."],
                recommendations: ["Quantify capacity and explain tradeoffs."], stageBreakdown: []
            }) };
        }
        const ctx = context(input);
        const decision = ctx.decision ?? {};
        const question = ctx.interview?.currentQuestion ?? "How would you approach the design?";
        const replies = {
            FOLLOW_UP: `Let's focus on the current question. ${question}`,
            PROBE_TOPIC: `You mentioned ${decision.targetTopic}. What happens when that component fails?`,
            ASK_MISSING: `How would you handle ${decision.targetConcept || decision.targetTopic} in your design?`,
            MOVE_TOPIC: `Thanks, let's move to the next stage. ${question}`,
            ANSWER: "For this practice session, assume one million daily users and focus on the core backend flows. What assumptions would you make next?",
            END_INTERVIEW: "Thank you for walking through your design. You described a clear approach; continue practicing capacity estimates and failure handling."
        };
        return { content: replies[decision.decision] ?? question };
    }
}
