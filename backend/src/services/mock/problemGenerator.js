import fs from "node:fs";
import path from "node:path";
import { KNOWLEDGE_DIR } from "../../config/paths.js";

export function mockTopicData(input) {
    const body = input.at(-1)?.content ?? "";
    return JSON.parse(body.replace(/^<problem_request_json>\n/, "").replace(/\n<\/problem_request_json>$/, ""));
}
const normalized = value => value.toLowerCase().replace(/\b(design|a|an|the|system|service)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

export function mockTopicClassification({ topic, candidates = [] }) {
    if (/\b(classes|class diagram|oop|object.oriented|design patterns|data structure|implement.*algorithm)\b/i.test(topic)) {
        return { classification: "LOW_LEVEL_DESIGN", matchedProblemId: null, suggestedHldTopic: "Design a scalable parking management system" };
    }
    if (!/\b(design|system|service|platform|leetcode|payments?|google docs|application|app)\b/i.test(topic) || /\b(recipe|pasta|poem|weather|greeting)\b/i.test(topic)) {
        return { classification: "NOT_A_DESIGN_PROBLEM", matchedProblemId: null, suggestedHldTopic: null };
    }
    const topicKey = normalized(topic);
    const match = candidates.find(item => normalized(item.title) === topicKey || normalized(item.id.replaceAll("_", " ")) === topicKey || (topicKey === "url shortener" && /url.shortening/i.test(item.description)));
    return { classification: "SYSTEM_DESIGN", matchedProblemId: match?.id ?? null, suggestedHldTopic: null };
}

export function mockProblemPack({ topic, problemId }) {
    // Offline fixture only: production always generates topic-specific architecture.
    const folder = path.join(KNOWLEDGE_DIR, "url_shortener");
    const read = name => JSON.parse(fs.readFileSync(path.join(folder, `${name}.json`), "utf8"));
    const pack = Object.fromEntries(["problem", "interview", "evaluation", "architecture", "graph"].map(name => [name, read(name)]));
    pack.problem.id = problemId;
    pack.problem.title = /^design\b/i.test(topic) ? topic : `Design ${topic}`;
    pack.problem.description = `Offline fixture for ${topic}. This mock knowledge pack demonstrates the interview flow; real mode generates a topic-specific brief.`;
    return pack;
}
