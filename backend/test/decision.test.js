import { describe, it, expect } from "vitest";
import { decideNextAction } from "../src/services/decisionEngine.js";

const state = (intent = "ANSWER", evaluation = {}, interview = {}) => ({
    candidate: { intent: { intent }, evaluation: { answeredCurrentQuestion: true, mentionedTopics: [], criticalMissingConcepts: [], ...evaluation } },
    interview: { stage: "requirements", objective: { completionCriteria: [], completedCriteria: [] }, ...interview },
    knowledge: { interview: { stages: [{ name: "requirements" }, { name: "scaling" }] } }
});
describe("decision engine", () => {
    it.each(["CLARIFICATION", "QUESTION"])("%s answers the candidate", intent => expect(decideNextAction(state(intent)).decision).toBe("ANSWER"));
    it("wrap-up ends the interview", () => expect(decideNextAction(state("WRAP_UP")).decision).toBe("END_INTERVIEW"));
    it.each(["ACKNOWLEDGEMENT", "SMALL_TALK", "UNKNOWN", undefined])("%s follows up without using stale evaluation", intent => {
        const s = state(intent); if (intent === undefined) s.candidate.intent = null;
        expect(decideNextAction(s).decision).toBe("FOLLOW_UP");
    });
    it("unanswered question follows up", () => expect(decideNextAction(state("ANSWER", { answeredCurrentQuestion: false })).decision).toBe("FOLLOW_UP"));
    it("missing evaluation follows up", () => { const s = state(); s.candidate.evaluation = null; expect(decideNextAction(s).decision).toBe("FOLLOW_UP"); });
    it("probes an unexplained mentioned topic", () => {
        const result = decideNextAction(state("ANSWER", { mentionedTopics: [{ topic: "Redis" }] }, { topicTracker: { Redis: { mentioned: true, understood: false, probesAsked: 1 } } }));
        expect(result).toMatchObject({ decision: "PROBE_TOPIC", targetTopic: "Redis" });
    });
    it.each([{ mentioned: true, understood: false, probesAsked: 2 }, { mentioned: true, understood: true, probesAsked: 0 }, undefined])("does not over-probe or invent tracked topics", tracked => {
        expect(decideNextAction(state("ANSWER", { mentionedTopics: [{ topic: "Redis" }] }, { topicTracker: tracked ? { Redis: tracked } : {} })).decision).toBe("MOVE_TOPIC");
    });
    it("asks the first required missing criterion, ignoring optional and completed ones", () => {
        const objective = { completionCriteria: [{ name: "optional", required: false }, { name: "done", required: true }, { name: "scale", required: true, concepts: ["DAU"] }], completedCriteria: ["done"] };
        expect(decideNextAction(state("ANSWER", {}, { objective }))).toMatchObject({ decision: "ASK_MISSING", targetConcept: "DAU" });
    });
    it("falls back to criterion name", () => expect(decideNextAction(state("ANSWER", {}, { objective: { completionCriteria: [{ name: "scale", required: true }] } }))).toMatchObject({ targetConcept: "scale" }));
    it("asks critical missing concept after criteria", () => expect(decideNextAction(state("ANSWER", { criticalMissingConcepts: ["replication"] }))).toMatchObject({ decision: "ASK_MISSING", targetConcept: "replication" }));
    it("moves to next stage", () => expect(decideNextAction(state()).decision).toBe("MOVE_TOPIC"));
    it("ends after the final stage", () => expect(decideNextAction(state("ANSWER", {}, { stage: "scaling" })).decision).toBe("END_INTERVIEW"));
});
