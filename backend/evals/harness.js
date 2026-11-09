import { z } from "zod";
import { EvaluationSchema } from "../src/agents/evaluator/schema.js";
import { IntentSchema } from "../src/agents/intent/schema.js";
import { IntentType } from "../src/models/InterviewEnums.js";
import { STAGE_NAMES } from "../src/knowledge/schema.js";
import { loadKnowledge } from "../src/services/knowledgeLoader.js";
import { buildEvaluatorContext } from "../src/services/contextBuilder.js";

export const REPEATS = 3;
export const PASS_THRESHOLD = 0.85;

const text = z.string().trim().min(1);
const identifier = z.string().regex(/^[a-z0-9_-]+$/);
const conceptSchema = z.strictObject({ name: text, aliases: z.array(text).min(1) });
const answerFixtureSchema = z.strictObject({
    id: identifier,
    problemId: z.string().regex(/^[a-z0-9_]{1,64}$/),
    stage: z.enum(STAGE_NAMES),
    kind: z.enum(["strong", "partial", "weak", "off_topic"]),
    question: text,
    answer: text,
    expected: z.strictObject({
        minScore: z.number().min(0).max(10),
        maxScore: z.number().min(0).max(10),
        answeredCurrentQuestion: z.boolean(),
        maxStdDev: z.number().nonnegative().max(10),
        mustMentionConcepts: z.array(conceptSchema).min(1)
    }).refine(value => value.minScore <= value.maxScore, "Inverted score range")
});
const intentFixtureSchema = z.strictObject({
    id: identifier,
    message: text,
    expected: z.enum(Object.values(IntentType).filter(value => value !== IntentType.UNKNOWN))
});

export function evaluatorContext(fixture) {

    const knowledge = loadKnowledge(fixture.problemId);
    const stage = knowledge.interview.stages.find(item => item.name === fixture.stage);
    if (!stage) throw new Error("Fixture stage is absent from the knowledge catalog");

    return buildEvaluatorContext({
        knowledge,
        interview: {
            stage: stage.name,
            currentQuestion: fixture.question,
            objective: {
                name: stage.name,
                description: stage.objective,
                completionCriteria: stage.completionCriteria,
                completedCriteria: []
            }
        },
        candidate: { latestMessage: fixture.answer },
        memory: { summary: "" },
        graphAnalysis: null
    });

}

export function validateFixtures(answers, intents) {

    const parsedAnswers = z.array(answerFixtureSchema).min(20).parse(answers);
    const parsedIntents = z.array(intentFixtureSchema).length(15).parse(intents);
    const all = [...parsedAnswers, ...parsedIntents];
    if (new Set(all.map(item => item.id)).size !== all.length) {
        throw new Error("Fixture IDs must be unique");
    }
    if (new Set(parsedAnswers.map(item => item.problemId)).size < 3 ||
        new Set(parsedAnswers.map(item => item.stage)).size !== STAGE_NAMES.length ||
        new Set(parsedAnswers.map(item => item.kind)).size !== 4 ||
        new Set(parsedIntents.map(item => item.expected)).size !== 6) {
        throw new Error("Fixtures must cover three problems, every stage, four answer qualities and six intents");
    }
    // Preflight the actual knowledge/context before spending any model calls.
    parsedAnswers.forEach(evaluatorContext);
    return { answers: parsedAnswers, intents: parsedIntents };

}

export function statistics(values) {

    if (!values.length) return { mean: null, stdev: null };
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const stdev = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
    return { mean, stdev };

}

function normalize(value) {
    return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

export function missingConcepts(output, concepts) {

    // Only inspect evaluator output: including the input answer would make this check meaningless.
    const fields = [
        ...output.strengths, ...output.weaknesses, ...output.architectureChoices,
        ...output.assumptions, ...output.mentionedTopics.map(item => item.topic),
        ...output.completedCriteria, ...output.criticalMissingConcepts, output.reasoning
    ].map(value => ` ${normalize(value)} `);
    return concepts.filter(concept => !concept.aliases.some(alias =>
        fields.some(field => field.includes(` ${normalize(alias)} `))
    )).map(concept => concept.name);

}

// This deliberately reads expectations. It tests the harness, never model quality.
// Keep it local to evals: production MOCK_MODE and the production agents are unchanged.
export function createMockAdapter() {

    return {
        evaluate: async (_context, fixture) => ({
            answeredCurrentQuestion: fixture.expected.answeredCurrentQuestion,
            score: (fixture.expected.minScore + fixture.expected.maxScore) / 2,
            candidateLevel: "INTERMEDIATE",
            strengths: [], weaknesses: [], architectureChoices: [], assumptions: [],
            mentionedTopics: fixture.expected.mustMentionConcepts.map(concept => ({
                topic: concept.aliases[0], needsProbe: false, explanationQuality: "GOOD"
            })),
            completedCriteria: [], criticalMissingConcepts: [],
            reasoning: "Synthetic harness oracle; not a model evaluation."
        }),
        classify: async (_message, fixture) => ({
            intent: fixture.expected, nextAction: "NONE", confidence: 1,
            reasoning: "Synthetic harness oracle; not a model evaluation."
        })
    };

}

export async function createLiveAdapter() {

    const [{ evaluateAnswer }, { classifyIntent }] = await Promise.all([
        import("../src/agents/evaluator/agent.js"),
        import("../src/agents/intent/agent.js")
    ]);
    // Expectations and answer-quality labels never reach the real agents.
    return {
        evaluate: context => evaluateAnswer(context),
        classify: message => classifyIntent(message)
    };

}

async function safeCall(call, schema) {

    const started = performance.now();
    try {
        const raw = await call();
        const parsed = schema.safeParse(raw);
        return parsed.success
            ? { output: parsed.data, durationMs: Math.round(performance.now() - started) }
            : { error: "invalid_output", durationMs: Math.round(performance.now() - started) };
    } catch {
        // Provider exceptions can include credentials, prompts and candidate text.
        return { error: "model_call_failed", durationMs: Math.round(performance.now() - started) };
    }

}

export async function runSuite({ answers, intents, adapter, onAnswer = () => {} }) {

    const fixtures = validateFixtures(answers, intents);
    const scoring = [];
    const classification = [];

    for (const fixture of fixtures.answers) {
        const context = evaluatorContext(fixture);
        const runs = [];
        for (let index = 0; index < REPEATS; index++) {
            const result = await safeCall(() => adapter.evaluate(context, fixture), EvaluationSchema);
            if (result.error) {
                runs.push({ run: index + 1, ...result, pass: false });
                continue;
            }
            const { output, durationMs } = result;
            const missing = missingConcepts(output, fixture.expected.mustMentionConcepts);
            const scoreInRange = output.score >= fixture.expected.minScore && output.score <= fixture.expected.maxScore;
            const answeredMatches = output.answeredCurrentQuestion === fixture.expected.answeredCurrentQuestion;
            runs.push({
                run: index + 1, score: output.score,
                answeredCurrentQuestion: output.answeredCurrentQuestion,
                scoreInRange, answeredMatches, missingConcepts: missing, durationMs,
                pass: scoreInRange && answeredMatches && missing.length === 0
            });
        }
        const scores = runs.filter(run => run.score !== undefined).map(run => run.score);
        const stats = statistics(scores);
        const stable = scores.length === REPEATS && stats.stdev <= fixture.expected.maxStdDev;
        const row = {
            id: fixture.id, problemId: fixture.problemId, stage: fixture.stage, kind: fixture.kind,
            expected: fixture.expected, ...stats, stable, runs,
            pass: stable && runs.every(run => run.pass)
        };
        scoring.push(row);
        onAnswer(row);
    }

    for (const fixture of fixtures.intents) {
        const result = await safeCall(() => adapter.classify(fixture.message, fixture), IntentSchema);
        classification.push({
            id: fixture.id, expected: fixture.expected,
            actual: result.output?.intent ?? null,
            ...(result.error ? { error: result.error } : {}),
            durationMs: result.durationMs,
            pass: !result.error && result.output.intent === fixture.expected
        });
    }

    const scoringPassRate = scoring.filter(row => row.pass).length / scoring.length;
    const intentAccuracy = classification.filter(row => row.pass).length / classification.length;
    return {
        repeats: REPEATS, threshold: PASS_THRESHOLD,
        scoring, classification, scoringPassRate, intentAccuracy,
        passed: scoringPassRate >= PASS_THRESHOLD && intentAccuracy >= PASS_THRESHOLD
    };

}

export function resultsTable(result) {

    const number = value => value === null ? "n/a" : value.toFixed(2);
    return [
        "| Fixture | Mean | Stdev | Result |",
        "| --- | ---: | ---: | --- |",
        ...result.scoring.map(row => `| ${row.id} | ${number(row.mean)} | ${number(row.stdev)} | ${row.pass ? "PASS" : "FAIL"} |`)
    ].join("\n");

}
