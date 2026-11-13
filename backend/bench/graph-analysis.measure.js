// Measures how many whiteboard LLM analyses the backend actually runs,
// compared with analysing every autosave.
//
// It replays simulated whiteboard sessions through the real code path:
// saveGraph controller -> GraphService.update (graph signature check)
// -> GraphService.scheduleAnalysis (2 s debounce) -> InterviewService
// .ensureGraphAnalysis -> mock LLM. Time is virtual (fake timers), so a
// 20-minute session replays in milliseconds. Each simulated "save" is one
// request the frontend would send: the frontend already coalesces an edit
// burst into a single save 500 ms after the last change.
//
// Run: npx vitest run --config bench/vitest.config.js
import { afterAll, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import interviewRoutes from "../src/routes/interview.routes.js";
import { initializeAgent } from "../src/controllers/interview.controller.js";
import { saveGraph } from "../src/controllers/graph.controller.js";
import { GraphService } from "../src/services/graph/graph.service.js";
import { graphSignature } from "../src/utils/graphSignature.js";
import { redis } from "../src/config/redis.js";
import { supabase } from "../src/config/supabase.js";

const SESSIONS = 50;
const BACKEND_DEBOUNCE_MS = 2000;
const TYPES = ["client", "loadbalancer", "service", "cache", "sqldb", "nosqldb", "queue", "cdn", "storage", "worker"];

// Small seeded RNG so every run gives the same numbers.
function rng(seed) {
    return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}

// One candidate drawing a design. Returns [{ gap, graph, kind }]: wait `gap`
// ms after the previous save, then autosave `graph`.
function simulateSession(random) {
    const between = (a, b) => a + random() * (b - a);
    const pick = list => list[Math.floor(random() * list.length)];
    const nodes = [], edges = [], saves = [];
    let next = 0;
    const snapshot = () => ({ nodes: nodes.map(n => ({ ...n, data: { ...n.data }, position: { ...n.position } })), edges: edges.map(e => ({ ...e, data: { ...e.data } })) });
    // Pause before an action: usually quick editing, sometimes the candidate
    // stops to talk to the interviewer or think.
    const pause = () => random() < 0.15 ? between(15000, 90000) : between(700, 6000);
    const save = kind => saves.push({ gap: pause(), graph: snapshot(), kind });
    const move = () => { if (!nodes.length) return; const n = pick(nodes); n.position.x += between(-80, 80); n.position.y += between(-80, 80); save("move"); };

    const componentCount = Math.floor(between(8, 15));
    const arrowCount = Math.floor(between(componentCount, componentCount * 1.6));
    for (let i = 0; i < componentCount; i++) {
        const type = pick(TYPES), id = `${type}_${next++}`;
        nodes.push({ id, type, data: { label: type }, position: { x: between(0, 900), y: between(0, 600) } });
        save("add component");
        // Renaming: typing with short pauses can autosave a partial label.
        if (random() < 0.7) {
            const name = `${type} ${pick(["API", "primary", "replica", "read", "write", "edge", "events"])}`;
            if (random() < 0.4) { nodes.at(-1).data.label = name.slice(0, 4); saves.push({ gap: between(600, 1200), graph: snapshot(), kind: "rename" }); }
            nodes.at(-1).data.label = name; save("rename");
        }
        for (let m = 0, moves = Math.floor(between(1, 5)); m < moves; m++) move();
        if (random() < 0.2) save("restyle / resize");
    }
    for (let i = 0; i < arrowCount; i++) {
        const source = pick(nodes), target = pick(nodes.filter(n => n !== source));
        const id = `arrow_${next++}`;
        edges.push({ id, source: source.id, target: target.id, label: "", data: { label: "" } });
        save("connect");
        if (random() < 0.4) { const label = pick(["HTTP", "reads", "writes", "publishes", "gRPC"]); edges.at(-1).label = label; edges.at(-1).data.label = label; save("label arrow"); }
        if (random() < 0.5) move();
    }
    // Final tidy-up: rearranging the layout before explaining it.
    for (let m = 0, moves = Math.floor(between(4, 12)); m < moves; m++) move();
    if (random() < 0.5 && nodes.length > 3) {
        const removed = nodes.splice(Math.floor(random() * nodes.length), 1)[0];
        for (let e = edges.length - 1; e >= 0; e--) if (edges[e].source === removed.id || edges[e].target === removed.id) edges.splice(e, 1);
        save("delete component");
    }
    return saves;
}

const totals = { sessions: 0, saves: 0, cosmetic: 0, structural: 0, debounceOnly: 0, actual: 0, minutes: 0, perSession: [] };

it(`replays ${SESSIONS} simulated whiteboard sessions through the real graph pipeline`, async () => {
    const app = express(); app.use(express.json()); app.use("/api/interview", interviewRoutes);
    await initializeAgent();
    const random = rng(42);

    for (let s = 0; s < SESSIONS; s++) {
        redis.reset(); supabase.reset();
        const started = await request(app).post("/api/interview/start").set("Authorization", `Bearer mock-token-bench${s}`).send({ problemId: "url_shortener", difficulty: "SDE1" });
        expect(started.status).toBe(200);
        const interviewId = started.body.interviewId;
        const saves = simulateSession(random);

        const analyses = vi.spyOn(GraphService, "setAnalysis");
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        let previousSignature = graphSignature({ nodes: [], edges: [] }), lastDebounceStart = -Infinity, clock = 0;
        let structural = 0, debounceOnly = 0;
        try {
            for (const { gap, graph } of saves) {
                await vi.advanceTimersByTimeAsync(gap);
                clock += gap;
                const signature = graphSignature(graph);
                if (signature !== previousSignature) structural++;
                previousSignature = signature;
                // Debounce without the signature check: every save restarts
                // the timer, so one call per burst of saves < 2 s apart.
                if (clock - lastDebounceStart > BACKEND_DEBOUNCE_MS) debounceOnly++;
                lastDebounceStart = clock;
                let status = 200;
                await saveGraph({ body: { interviewId, graph } }, { status(code) { status = code; return this; }, json() { return this; } });
                expect(status).toBe(200);
            }
            await vi.advanceTimersByTimeAsync(BACKEND_DEBOUNCE_MS + 100);
        } finally {
            vi.useRealTimers();
        }
        const actual = analyses.mock.calls.length;
        analyses.mockRestore();

        totals.sessions++; totals.saves += saves.length; totals.structural += structural;
        totals.cosmetic += saves.length - structural; totals.debounceOnly += debounceOnly; totals.actual += actual;
        totals.minutes += clock / 60000;
        totals.perSession.push({ saves: saves.length, actual });
    }
    expect(totals.actual).toBeGreaterThan(0);
});

afterAll(() => {
    const pct = (part, whole) => `${(100 * (1 - part / whole)).toFixed(1)}%`;
    const reductions = totals.perSession.map(s => 1 - s.actual / s.saves).sort((a, b) => a - b);
    const median = reductions[Math.floor(reductions.length / 2)];
    process.stdout.write(`
Whiteboard LLM analysis: ${totals.sessions} simulated sessions, avg ${(totals.minutes / totals.sessions).toFixed(1)} min each
  Autosaves sent to the backend           ${totals.saves}  (avg ${(totals.saves / totals.sessions).toFixed(1)} per session)
    cosmetic (move / restyle)             ${totals.cosmetic}
    structural (add / rename / connect)   ${totals.structural}
  LLM calls if every save were analysed   ${totals.saves}
  ... with only the signature check       ${totals.structural}  (${pct(totals.structural, totals.saves)} fewer)
  ... with only the 2 s debounce          ${totals.debounceOnly}  (${pct(totals.debounceOnly, totals.saves)} fewer)
  ... actual (signature + debounce)       ${totals.actual}  (${pct(totals.actual, totals.saves)} fewer)
  Per-session reduction: median ${(median * 100).toFixed(1)}%, range ${(reductions[0] * 100).toFixed(1)}%-${(reductions.at(-1) * 100).toFixed(1)}%
`);
});
