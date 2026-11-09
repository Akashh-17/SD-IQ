import { beforeAll, beforeEach, afterEach, describe, it, expect } from "vitest";
import { readFile, mkdtemp, cp, rm, writeFile, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";
import { KNOWLEDGE_DIR, BACKEND_ROOT } from "../src/config/paths.js";
import { loadKnowledge } from "../src/services/knowledgeLoader.js";
import { STAGE_NAMES, KNOWLEDGE_FILES, KnowledgeBundleSchema } from "../src/knowledge/schema.js";
import { validateKnowledge } from "../scripts/validate-knowledge.js";
import interviewRoutes from "../src/routes/interview.routes.js";
import reportRoutes from "../src/routes/report.routes.js";
import { initializeAgent, agent } from "../src/controllers/interview.controller.js";
import { redis } from "../src/config/redis.js";
import { supabase } from "../src/config/supabase.js";

const ids = ["chat_app", "google_drive", "instagram", "news_feed", "notification_system", "rate_limiter", "uber", "url_shortener"];
async function bundle(id = "url_shortener") {
    return Object.fromEntries(await Promise.all(KNOWLEDGE_FILES.map(async filename => [filename.slice(0, -5), JSON.parse(await readFile(path.join(KNOWLEDGE_DIR, id, filename), "utf8"))])));
}
const temporaryRoots = [];
async function fixture() {
    const root = await mkdtemp(path.join(tmpdir(), "systemiq-knowledge-")); temporaryRoots.push(root);
    await cp(path.join(KNOWLEDGE_DIR, "url_shortener"), path.join(root, "url_shortener"), { recursive: true });
    return root;
}
afterEach(async () => {
    for (const root of temporaryRoots.splice(0)) {
        if (!path.resolve(root).startsWith(path.join(path.resolve(tmpdir()), "systemiq-knowledge-"))) throw new Error("Unsafe fixture cleanup path");
        await rm(root, { recursive: true, force: true, maxRetries: 3 });
    }
});

describe("knowledge authoring contract", () => {
    it("validates all eight folders and retains the five original IDs", async () => {
        const result = await validateKnowledge(); expect(result.errors).toEqual([]); expect(result.ok).toBe(true); expect(result.problems).toEqual(ids);
    });
    it.each(ids)("%s follows the actual loader, context and shared stage contracts", async id => {
        const data = await bundle(id); expect(KnowledgeBundleSchema.safeParse(data).success).toBe(true);
        const loaded = loadKnowledge(id); expect(loaded.problem).toEqual(data.problem); expect(loaded.interview.stages.map(stage => stage.name)).toEqual(STAGE_NAMES);
        expect(loaded.evaluation.topics.map(topic => topic.name)).toEqual(STAGE_NAMES);
        for (const stage of loaded.interview.stages) expect(stage.completionCriteria.some(criterion => criterion.required)).toBe(true);
    });
    it.each([
        ["missing entry question", data => { delete data.interview.stages[0].entryQuestion; }],
        ["missing required boolean", data => { delete data.interview.stages[0].completionCriteria[0].required; }],
        ["missing objective", data => { delete data.interview.stages[0].objective; }],
        ["empty concepts", data => { data.interview.stages[0].completionCriteria[0].concepts = []; }],
        ["optional-only stage", data => { data.interview.stages[0].completionCriteria.forEach(item => { item.required = false; }); }],
        ["duplicate criteria", data => { data.interview.stages[0].completionCriteria.push(structuredClone(data.interview.stages[0].completionCriteria[0])); }],
        ["incorrect stage order", data => { data.interview.stages.reverse(); }],
        ["incorrect rubric stage", data => { data.evaluation.topics[0].name = "Reliability"; }],
        ["missing critical criterion", data => { data.evaluation.topics[0].concepts[0].importance = "optional"; }],
        ["invalid rubric weights", data => { data.evaluation.topics[0].weight = 99; }],
        ["score anchor gap", data => { data.evaluation.scoreAnchors[1].min = 4; }],
        ["unknown graph endpoint", data => { data.graph.recommendedConnections[0].to = "Missing Database"; }],
        ["missing graph component", data => { data.graph.optionalNodes = data.graph.optionalNodes.filter(name => name !== "CDN"); }],
        ["wrong graph alias", data => { data.graph.nodeMapping.cdn = "Notification Service"; }],
        ["duplicate components", data => { data.architecture.components.push(structuredClone(data.architecture.components[0])); }],
        ["incorrect average rate", data => { data.problem.scale.rates[0].averagePerSecond = 999999; }],
        ["incorrect peak rate", data => { data.problem.scale.rates[0].peakPerSecond = 1; }],
        ["incorrect byte arithmetic", data => { data.problem.scale.storageEstimates[0].replicatedBytes++; }],
        ["unknown difficulty", data => { data.problem.problemDifficulty = "Impossible"; }],
        ["invalid problem ID", data => { data.problem.id = "../escape"; }],
        ["unsupported API level", data => { data.interview.difficultyLevels.push("Junior"); }]
    ])("rejects %s before the interview runtime sees it", async (_name, mutate) => {
        const data = await bundle(); mutate(data); expect(KnowledgeBundleSchema.safeParse(data).success).toBe(false);
    });
    it.each(KNOWLEDGE_FILES)("reports a missing %s with the precise problem/file name", async filename => {
        const root = await fixture(); await unlink(path.join(root, "url_shortener", filename));
        const result = await validateKnowledge(root); expect(result.ok).toBe(false); expect(result.errors).toContain(`url_shortener/${filename}: missing required file`);
    });
    it("rejects malformed JSON and folder/ID mismatches", async () => {
        const root = await fixture(); const file = path.join(root, "url_shortener", "problem.json");
        await writeFile(file, "{ broken", "utf8"); expect((await validateKnowledge(root)).errors).toContain("url_shortener/problem.json: cannot read valid JSON");
        const data = (await bundle()).problem; data.id = "renamed_id"; await writeFile(file, JSON.stringify(data));
        expect((await validateKnowledge(root)).errors).toContain("url_shortener/problem.json: id must equal the folder name");
    });
    it("rejects an empty catalog instead of silently succeeding", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "systemiq-knowledge-")); temporaryRoots.push(root);
        expect((await validateKnowledge(root)).ok).toBe(false);
    });
    it("CLI validates from another working directory and exits nonzero on invalid content", async () => {
        const script = path.join(BACKEND_ROOT, "scripts", "validate-knowledge.js");
        const good = spawnSync(process.execPath, [script], { cwd: tmpdir(), encoding: "utf8" });
        expect(good.status).toBe(0); expect(good.stdout).toContain("Validated 8 problem(s); 0 error(s)");
        const root = await fixture(); await unlink(path.join(root, "url_shortener", "graph.json"));
        const bad = spawnSync(process.execPath, [script, root], { cwd: tmpdir(), encoding: "utf8" });
        expect(bad.status).toBe(1); expect(bad.stderr).toContain("url_shortener/graph.json");
    });
});

const app = express(); app.use(express.json()); app.use("/api/interview", interviewRoutes); app.use("/api/report", reportRoutes);
const post = (route, body) => request(app).post(`/api/interview/${route}`).set("Authorization", "Bearer mock-token-content-user").send(body);
beforeAll(initializeAgent);
beforeEach(() => { redis.reset(); supabase.reset(); });
it.each(["rate_limiter", "notification_system", "news_feed"])("starts and completes a mock-mode interview on %s through all shared stages", async problemId => {
    const started = await post("start", { problemId, difficulty: "SDE1" }); expect(started.status).toBe(200);
    const interviewId = started.body.interviewId;
    const greeting = await post("initialize", { interviewId }); expect(greeting.status).toBe(200); expect(greeting.body.reply).toContain("interviewer");
    for (let index = 0; index < STAGE_NAMES.length; index++) {
        const current = await agent.getState({ configurable: { thread_id: interviewId } });
        expect(current.values.interview.stage).toBe(STAGE_NAMES[index]);
        const result = await post("message", { interviewId, message: "I would use explicit state ownership, idempotent operations and bounded recovery, and quantify the workload before choosing partitions." });
        expect(result.status).toBe(200); expect(result.body.completed).toBe(index === STAGE_NAMES.length - 1);
    }
    const report = await request(app).get(`/api/report/${interviewId}`).set("Authorization", "Bearer mock-token-content-user");
    expect(report.status).toBe(200); expect(report.body.report.stageBreakdown.map(stage => stage.stage)).toEqual(STAGE_NAMES);
});
