import { logger } from "../src/utils/logger.js";
import { beforeAll, beforeEach, afterEach, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import interviewRoutes from "../src/routes/interview.routes.js";
import reportRoutes from "../src/routes/report.routes.js";
import { initializeAgent, agent } from "../src/controllers/interview.controller.js";
import { SessionService } from "../src/services/interview/session.service.js";
import { InterviewService } from "../src/services/interview/interview.service.js";
import { redis } from "../src/config/redis.js";
import { supabase } from "../src/config/supabase.js";
const app = express(); app.use(express.json()); app.use("/api/interview", interviewRoutes); app.use("/api/report", reportRoutes);
const auth = "Bearer mock-token-stream-user";
const post = (route, body) => request(app).post(`/api/interview/${route}`).set("Authorization", auth).send(body);
const message = "I would use stateless APIs with replicated storage and a cache.";
let timing;
beforeAll(initializeAgent);
beforeEach(() => { redis.reset(); supabase.reset(); timing = vi.spyOn(logger, "info").mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());
async function start() {
    const result = await post("start", { problemId: "url_shortener", difficulty: "SDE1" });
    const interviewId = result.body.interviewId;
    expect((await post("initialize", { interviewId })).status).toBe(200);
    return interviewId;
}
const parse = text => text.trim().split("\n\n").filter(frame => frame.startsWith("event:")).map(frame => {
    const [event, data] = frame.split("\n");
    return { event: event.slice(7), data: JSON.parse(data.slice(6)) };
});
async function stream(interviewId, text = message, id = randomUUID()) {
    return post("message/stream", { interviewId, message: text }).set("X-Interview-Turn-Id", id).buffer(true).parse((res, done) => {
        let text = ""; res.setEncoding("utf8"); res.on("data", chunk => { text += chunk; }); res.on("end", () => done(null, text));
    });
}
it("streams ordered phases and only interviewer text, then saves transcript and memory once", async () => {
    const interviewId = await start();
    const before = await agent.getState({ configurable: { thread_id: interviewId } });
    const response = await stream(interviewId);
    expect(response.status).toBe(200); expect(response.headers["content-type"]).toContain("text/event-stream");
    expect(response.headers["x-accel-buffering"]).toBe("no"); expect(response.headers["cache-control"]).toContain("no-transform");
    const events = parse(response.body);
    expect(events.filter(e => e.event === "status").map(e => e.data.phase)).toEqual(["thinking", "evaluating", "responding"]);
    expect(events.at(-1).event).toBe("done");
    const tokens = events.filter(e => e.event === "token"); expect(tokens.length).toBeGreaterThan(3);
    expect(tokens.map(e => e.data.text).join("").trim()).toBe(events.at(-1).data.reply);
    expect(events.at(-1).data.completed).toBe(false);
    const transcript = (await SessionService.get(interviewId)).transcript;
    expect(transcript).toHaveLength(3);
    expect(transcript.filter(m => m.role === "user")).toEqual([{ role: "user", content: message }]);
    expect(transcript.at(-1).content).toBe(events.at(-1).data.reply);
    const after = await agent.getState({ configurable: { thread_id: interviewId } });
    expect(after.values.memory.previousQuestions).toHaveLength(before.values.memory.previousQuestions.length + 1);
    expect(after.values.evaluations).toHaveLength(1);
    const metrics = timing.mock.calls.find(([data, label]) => label === "Interview turn timing" && data.transport === "sse")[0];
    expect(metrics.timeToFirstTokenMs).toBeGreaterThan(0); expect(metrics.totalMs).toBeGreaterThan(metrics.timeToFirstTokenMs);
    console.log("Mock streaming measurement:", metrics);
});
it("wrap-up streams the closing reply and persists one report including the final user message", async () => {
    const interviewId = await start();
    const response = await stream(interviewId, "let's wrap up"); const events = parse(response.body);
    expect(events.at(-1).data.completed).toBe(true);
    expect(events.filter(e => e.event === "token").map(e => e.data.text).join("").trim()).toBe(events.at(-1).data.reply);
    const report = await request(app).get(`/api/report/${interviewId}`).set("Authorization", auth);
    expect(report.status).toBe(200); expect(report.body.report.transcript.at(-1).content).toBe("let's wrap up");
    expect(supabase.tables.reports).toHaveLength(1);
});
it("JSON fallback reuses a finished stream turn without duplicate transcript or evaluation", async () => {
    const interviewId = await start(); const id = randomUUID();
    const streamed = await stream(interviewId, message, id);
    const fallback = await post("message", { interviewId, message }).set("X-Interview-Turn-Id", id);
    expect(fallback.body).toEqual(parse(streamed.body).at(-1).data);
    expect((await SessionService.get(interviewId)).transcript).toHaveLength(3);
    expect((await agent.getState({ configurable: { thread_id: interviewId } })).values.evaluations).toHaveLength(1);
});
it("applies auth, validation, ownership and the shared message rate limit before streaming", async () => {
    const interviewId = await start();
    expect((await request(app).post("/api/interview/message/stream").send({ interviewId, message })).status).toBe(401);
    expect((await post("message/stream", { interviewId, message: "" })).status).toBe(400);
    expect((await request(app).post("/api/interview/message/stream").set("Authorization", "Bearer mock-token-other").send({ interviewId, message })).status).toBe(404);
    for (let i = 0; i < 29; i++) await post("message", { interviewId, message: "" });
    expect((await stream(interviewId)).status).toBe(429);
});
it("emits a safe error without leaking provider details", async () => {
    const interviewId = await start();
    vi.spyOn(InterviewService, "ensureGraphAnalysis").mockRejectedValueOnce(new Error("private-provider-secret"));
    const result = await stream(interviewId); const events = parse(result.body);
    expect(events.at(-1).event).toBe("error"); expect(result.body).not.toContain("private-provider-secret");
    expect(events.some(e => e.event === "done")).toBe(false);
});
it("delivers tokens before done and aborts cleanly on disconnect without replaying the answer", async () => {
    const interviewId = await start(); const id = randomUUID();
    const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/interview/message/stream`, {
            method: "POST", headers: { Authorization: auth, "Content-Type": "application/json", "X-Interview-Turn-Id": id }, body: JSON.stringify({ interviewId, message })
        });
        const reader = response.body.getReader(); let text = "";
        while (!text.includes("event: token")) { const chunk = await reader.read(); text += new TextDecoder().decode(chunk.value); }
        expect(text).not.toContain("event: done");
        // Transcript is still staged until generation finishes.
        expect((await SessionService.get(interviewId)).transcript).toHaveLength(1);
        await reader.cancel();
        await vi.waitFor(async () => expect((await redis.get(`turn:${interviewId}:${id}`))?.status).toBe("failed"));
        expect((await SessionService.get(interviewId)).transcript).toHaveLength(1);
        const restored = await agent.getState({ configurable: { thread_id: interviewId } });
        expect(restored.values.evaluations).toHaveLength(0);
        expect(restored.values.memory.previousQuestions).toHaveLength(1);
        const fallback = await post("message", { interviewId, message }).set("X-Interview-Turn-Id", id);
        expect(fallback.status).toBe(409);
        expect((await SessionService.get(interviewId)).transcript).toHaveLength(1);
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
