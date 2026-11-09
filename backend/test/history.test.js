import { beforeEach, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import historyRoutes from "../src/routes/history.routes.js";
import interviewRoutes from "../src/routes/interview.routes.js";
import { supabase } from "../src/config/supabase.js";
import { redis } from "../src/config/redis.js";
import { SessionService } from "../src/services/interview/session.service.js";

const app = express();
app.use(express.json());
app.use("/api/history", historyRoutes);
app.use("/api/interview", interviewRoutes);
const auth = user => `Bearer mock-token-${user}`;
const history = (user = "a") => request(app).get("/api/history").set("Authorization", auth(user));
const start = () => request(app).post("/api/interview/start").set("Authorization", auth("a")).send({ problemId: "url_shortener", difficulty: "SDE1" });
beforeEach(() => { redis.reset(); supabase.reset(); });

it("requires authentication", async () => {
    expect((await request(app).get("/api/history")).status).toBe(401);
});
it("registers an owned active interview with an actual start date and no score", async () => {
    const response = await start();
    expect(response.status).toBe(200);
    const result = await history();
    expect(result.status).toBe(200);
    expect(result.body).toHaveLength(1);
    expect(result.body[0]).toMatchObject({ interview_id: response.body.interviewId, status: "ACTIVE", overall_score: null, stage_breakdown: [] });
    const session = await SessionService.get(response.body.interviewId);
    expect(Date.parse(result.body[0].started_at)).toBe(session.interview.startedAt);
    expect((await history("b")).body).toEqual([]);
});
it("joins stage scores only for owned interviews and strips report text", async () => {
    await supabase.from("interviews").insert([
        { id: "row-a", interview_id: "interview-a", user_id: "a", status: "COMPLETED" },
        { id: "row-b", interview_id: "interview-b", user_id: "b", status: "COMPLETED" }
    ]);
    await supabase.from("reports").insert([
        { interview_id: "row-a", stage_breakdown: [{ stage: "Reliability", score: 4, feedback: "Private feedback" }], transcript: ["Private answer"], summary: "Private summary" },
        { interview_id: "row-b", stage_breakdown: [{ stage: "Scaling", score: 9 }] }
    ]);
    const result = await history();
    expect(result.body).toHaveLength(1);
    expect(result.body[0].stage_breakdown).toEqual([{ stage: "Reliability", score: 4 }]);
    expect(JSON.stringify(result.body)).not.toMatch(/Private|interview-b|Scaling/);
});
it("supports legacy stage score objects and missing report scores", async () => {
    await supabase.from("interviews").insert([{ id: "legacy", interview_id: "legacy", user_id: "a", status: "COMPLETED" }, { id: "missing", interview_id: "missing", user_id: "a", status: "COMPLETED" }]);
    await supabase.from("reports").insert({ interview_id: "legacy", stage_breakdown: { Requirements: 7 } });
    const result = await history();
    expect(result.body.find(item => item.id === "legacy").stage_breakdown).toEqual([{ stage: "Requirements", score: 7 }]);
    expect(result.body.find(item => item.id === "missing").stage_breakdown).toEqual([]);
});
it("marks abandoned sessions expired instead of offering a broken resume link", async () => {
    const result = await start();
    await SessionService.delete(result.body.interviewId);
    expect((await history()).body[0].status).toBe("EXPIRED");
});
it("reflects report progress and failed jobs without weakening report locks", async () => {
    const result = await start();
    const id = result.body.interviewId;
    await redis.set(`report:${id}:status`, { status: "generating" });
    await redis.set(`lock:report-job:${id}`, "owner", { nx: true, ex: 30 });
    expect((await history()).body[0].status).toBe("GENERATING");
    await redis.del(`lock:report-job:${id}`);
    expect((await history()).body[0].status).toBe("FAILED");
});
it("returns a safe error if loading scores fails", async () => {
    await supabase.from("interviews").insert({ id: "row-a", interview_id: "a", user_id: "a", status: "COMPLETED" });
    const original = supabase.from.bind(supabase);
    const spy = vi.spyOn(supabase, "from").mockImplementation(table => table === "reports" ? { select: () => ({ in: async () => ({ data: null, error: new Error("private database detail") }) }) } : original(table));
    try {
        const result = await history();
        expect(result.status).toBe(500);
        expect(result.body).toEqual({ message: "Unable to load interview history" });
    } finally { spy.mockRestore(); }
});
it("cleans up the Redis session when active registration fails", async () => {
    const original = supabase.from.bind(supabase);
    const spy = vi.spyOn(supabase, "from").mockImplementation(table => table === "interviews" ? { insert: async () => ({ error: new Error("Registration unavailable") }) } : original(table));
    const created = vi.spyOn(SessionService, "create");
    try {
        const result = await start();
        expect(result.status).toBe(500);
        const id = created.mock.calls[0][0];
        expect(await SessionService.get(id)).toBeNull();
    } finally { spy.mockRestore(); created.mockRestore(); }
});
