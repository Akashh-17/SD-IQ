import { beforeAll, beforeEach, afterEach, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { randomUUID } from "node:crypto";
import interviewRoutes from "../src/routes/interview.routes.js";
import reportRoutes from "../src/routes/report.routes.js";
import { initializeAgent } from "../src/controllers/interview.controller.js";
import { ReportService } from "../src/services/report/report.service.js";
import { SessionService } from "../src/services/interview/session.service.js";
import { redis } from "../src/config/redis.js";
import { supabase } from "../src/config/supabase.js";
import { llm } from "../src/services/llm.js";
const app = express(); app.use(express.json()); app.use("/api/interview", interviewRoutes); app.use("/api/report", reportRoutes);
const post = (route, body, user = "a") => request(app).post(`/api/interview/${route}`).set("Authorization", `Bearer mock-token-${user}`).send(body);
const status = (id, user = "a") => request(app).get(`/api/report/${id}/status`).set("Authorization", `Bearer mock-token-${user}`);
async function start() {
    const result = await post("start", { problemId: "url_shortener", difficulty: "SDE1" });
    const id = result.body.interviewId; expect((await post("initialize", { interviewId: id })).status).toBe(200); return id;
}
async function drain() { while (ReportService.jobs.size) await Promise.all([...ReportService.jobs]); }
beforeAll(initializeAgent);
beforeEach(async () => { await drain(); redis.reset(); supabase.reset(); });
afterEach(async () => { await drain(); vi.restoreAllMocks(); });
it("returns 202 before a slow LLM finishes, then ready; duplicate end calls run one generation", async () => {
    const id = await start(); const original = llm.invoke.bind(llm);
    let release; const pending = new Promise(resolve => { release = resolve; });
    const spy = vi.spyOn(llm, "invoke").mockImplementation(async (...args) => { await pending; return original(...args); });
    try {
        const first = await post("end", { interviewId: id });
        expect(first.status).toBe(202); expect(first.body).toEqual({ status: "generating" });
        expect(supabase.tables.reports).toHaveLength(0);
        expect((await status(id)).body).toEqual({ status: "generating" });
        expect((await status(id, "b")).status).toBe(404);
        const duplicates = await Promise.all([post("end", { interviewId: id }), post("end", { interviewId: id })]);
        expect(duplicates.map(result => result.status)).toEqual([202,202]);
        await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
        release(); await drain();
        expect((await status(id)).body).toEqual({ status: "ready" });
        const repeated = await post("end", { interviewId: id });
        expect(repeated.status).toBe(200); expect(repeated.body).toEqual({ status: "ready" });
        expect(spy).toHaveBeenCalledTimes(1); expect(supabase.tables.reports).toHaveLength(1);
        expect(await SessionService.get(id)).toBeNull();
        expect(await redis.get(ReportService.statusKey(id))).toEqual({ status: "ready" });
    } finally { release(); }
});
it("marks a failure safely and allows retry without duplicating persisted data", async () => {
    const id = await start();
    vi.spyOn(llm, "invoke").mockRejectedValueOnce(new Error("sk-or-private-provider-error"));
    expect((await post("end", { interviewId: id })).status).toBe(202); await drain();
    const failed = await status(id); expect(failed.body.status).toBe("failed");
    expect(failed.body.error).toContain("Please try again"); expect(JSON.stringify(failed.body)).not.toContain("sk-or-");
    expect(await redis.exists(`lock:report:${id}`)).toBe(0);
    expect(await redis.exists(`lock:report-job:${id}`)).toBe(0);
    expect((await post("end", { interviewId: id })).status).toBe(202); await drain();
    expect((await status(id)).body.status).toBe("ready"); expect(supabase.tables.reports).toHaveLength(1);
});
it("enforces ownership while generating, failed and ready, plus auth and input validation", async () => {
    const id = await start();
    expect((await status(id, "b")).status).toBe(404);
    expect((await status(randomUUID())).status).toBe(404);
    expect((await status("bad-id")).status).toBe(400);
    expect((await request(app).get(`/api/report/${id}/status`)).status).toBe(401);
    expect((await post("end", { interviewId: id }, "b")).status).toBe(404);
    await ReportService.writeStatus(id, "failed", "private-provider-error");
    expect((await status(id, "b")).status).toBe(404);
    expect((await status(id)).body.error).not.toContain("private-provider");
    await post("end", { interviewId: id }); await drain();
    expect((await status(id, "b")).status).toBe(404);
});
it("detects an interrupted background job after its lock expires and stores status with TTL", async () => {
    const id = await start();
    await ReportService.writeStatus(id, "generating");
    expect((await status(id)).body.status).toBe("failed");
    // Test the actual expiry behavior rather than inspecting adapter internals.
    vi.useFakeTimers();
    try { vi.advanceTimersByTime(24 * 60 * 60 * 1000); expect(await redis.get(ReportService.statusKey(id))).toBeNull(); }
    finally { vi.useRealTimers(); }
});
it("recognizes a report produced by the agent's wrap-up path", async () => {
    const id = await start();
    const result = await post("message", { interviewId: id, message: "let's wrap up" });
    expect(result.body.completed).toBe(true);
    expect((await status(id)).body).toEqual({ status: "ready" });
});

it("reuses generated output after a persistence failure instead of calling the LLM twice", async () => {
    const { PersistenceService } = await import("../src/services/interview/persistence.service.js");
    const id = await start();
    const model = vi.spyOn(llm, "invoke");
    vi.spyOn(PersistenceService, "save").mockRejectedValueOnce(new Error("temporary storage failure"));
    await post("end", { interviewId: id }); await drain();
    expect((await status(id)).body.status).toBe("failed");
    expect((await SessionService.get(id)).report).toBeTruthy();
    await post("end", { interviewId: id }); await drain();
    expect((await status(id)).body.status).toBe("ready");
    expect(model).toHaveBeenCalledTimes(1); expect(supabase.tables.reports).toHaveLength(1);
});
