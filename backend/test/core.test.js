import { describe, it, expect, vi } from "vitest";
import { SessionManager } from "../src/services/sessionManager.js";
import { State } from "../src/state.js";
import { buildMemory } from "../src/services/memoryBuilder.js";
import { computeStageScores, generateInterviewReport } from "../src/services/report/reportGenerator.js";
import { graphSignature } from "../src/utils/graphSignature.js";
import { Schemas } from "../src/middleware/validate.js";
import { llm } from "../src/services/llm.js";
import { randomUUID } from "node:crypto";

const state = () => ({ candidate: { latestMessage: "Use replicated storage." }, interview: { stage: "design", currentQuestion: "How?", objective: { completedCriteria: [] } }, evaluations: [], memory: { previousQuestions: [] } });
const evaluation = { score: 7, candidateLevel: "INTERMEDIATE", strengths: ["clear"], mentionedTopics: [{ topic: "Redis", needsProbe: false }], completedCriteria: ["storage"] };
describe("history and memory", () => {
    it("appends evaluations through the real state reducer", () => {
        const s = state(); const first = SessionManager.setEvaluation(s, evaluation);
        const second = SessionManager.setEvaluation({ ...s, interview: first.interview }, { ...evaluation, score: 9 });
        const history = State.spec.evaluations.operator(first.evaluations, second.evaluations);
        expect(history.map(e => e.score)).toEqual([7,9]);
        expect(first.evaluations[0]).toMatchObject({ stage: "design", question: "How?", answer: "Use replicated storage." });
        expect(first.interview.objective.completedCriteria).toEqual(["storage"]);
        expect(first.interview.topicTracker.Redis.understood).toBe(true);
    });
    it("failed evaluations do not enter the score history", () => expect(SessionManager.setEvaluation(state(), { ...evaluation, failed: true }).evaluations).toEqual([]));
    it("builds bounded questions and summary with missing concepts", () => {
        const s = state(); s.memory.previousQuestions = Array.from({ length: 12 }, (_, i) => `q${i}`);
        s.evaluations = Array.from({ length: 8 }, (_, i) => ({ stage: `s${i}`, question: "q".repeat(200), answer: "a".repeat(250), score: 7, criticalMissingConcepts: ["replication"] }));
        const memory = buildMemory(s, "x".repeat(350));
        expect(memory.previousQuestions).toHaveLength(10);
        expect(memory.previousQuestions.at(-1)).toHaveLength(301);
        expect(memory.summary.split("\n")).toHaveLength(6);
        expect(memory.summary).not.toContain("[s0]");
        expect(memory.summary).toContain("score 7/10; missing: replication");
    });
    it("handles empty memory", () => expect(buildMemory({}, "Question?")).toMatchObject({ previousQuestions: ["Question?"], summary: "" }));
});
describe("report scoring", () => {
    it("averages by stage, preserves order and ignores absent scores", () => expect(computeStageScores([{ stage: "a", score: 7 }, { stage: "a", score: 8 }, { stage: "b", score: 2 }, { stage: "c" }])).toEqual([{ stage: "a", score: 7.5, answers: 2 }, { stage: "b", score: 2, answers: 1 }]));
    it("handles empty history", () => expect(computeStageScores()).toEqual([]));
    it("overrides fabricated LLM stage and overall scores", async () => {
        const spy = vi.spyOn(llm, "invoke").mockResolvedValueOnce({ content: JSON.stringify({ overallScore: 99, stageBreakdown: [{ stage: "a", score: 99, feedback: "Useful feedback" }] }) });
        try {
            const report = await generateInterviewReport({ evaluations: [{ stage: "a", score: 8 }, { stage: "a", score: 6 }, { stage: "b", score: 3 }] }, { transcript: [] });
            expect(report.overallScore).toBe(5);
            expect(report.stageBreakdown).toEqual([{ stage: "a", score: 7, feedback: "Useful feedback" }, { stage: "b", score: 3, feedback: "" }]);
        } finally { spy.mockRestore(); }
    });
});
describe("graph signatures", () => {
    const graph = { nodes: [{ id: "1", type: "api", data: { label: "API" }, position: { x: 1, y: 2 } }, { id: "2" }], edges: [{ source: "1", target: "2" }] };
    it("ignores position, selection, style and order", () => {
        const changed = structuredClone(graph); changed.nodes.reverse(); changed.nodes[1].position.x = 99; changed.nodes[1].selected = true;
        expect(graphSignature(changed)).toBe(graphSignature(graph));
    });
    it.each(["label", "edge", "node"])("detects structural %s changes", change => {
        const changed = structuredClone(graph);
        if (change === "label") changed.nodes[0].data.label = "Cache";
        if (change === "edge") changed.edges = [];
        if (change === "node") changed.nodes.push({ id: "3" });
        expect(graphSignature(changed)).not.toBe(graphSignature(graph));
    });
});
describe("request schemas", () => {
    it.each(["", "../tinyurl", "a/b", "%2e%2e", "A", "a".repeat(65)])("rejects unsafe problem id %s", problemId => expect(Schemas.start.safeParse({ problemId, difficulty: "SDE1" }).success).toBe(false));
    it.each(["", "bad-id", "../x"])("rejects interview id %s", interviewId => expect(Schemas.interviewBody.safeParse({ interviewId }).success).toBe(false));
    it.each(["", "   ", "a".repeat(4001)])("rejects empty or long message", message => expect(Schemas.message.safeParse({ interviewId: randomUUID(), message }).success).toBe(false));
    it("accepts the message limit and trims input", () => {
        const interviewId = randomUUID(); expect(Schemas.message.parse({ interviewId, message: "a".repeat(4000) }).message).toHaveLength(4000);
        expect(Schemas.message.parse({ interviewId, message: " hello " }).message).toBe("hello");
    });
});
