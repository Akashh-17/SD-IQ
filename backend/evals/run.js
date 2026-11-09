import "../src/config/env.js";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { BACKEND_ROOT } from "../src/config/paths.js";
import {
    createLiveAdapter, createMockAdapter, resultsTable, runSuite, validateFixtures
} from "./harness.js";

const EVAL_ROOT = path.join(BACKEND_ROOT, "evals");

async function fingerprint(files) {

    const hash = createHash("sha256");
    for (const file of [...files].sort()) {
        hash.update(file);
        hash.update(await readFile(path.join(BACKEND_ROOT, file)));
    }
    return hash.digest("hex");

}

export async function main() {

    const mode = process.env.MOCK_MODE === "true" ? "mock" : "live";
    if (mode === "mock" && process.env.NODE_ENV === "production") {
        throw new Error("MOCK_MODE is forbidden in production");
    }
    if (mode === "live" && !process.env.OPENROUTER_API_KEY?.trim()) {
        throw new Error("OPENROUTER_API_KEY is required for live evals. Use MOCK_MODE=true for a harness-only check.");
    }

    const answers = JSON.parse(await readFile(path.join(EVAL_ROOT, "fixtures", "answers.json"), "utf8"));
    const intents = JSON.parse(await readFile(path.join(EVAL_ROOT, "fixtures", "intents.json"), "utf8"));
    validateFixtures(answers, intents);
    const calls = answers.length * 3 + intents.length;
    console.log(mode === "mock"
        ? "MOCK / HARNESS ONLY: synthetic expected outputs; this does not measure AI quality."
        : `LIVE eval: ${calls} model calls, sequentially. Provider retries may add HTTP attempts.`);

    const knowledgeFiles = [...new Set(answers.map(row => row.problemId))].flatMap(id =>
        ["problem", "architecture", "evaluation", "interview", "graph"].map(name => `src/knowledge/${id}/${name}.json`)
    );
    const provenance = {
        harnessSha256: await fingerprint(["evals/harness.js", "evals/run.js"]),
        fixturesSha256: await fingerprint(["evals/fixtures/answers.json", "evals/fixtures/intents.json"]),
        knowledgeSha256: await fingerprint(knowledgeFiles),
        agentSha256: await fingerprint([
            "src/agents/evaluator/agent.js", "src/agents/evaluator/prompt.js", "src/agents/evaluator/schema.js",
            "src/agents/intent/agent.js", "src/agents/intent/prompt.js", "src/agents/intent/schema.js",
            "src/services/contextBuilder.js", "src/services/llm.js"
        ])
    };

    const started = performance.now();
    const suite = await runSuite({
        answers, intents,
        adapter: mode === "mock" ? createMockAdapter() : await createLiveAdapter(),
        onAnswer: row => console.log(`${row.pass ? "PASS" : "FAIL"} ${row.id}`)
    });
    // Model identifiers are user-supplied; omit anything that could contain a secret or URL.
    const safeModel = value => /^[a-z0-9_.:-]+\/[a-z0-9_.:/-]+$/i.test(value) &&
        !/(?:sk-|gsk_|eyJ|service_role|https?:)/i.test(value) ? value : "custom (redacted)";
    const model = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl:free";
    const report = {
        version: 1, timestamp: new Date().toISOString(), mode,
        purpose: mode === "mock" ? "harness-only; synthetic oracle" : "live model quality",
        models: mode === "mock" ? { evaluator: "synthetic-oracle", intent: "synthetic-oracle" } : {
            evaluator: safeModel(model), intent: safeModel(process.env.OPENROUTER_FAST_MODEL || model)
        },
        provenance, durationMs: Math.round(performance.now() - started), modelCalls: calls,
        ...suite
    };

    const filename = `${report.timestamp.replace(/[:.]/g, "-")}.json`;
    await mkdir(path.join(EVAL_ROOT, "results"), { recursive: true });
    await writeFile(path.join(EVAL_ROOT, "results", filename), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
    console.log(`\n${resultsTable(report)}`);
    console.table(report.classification.map(row => ({ fixture: row.id, expected: row.expected, actual: row.actual, result: row.pass ? "PASS" : "FAIL" })));
    console.log(`Scoring pass rate: ${(report.scoringPassRate * 100).toFixed(1)}%; intent accuracy: ${(report.intentAccuracy * 100).toFixed(1)}%; required: >=85% each.`);
    console.log(`Saved evals/results/${filename}`);

    const documentationPath = path.join(EVAL_ROOT, "EVALS.md");
    const documentation = await readFile(documentationPath, "utf8");
    const latest = [
        "<!-- latest-results:start -->",
        `Run: ${report.timestamp}. Mode: **${mode.toUpperCase()}** (${report.purpose}).`,
        `Artifact: [JSON](results/${filename}). Evaluator: ${report.models.evaluator}; intent: ${report.models.intent}.`,
        `Scoring: ${(report.scoringPassRate * 100).toFixed(1)}%; intent accuracy: ${(report.intentAccuracy * 100).toFixed(1)}%.`,
        resultsTable(report), "<!-- latest-results:end -->"
    ].join("\n\n");
    if (!documentation.includes("<!-- latest-results:start -->") || !documentation.includes("<!-- latest-results:end -->")) {
        throw new Error("EVALS.md is missing latest-results markers");
    }
    await writeFile(documentationPath, documentation.replace(/<!-- latest-results:start -->[\s\S]*?<!-- latest-results:end -->/, latest));
    return report.passed ? 0 : 1;

}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    main().then(code => { process.exitCode = code; }).catch(() => {
        // Do not print arbitrary exceptions: SDK errors may contain prompts or secrets.
        console.error("Eval failed: check fixture/knowledge validity, output-directory access and OPENROUTER_API_KEY (or set MOCK_MODE=true). No provider details were logged.");
        process.exitCode = 1;
    });
}
