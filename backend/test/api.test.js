import { beforeAll, beforeEach, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import interviewRoutes from "../src/routes/interview.routes.js";
import reportRoutes from "../src/routes/report.routes.js";
import historyRoutes from "../src/routes/history.routes.js";
import { initializeAgent } from "../src/controllers/interview.controller.js";
import { redis } from "../src/config/redis.js";
import { supabase } from "../src/config/supabase.js";
import { llm } from "../src/services/llm.js";
const app = express(); app.use(express.json());
app.use("/api/interview", interviewRoutes); app.use("/api/report", reportRoutes); app.use("/api/history", historyRoutes);
const token = user => `Bearer mock-token-${user}`;
const post = (route, body, user = "a") => request(app).post(`/api/interview/${route}`).set("Authorization", token(user)).send(body);
const get = (route, user = "a") => request(app).get(route).set("Authorization", token(user));
async function start() { const result = await post("start", { problemId: "url_shortener", difficulty: "SDE1" }); expect(result.status).toBe(200); return result.body.interviewId; }
beforeAll(initializeAgent);
beforeEach(() => { redis.reset(); supabase.reset(); });
it("rejects absent and real-service tokens in mock mode", async () => {
    expect((await request(app).post("/api/interview/start").send({})).status).toBe(401);
    expect((await request(app).post("/api/interview/start").set("Authorization", "Bearer real-token").send({})).status).toBe(401);
});
it("returns 400 on invalid input", async () => {
    expect((await post("start", { problemId: "../secret", difficulty: "SDE1" })).status).toBe(400);
    expect((await post("message", { interviewId: "bad", message: "" })).status).toBe(400);
});
it("user B cannot read or mutate user A's live interview", async () => {
    const interviewId = await start();
    for (const [route, body] of [["initialize", {}], ["message", { message: "hello" }], ["graph", { graph: { nodes: [], edges: [] } }], ["end", {}]]) {
        expect((await post(route, { interviewId, ...body }, "b")).status).toBe(404);
    }
    expect((await get(`/api/interview/state/${interviewId}`, "b")).status).toBe(404);
    expect((await get(`/api/interview/state/${interviewId}`)).status).toBe(200);
});
it("rate limits the eleventh start request", async () => {
    for (let i = 0; i < 10; i++) await start();
    const result = await post("start", { problemId: "url_shortener", difficulty: "SDE1" });
    expect(result.status).toBe(429); expect(result.headers["retry-after"]).toBeTruthy();
});
it("two concurrent end requests generate and persist exactly one report", async () => {
    const interviewId = await start(); expect((await post("initialize", { interviewId })).status).toBe(200);
    const spy = vi.spyOn(llm, "invoke");
    try {
        const results = await Promise.all([post("end", { interviewId }), post("end", { interviewId })]);
        expect(results.every(r => [200, 202].includes(r.status))).toBe(true);
        await vi.waitFor(() => expect(supabase.tables.reports).toHaveLength(1));
        expect(spy.mock.calls.filter(([input]) => typeof input === "string")).toHaveLength(1);
        expect(supabase.tables.reports).toHaveLength(1); expect(supabase.tables.interviews).toHaveLength(1);
        expect((await get(`/api/report/${interviewId}`, "b")).status).toBe(404);
        expect((await get(`/api/report/${interviewId}`)).status).toBe(200);
        expect((await get("/api/history/", "b")).body).toEqual([]);
    } finally { spy.mockRestore(); }
});
it("analyzes a saved diagram offline and ignores positional edits", async () => {
    const { SessionService } = await import("../src/services/interview/session.service.js");
    const { InterviewService } = await import("../src/services/interview/interview.service.js");
    const interviewId = await start();
    const graph = { nodes: [{ id: "api", type: "service", data: { label: "API" }, position: { x: 0, y: 0 } }, { id: "db", type: "sqldb", data: { label: "Database" } }], edges: [{ source: "api", target: "db" }] };
    await SessionService.setGraph(interviewId, graph);
    const analyzed = await InterviewService.ensureGraphAnalysis(interviewId);
    expect(analyzed.analysis.components.map(component => component.name)).toEqual(["API", "Database"]);
    expect(analyzed.analysis.connections).toEqual([{ from: "API", to: "Database" }]);
    graph.nodes[0].position.x = 100;
    await SessionService.setGraph(interviewId, graph);
    const unchanged = await InterviewService.ensureGraphAnalysis(interviewId);
    expect(unchanged.analysisSignature).toBe(analyzed.analysisSignature);
    expect(unchanged.analysis).toEqual(analyzed.analysis);
});
it("runs a full interview through real routes and LangGraph, including wrap-up", async () => {
    const interviewId = await start(); const initialized = await post("initialize", { interviewId });
    expect(initialized.status).toBe(200); expect(initialized.body.reply).toContain("interviewer");
    for (const message of ["I would use stateless APIs behind a load balancer and replicated storage.", "A cache would serve popular keys and reduce database load.", "A durable queue would buffer writes during bursts."]) {
        const result = await post("message", { interviewId, message }); expect(result.status).toBe(200); expect(result.body.reply).toBeTruthy(); expect(result.body.completed).toBe(false);
    }
    const final = await post("message", { interviewId, message: "let's wrap up" });
    expect(final.status).toBe(200); expect(final.body.completed).toBe(true);
    const report = await get(`/api/report/${interviewId}`); expect(report.status).toBe(200);
    expect(report.body.report.overallScore).toBe(7);
    expect(report.body.report.transcript.at(-1).content).toBe("let's wrap up");
    expect((await get(`/api/report/${interviewId}`, "b")).status).toBe(404);
});
