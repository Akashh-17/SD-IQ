import { beforeEach, afterEach, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { randomUUID } from "node:crypto";
import routes from "../src/routes/report.routes.js";
import { PersistenceService } from "../src/services/interview/persistence.service.js";
import { supabase } from "../src/config/supabase.js";
const app = express(); app.use("/api/report", routes);
const id = randomUUID();
const graph = { nodes: [{ id: "api", type: "service", position: { x: 16, y: 32 }, data: { label: "API" } }], edges: [] };
const analysis = { issues: ["No durable storage"], missingComponents: ["Database"], summary: "One service", components: [] };
const session = () => ({
    interview: { interviewId: id, userId: "a", problemId: "custom_" + "a".repeat(32), title: "Design a payment system", difficulty: "Senior", problemDifficulty: "Hard", startedAt: Date.now() - 1200000 },
    graph: { ...graph, analysis },
    transcript: [{ role: "user", content: "Use idempotent payment requests." }],
    report: { overallScore: 8.2, candidateLevel: "ADVANCED", summary: "A solid design", strengths: ["Idempotency"], weaknesses: [], recommendations: [], stageBreakdown: [] }
});
beforeEach(() => supabase.reset());
afterEach(() => vi.restoreAllMocks());
it("returns the owner's final diagram, analysis, transcript and replay metadata", async () => {
    const source = session(); await PersistenceService.save(source);
    const result = await request(app).get("/api/report/" + id).set("Authorization", "Bearer mock-token-a");
    expect(result.status).toBe(200);
    expect(result.body.graph).toEqual({ ...graph, analysis });
    expect(result.body.report).toMatchObject({ problemId: source.interview.problemId, startedAt: source.interview.startedAt, candidateLevel: "ADVANCED", transcript: source.transcript });
    expect(result.body.report.durationMs).toBeGreaterThanOrEqual(1200000);
    expect(result.body.report.durationMs).toBe(new Date(result.body.interview.completed_at).getTime() - source.interview.startedAt);
    expect(supabase.tables.reports).toHaveLength(1);
});
it("does not read private report/diagram rows for another user, or expose them without auth", async () => {
    await PersistenceService.save(session());
    const spy = vi.spyOn(supabase, "from");
    expect((await request(app).get("/api/report/" + id).set("Authorization", "Bearer mock-token-b")).status).toBe(404);
    expect(spy.mock.calls.map(([table]) => table)).toEqual(["interviews"]);
    spy.mockClear();
    expect((await request(app).get("/api/report/" + id)).status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
});
it("keeps status/idempotency reads light and allows legacy reports without a saved graph", async () => {
    await PersistenceService.save(session());
    const spy = vi.spyOn(supabase, "from");
    expect((await PersistenceService.getReport(id)).report.summary).toBe("A solid design");
    expect(spy.mock.calls.map(([table]) => table)).toEqual(["interviews", "reports"]);
    const row = supabase.tables.interviews[0];
    await supabase.from("graphs").delete().eq("interview_id", row.id);
    const result = await request(app).get("/api/report/" + id).set("Authorization", "Bearer mock-token-a");
    expect(result.status).toBe(200); expect(result.body.graph).toBeNull();
});
