import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { BACKEND_ROOT } from "../src/config/paths.js";
import {
    createLiveAdapter, createMockAdapter, evaluatorContext, missingConcepts,
    resultsTable, runSuite, statistics, validateFixtures
} from "./harness.js";

const agents = vi.hoisted(() => ({ evaluate: vi.fn(), classify: vi.fn() }));
vi.mock("../src/agents/evaluator/agent.js", () => ({ evaluateAnswer: agents.evaluate }));
vi.mock("../src/agents/intent/agent.js", () => ({ classifyIntent: agents.classify }));

const answers = JSON.parse(readFileSync(new URL("./fixtures/answers.json", import.meta.url), "utf8"));
const intents = JSON.parse(readFileSync(new URL("./fixtures/intents.json", import.meta.url), "utf8"));

async function mockOutput(fixture = answers[0]) {
    return createMockAdapter().evaluate(evaluatorContext(fixture), fixture);
}

describe("eval corpus and production wiring", () => {
    it("covers 21 scoring cases, three problems, seven stages, four qualities and six intents", () => {
        expect(validateFixtures(answers, intents).answers).toHaveLength(21);
        expect(new Set(answers.map(row => row.problemId)).size).toBe(3);
        expect(new Set(answers.map(row => row.stage)).size).toBe(7);
        expect(new Set(answers.map(row => row.kind)).size).toBe(4);
        expect(intents).toHaveLength(15);
        expect(new Set(intents.map(row => row.expected)).size).toBe(6);
    });

    it.each([
        ["unsafe problem ID", rows => { rows[0].problemId = "../secret"; }],
        ["unknown stage", rows => { rows[0].stage = "Not a stage"; }],
        ["inverted range", rows => { rows[0].expected.minScore = 10; rows[0].expected.maxScore = 2; }],
        ["duplicate ID", rows => { rows[1].id = rows[0].id; }],
        ["missing quality coverage", rows => { rows.forEach(row => { row.kind = "strong"; }); }],
        ["missing knowledge", rows => { rows[0].problemId = "not_a_problem"; }]
    ])("rejects %s before model calls", (_name, change) => {
        const rows = structuredClone(answers);
        change(rows);
        expect(() => validateFixtures(rows, intents)).toThrow();
    });

    it("builds actual catalog context, without answer keys or quality labels", () => {
        const context = evaluatorContext(answers[0]);
        expect(context.currentStage).toBe(answers[0].stage);
        expect(context.currentQuestion).toBe(answers[0].question);
        expect(context.candidateAnswer).toBe(answers[0].answer);
        expect(context.currentObjective.completionCriteria.length).toBeGreaterThan(0);
        expect(context.evaluationRubric.topics).toHaveLength(7);
        expect(context).not.toHaveProperty("expected");
        expect(context).not.toHaveProperty("kind");
        expect(context).not.toHaveProperty("id");
    });

    it("live adapter invokes production agents with only their normal inputs", async () => {
        const adapter = await createLiveAdapter();
        const context = evaluatorContext(answers[0]);
        await adapter.evaluate(context, answers[0]);
        await adapter.classify(intents[0].message, intents[0]);
        expect(agents.evaluate).toHaveBeenCalledWith(context);
        expect(agents.classify).toHaveBeenCalledWith(intents[0].message);
    });
});

describe("scoring checks", () => {
    it("computes population standard deviation, including empty and constant series", () => {
        expect(statistics([])).toEqual({ mean: null, stdev: null });
        expect(statistics([8, 8, 8])).toEqual({ mean: 8, stdev: 0 });
        expect(statistics([7, 8, 9]).mean).toBe(8);
        expect(statistics([7, 8, 9]).stdev).toBeCloseTo(Math.sqrt(2 / 3));
    });

    it("matches concept aliases with normalized whole-token phrases, not SQL inside NoSQL", async () => {
        const output = await mockOutput();
        output.mentionedTopics = [];
        output.reasoning = "NoSQL storage with FAIL-CLOSED policy; a durable queue.";
        expect(missingConcepts(output, [
            { name: "sql", aliases: ["SQL"] },
            { name: "policy", aliases: ["fail open", "fail closed"] },
            { name: "queue", aliases: ["durable queue"] }
        ])).toEqual(["sql"]);
    });

    it("runs N=3 for scoring and once for intent, with trivial mock success", async () => {
        const adapter = createMockAdapter();
        const evaluate = vi.fn(adapter.evaluate);
        const classify = vi.fn(adapter.classify);
        const result = await runSuite({ answers, intents, adapter: { evaluate, classify } });
        expect(evaluate).toHaveBeenCalledTimes(63);
        expect(classify).toHaveBeenCalledTimes(15);
        expect(result.scoringPassRate).toBe(1);
        expect(result.intentAccuracy).toBe(1);
        expect(result.scoring.every(row => row.runs.length === 3 && row.stdev === 0)).toBe(true);
        expect(result.passed).toBe(true);
        expect(resultsTable(result)).toContain("8.50 | 0.00 | PASS");
    });

    it.each(["range", "answered", "concept", "schema", "provider"])("fails a fixture if even one run fails its %s check", async dimension => {
        const adapter = createMockAdapter();
        let call = 0;
        const result = await runSuite({ answers, intents, adapter: {
            ...adapter,
            evaluate: async (context, fixture) => {
                const output = await adapter.evaluate(context, fixture);
                if (++call !== 2) return output;
                if (dimension === "range") output.score = 0;
                if (dimension === "answered") output.answeredCurrentQuestion = false;
                if (dimension === "concept") { output.mentionedTopics = []; output.reasoning = "Insufficient detail."; }
                if (dimension === "schema") output.score = "eight";
                if (dimension === "provider") throw new Error("secret-provider-error-with-candidate-answer");
                return output;
            }
        } });
        expect(result.scoring[0].pass).toBe(false);
        expect(result.scoring[0].runs[0].pass).toBe(true);
        expect(result.scoring[0].runs[1].pass).toBe(false);
        expect(result.scoringPassRate).toBe(20 / 21);
        const artifact = JSON.stringify(result);
        expect(artifact).not.toContain(answers[0].answer);
        expect(artifact).not.toContain("secret-provider-error");
        expect(artifact).not.toContain("Synthetic harness oracle");
    });

    it("fails unstable scores even when all individual scores are in range", async () => {
        const rows = structuredClone(answers);
        rows[0].expected.maxStdDev = 0.5;
        const adapter = createMockAdapter();
        let call = 0;
        const result = await runSuite({ answers: rows, intents, adapter: {
            ...adapter,
            evaluate: async (context, fixture) => {
                const output = await adapter.evaluate(context, fixture);
                if (fixture.id === rows[0].id) output.score = [7, 10, 7][call++];
                return output;
            }
        } });
        expect(result.scoring[0].runs.every(run => run.pass)).toBe(true);
        expect(result.scoring[0].stable).toBe(false);
        expect(result.scoring[0].pass).toBe(false);
    });

    it("keeps failed calls in the denominator and reports n/a when no score is available", async () => {
        const adapter = createMockAdapter();
        const result = await runSuite({ answers, intents, adapter: {
            ...adapter, evaluate: async () => { throw new Error("not logged"); }
        } });
        expect(result.scoringPassRate).toBe(0);
        expect(result.scoring[0].mean).toBeNull();
        expect(result.scoring[0].runs.every(run => run.error === "model_call_failed")).toBe(true);
        expect(resultsTable(result)).toContain("n/a | n/a | FAIL");
        expect(result.passed).toBe(false);
    });

    it.each([
        [3, 2, true], [4, 0, false], [0, 3, false]
    ])("gates scoring and intent separately (%i scoring failures, %i intent failures)", async (badScores, badIntents, passed) => {
        const adapter = createMockAdapter();
        const result = await runSuite({ answers, intents, adapter: {
            evaluate: async (context, fixture) => {
                const output = await adapter.evaluate(context, fixture);
                if (answers.findIndex(row => row.id === fixture.id) < badScores) output.score = 11;
                return output;
            },
            classify: async (message, fixture) => {
                const output = await adapter.classify(message, fixture);
                if (intents.findIndex(row => row.id === fixture.id) < badIntents) output.intent = "UNKNOWN";
                return output;
            }
        } });
        expect(result.passed).toBe(passed);
    });

    it("counts invalid intent outputs and provider errors as incorrect", async () => {
        const adapter = createMockAdapter();
        let call = 0;
        const result = await runSuite({ answers, intents, adapter: {
            ...adapter,
            classify: async (message, fixture) => {
                call++;
                if (call === 1) return { intent: fixture.expected };
                if (call === 2) throw new Error("credential-never-printed");
                return adapter.classify(message, fixture);
            }
        } });
        expect(result.intentAccuracy).toBe(13 / 15);
        expect(result.classification[0].error).toBe("invalid_output");
        expect(result.classification[1].error).toBe("model_call_failed");
        expect(JSON.stringify(result)).not.toContain("credential-never-printed");
    });
});

describe("eval command preflight", () => {
    it("exits nonzero without a live key and does not silently use mocks", () => {
        const child = spawnSync(process.execPath, [path.join(BACKEND_ROOT, "evals", "run.js")], {
            env: { ...process.env, MOCK_MODE: "false", OPENROUTER_API_KEY: "" },
            encoding: "utf8", timeout: 15000, windowsHide: true
        });
        expect(child.status).toBe(1);
        expect(child.stderr).toContain("OPENROUTER_API_KEY");
        expect(child.stdout).not.toContain("PASS");
        expect(child.stdout).not.toContain("HARNESS ONLY");
    });
});
