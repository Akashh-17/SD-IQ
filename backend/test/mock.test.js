import { it, expect, afterEach, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { MemoryRedis } from "../src/services/mock/redis.js";
import { MemorySupabase } from "../src/services/mock/supabase.js";
import { llm, llmFast } from "../src/services/llm.js";
import { IntentSchema } from "../src/agents/intent/schema.js";
import { EvaluationSchema } from "../src/agents/evaluator/schema.js";
import { ConversationSchema } from "../src/agents/conversation/schema.js";
import { GraphAnalysisSchema } from "../src/agents/graph/schema.js";
import { initializeCheckpointer } from "../src/services/memory.js";
import { MemorySaver } from "@langchain/langgraph";

afterEach(() => vi.useRealTimers());
it("Redis SET NX is atomic under concurrency and expiry permits reacquisition", async () => {
    vi.useFakeTimers(); const r = new MemoryRedis();
    expect(await Promise.all([r.set("lock", 1, { nx: true, ex: 2 }), r.set("lock", 2, { nx: true })])).toEqual(["OK", null]);
    vi.advanceTimersByTime(2000); expect(await r.exists("lock")).toBe(0);
    expect(await r.set("lock", 3, { nx: true })).toBe("OK");
});
it("Redis implements list, numeric, clone, deletion and expiry semantics", async () => {
    const r = new MemoryRedis(); await r.rpush("list", "a", "b", "c");
    expect(await r.lrange("list", 0, -1)).toEqual(["a","b","c"]);
    expect(await r.lrange("list", -2, -1)).toEqual(["b","c"]);
    expect(await r.lrange("list", 0, -5)).toEqual([]);
    expect(await r.lrange("list", 4, 10)).toEqual([]);
    expect(await r.incr("count")).toBe(1); expect(await r.incr("count")).toBe(2);
    await r.set("obj", { value: 1 }); const obj = await r.get("obj"); obj.value = 4;
    expect(await r.get("obj")).toEqual({ value: 1 });
    expect(await r.expire("obj", 0)).toBe(1); expect(await r.get("obj")).toBeNull();
    expect(await r.expire("missing", 1)).toBe(0); expect(await r.del("list", "count")).toBe(2); expect(await r.ping()).toBe("PONG");
});
it("Supabase supports filtered reads, upserts, replacement, ordering and cardinality", async () => {
    const db = new MemorySupabase();
    const result = await db.from("interviews").upsert({ interview_id: "a", user_id: "u" }, { onConflict: "interview_id" }).select().single();
    expect(result.data.id).toBeTruthy();
    await db.from("interviews").upsert({ interview_id: "a", title: "updated" }, { onConflict: "interview_id" });
    expect(db.tables.interviews).toHaveLength(1);
    expect((await db.from("interviews").select().eq("user_id", "u").single()).data.title).toBe("updated");
    expect((await db.from("reports").select().maybeSingle()).data).toBeNull();
    expect((await db.from("reports").select().single()).error).toBeTruthy();
    await db.from("graphs").insert([{ interview_id: "a" }, { interview_id: "b" }]);
    expect((await db.from("graphs").select().single()).error).toBeTruthy();
    expect((await db.from("graphs").select().order("interview_id", { ascending: false })).data[0].interview_id).toBe("b");
    await db.from("graphs").delete().eq("interview_id", "a"); expect(db.tables.graphs).toHaveLength(1);
});
it.each([IntentSchema, EvaluationSchema, ConversationSchema, GraphAnalysisSchema])("both models validate deterministic structured output", async schema => {
    const input = schema === GraphAnalysisSchema ? "Graph: {\"nodes\":[],\"edges\":[]}" : [{ role: "user", content: "I would use replicated storage for availability." }];
    for (const model of [llm,llmFast]) {
        const first = await model.withStructuredOutput(schema).invoke(input);
        expect(schema.safeParse(first).success).toBe(true);
        expect(await model.withStructuredOutput(schema).invoke(input)).toEqual(first);
    }
});
it.each(["FOLLOW_UP", "PROBE_TOPIC", "ASK_MISSING", "MOVE_TOPIC", "ANSWER", "END_INTERVIEW"])("interviewer supports %s", async decision => {
    const result = await llm.invoke([{ role: "user", content: JSON.stringify({ decision: { decision, targetTopic: "Redis", targetConcept: "replication" }, interview: { currentQuestion: "How would you size it?" } }) }]);
    expect(result.content.length).toBeGreaterThan(20);
    if (decision === "END_INTERVIEW") expect(result.content).not.toContain("?");
});
it("produces report JSON", async () => expect(JSON.parse((await llm.invoke("report")).content)).toMatchObject({ overallScore: 0, stageBreakdown: [] }));
it("uses a singleton MemorySaver", async () => { const saver = await initializeCheckpointer(); expect(saver).toBeInstanceOf(MemorySaver); expect(await initializeCheckpointer()).toBe(saver); });
it("refuses mock mode in production before any service initializes", () => {
    const run = spawnSync(process.execPath, ["--input-type=module", "-e", 'await import("./src/config/redis.js")'], { env: { ...process.env, MOCK_MODE: "true", NODE_ENV: "production" }, encoding: "utf8" });
    expect(run.status).not.toBe(0); expect(run.stderr).toContain("MOCK_MODE must never run in production");
});
