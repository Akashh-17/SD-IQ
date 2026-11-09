import { beforeAll, beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { Writable } from "node:stream";
import { requestId } from "../src/middleware/requestId.js";
import { requestContext, currentRequestId } from "../src/observability/context.js";
import { createLogger, logger, log, logError } from "../src/utils/logger.js";
import { observeHttp, metricsEndpoint } from "../src/observability/http.js";
import { registry, llmCalls, llmErrors, countActiveInterviews } from "../src/observability/metrics.js";
import { timeNode } from "../src/observability/node.js";
import { instrumentModel } from "../src/observability/llm.js";
import { redis } from "../src/config/redis.js";
import { supabase } from "../src/config/supabase.js";
import { initializeAgent } from "../src/controllers/interview.controller.js";
import { app } from "../server.js";

let lines, captured;
beforeAll(initializeAgent);
beforeEach(() => {
    registry.resetMetrics(); redis.reset(); supabase.reset(); lines = [];
    captured = createLogger({ destination: new Writable({ write(chunk, _encoding, done) { lines.push(JSON.parse(chunk.toString())); done(); } }) });
    vi.spyOn(logger, "info").mockImplementation(captured.info);
    vi.spyOn(logger, "error").mockImplementation(captured.error);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
const events = () => lines;

describe("request IDs", () => {
    it("accepts safe IDs and preserves independent context across concurrent async requests", async () => {
        const sample = express(); sample.use(requestId);
        sample.get("/", async (req, res) => {
            await new Promise(resolve => setTimeout(resolve, req.requestId === "trace-a" ? 20 : 1));
            captured.info({}, "Application event"); res.json({ id: currentRequestId() });
        });
        const responses = await Promise.all(["trace-a", "trace-b"].map(id => request(sample).get("/").set("X-Request-Id", id)));
        expect(responses.map(response => response.headers["x-request-id"])).toEqual(["trace-a", "trace-b"]);
        expect(responses.map(response => response.body.id)).toEqual(["trace-a", "trace-b"]);
        expect(new Set(events().map(event => event.requestId))).toEqual(new Set(["trace-a", "trace-b"]));
    });
    it.each([undefined, "invalid ID with spaces", "gsk_secret", "x".repeat(129)])("generates an ID for absent, unsafe or credential-like values", async supplied => {
        let req = request(app).get("/not-found"); if (supplied) req = req.set("X-Request-Id", supplied);
        const result = await req;
        expect(result.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
        expect(events().at(-1).requestId).toBe(result.headers["x-request-id"]);
    });
    it("assigns IDs to preflight, malformed JSON and metrics authorization errors", async () => {
        expect((await request(app).options("/api/interview/start").set("Origin", "http://localhost:5173").set("Access-Control-Request-Method", "POST")).headers["x-request-id"]).toBeTruthy();
        const malformed = await request(app).post("/api/interview/start").set("Content-Type", "application/json").send("{ broken");
        expect(malformed.status).toBe(400); expect(malformed.headers["x-request-id"]).toBeTruthy();
        vi.stubEnv("METRICS_TOKEN", "secret-metrics-key");
        expect((await request(app).get("/metrics")).headers["x-request-id"]).toBeTruthy();
    });
});
describe("safe structured logging", () => {
    it("omits free text, nested answers, transcripts, secrets, provider errors and malicious message strings", () => {
        const secret = "gsk_candidate_private";
        requestContext.run({ requestId: "safe-request" }, () => {
            captured.info({ requestId: "spoofed", headers: { authorization: secret, Authorization: secret, cookie: secret }, req: { headers: { authorization: secret } }, transcript: [secret], answer: secret, body: { message: secret }, prompt: secret, token: secret, arbitrary: secret, [secret + "_token"]: secret, err: new Error(secret) }, secret);
            for (const section of ["USER", "INTENT", "INTERVIEWER", "RAW REPORT", "GRAPH ANALYSIS", "REPORT GENERATED"]) log(section, { message: secret, reasoning: secret, summary: secret, score: 7 });
            log("USER", secret); logError(new Error(secret));
        });
        expect(JSON.stringify(events())).not.toContain(secret);
        expect(events().every(event => event.requestId === "safe-request")).toBe(true);
        expect(events()[0].headers.authorization).toBe("[Redacted]"); expect(events()[0].req.headers.authorization).toBe("[Redacted]");
        expect(events()[0].msg).toBe("Application event");
        expect(events()[1].score).toBe(7);
    });
    it("keeps operational timing numbers containing the word token", () => {
        captured.info({ timeToFirstTokenMs: 12, totalMs: 30, transport: "sse" }, "Interview turn timing");
        expect(events()[0]).toMatchObject({ timeToFirstTokenMs: 12, totalMs: 30, requestId: "background" });
    });
});
describe("node timing", () => {
    it("preserves state, config, streamed writer and result while logging exactly one timing", async () => {
        const state = { interview: { interviewId: "fallback" } }; const config = { configurable: { thread_id: "interview-1" }, writer: vi.fn(), signal: new AbortController().signal };
        const result = { nextNode: "interviewer" };
        const node = vi.fn(async (input, options) => { expect(input).toBe(state); expect(options).toBe(config); options.writer("chunk"); return result; });
        const run = timeNode("greeting", node);
        await requestContext.run({ requestId: "node-request" }, async () => expect(await run(state, config)).toBe(result));
        expect(config.writer).toHaveBeenCalledWith("chunk");
        expect(events()).toHaveLength(1); expect(events()[0]).toMatchObject({ node: "greeting", interviewId: "interview-1", requestId: "node-request", outcome: "success" });
        expect(events()[0].durationMs).toBeGreaterThanOrEqual(0);
        expect(await registry.metrics()).toContain('systemiq_langgraph_node_duration_seconds_count{node="greeting",outcome="success"} 1');
    });
    it("records failure and rethrows the original error without exposing its contents", async () => {
        const error = new Error("sk-or-private-provider-error");
        await expect(timeNode("input", async () => { throw error; })({ interview: { interviewId: "interview-2" } })).rejects.toBe(error);
        expect(events()[0]).toMatchObject({ node: "input", outcome: "failure", interviewId: "interview-2" });
        expect(JSON.stringify(events())).not.toContain(error.message);
    });
});
describe("metrics", () => {
    it("returns Prometheus metrics and protects the endpoint when a token is configured", async () => {
        vi.stubEnv("METRICS_TOKEN", "metrics-private");
        expect((await request(app).get("/metrics")).status).toBe(401);
        expect((await request(app).get("/metrics").set("Authorization", "Bearer wrong")).status).toBe(401);
        const response = await request(app).get("/metrics").set("Authorization", "Bearer metrics-private");
        expect(response.status).toBe(200); expect(response.headers["content-type"]).toContain("text/plain");
        for (const name of ["systemiq_http_request_duration_seconds", "systemiq_langgraph_node_duration_seconds", "systemiq_llm_calls_total", "systemiq_llm_errors_total", "systemiq_active_interviews"]) expect(response.text).toContain(`# HELP ${name}`);
        expect(JSON.stringify(events())).not.toContain("metrics-private");
    });
    it("keeps HTTP label cardinality bounded by route templates and excludes query strings", async () => {
        const sample = express(); sample.use(requestId); sample.use(observeHttp);
        sample.get("/api/problems/:problemId", (_req, res) => res.sendStatus(200)); sample.get("/metrics", metricsEndpoint);
        await request(sample).get("/api/problems/private-id?key=gsk_secret");
        await request(sample).get("/api/problems/another-id");
        const data = (await request(sample).get("/metrics")).text;
        expect(data).toContain('route="/api/problems/:problemId",status="200"} 2');
        expect(data).not.toContain("private-id"); expect(data).not.toContain("gsk_secret");
    });
    it("counts active metadata once, ignores transcript keys, and respects TTL and session deletion", async () => {
        await redis.set("interview:a", {}, { ex: 30 }); await redis.rpush("interview:a:transcript", "private");
        await redis.set("interview:b", {}, { ex: 0 });
        expect(await countActiveInterviews()).toBe(1);
        expect(await registry.metrics()).toContain("systemiq_active_interviews 1");
        await redis.del("interview:a"); expect(await countActiveInterviews()).toBe(0);
    });
    it("omits unavailable session counts without exposing datastore errors", async () => {
        await redis.set("interview:a", {});
        vi.spyOn(redis, "exists").mockRejectedValueOnce(new Error("gsk_private_datastore_details"));
        expect(await registry.metrics()).not.toMatch(/^systemiq_active_interviews \d/m);
        expect(events().some(event => event.event === "metrics.error")).toBe(true);
        expect(JSON.stringify(events())).not.toContain("gsk_private_datastore_details");
    });
    it("deduplicates SCAN pages in the real Redis interface", async () => {
        const scan = vi.fn().mockResolvedValueOnce(["1", ["interview:a", "interview:a:graph"]]).mockResolvedValueOnce(["0", ["interview:a", "interview:b"]]);
        expect(await countActiveInterviews({ scan })).toBe(2); expect(scan).toHaveBeenCalledTimes(2);
    });
    it("counts logical LLM calls, structured calls and streaming errors without counting nested invokes twice", async () => {
        const fake = {
            async invoke() { return { content: "private-answer" }; },
            withStructuredOutput() { return { invoke: () => this.invoke() }; },
            async *stream() { await this.invoke(); yield { content: "private-token" }; throw new Error("private-provider-error"); }
        };
        instrumentModel(fake, "main"); instrumentModel(fake, "main");
        await fake.invoke(); await fake.withStructuredOutput().invoke();
        await expect((async () => { for await (const chunk of fake.stream()) void chunk; })()).rejects.toThrow("private-provider-error");
        const calls = (await llmCalls.get()).values; const errors = (await llmErrors.get()).values;
        expect(calls.find(item => item.labels.operation === "invoke").value).toBe(1);
        expect(calls.find(item => item.labels.operation === "structured").value).toBe(1);
        expect(calls.find(item => item.labels.operation === "stream").value).toBe(1);
        expect(errors.find(item => item.labels.operation === "stream").value).toBe(1);
        expect(JSON.stringify(events())).not.toContain("private-");
    });
});
it("runs a mock interview with one correlated structured timing per node", async () => {
    const auth = "Bearer mock-token-observer";
    const start = await request(app).post("/api/interview/start").set("Authorization", auth).send({ problemId: "url_shortener", difficulty: "SDE1" });
    const interviewId = start.body.interviewId;
    await request(app).post("/api/interview/initialize").set("Authorization", auth).send({ interviewId });
    lines.length = 0;
    const response = await request(app).post("/api/interview/message").set("Authorization", auth).set("X-Request-Id", "mock-turn-request").send({ interviewId, message: "PRIVATE-CANDIDATE-ANSWER use replicated APIs with caches and storage." });
    expect(response.status).toBe(200);
    const nodes = events().filter(event => event.event === "graph.node");
    expect(nodes.map(event => event.node)).toEqual(["greeting", "input", "graphAnalyzer", "intent", "orchestrator", "evaluator", "conversationManager", "interviewer"]);
    expect(nodes.every(event => event.requestId === "mock-turn-request" && event.interviewId === interviewId && event.durationMs >= 0)).toBe(true);
    console.log(nodes.map(event => JSON.stringify(event)).join("\n"));
    expect(JSON.stringify(events())).not.toContain("PRIVATE-CANDIDATE-ANSWER");
    const metrics = (await request(app).get("/metrics")).text;
    expect(metrics).toContain("systemiq_active_interviews 1");
    expect(metrics).toMatch(/systemiq_llm_calls_total\{model="fast",operation="structured"\} 2/);
});
