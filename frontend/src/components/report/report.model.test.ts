import { expect, it } from "vitest";
import { formatDuration, normalizeReport, parseDiagram, parseStages, validScore } from "./report.model";
it("keeps a real zero and treats missing/invalid scores as unrecorded", () => {
    expect(validScore(0)).toBe(0); expect(validScore("7.5")).toBe(7.5);
    for (const value of [null, undefined, "", " ", false, "NaN", Infinity, -1, 11]) expect(validScore(value)).toBeNull();
    const report = normalizeReport({ interview: { title: "A", overall_score: 0 }, report: { overallScore: 9 } });
    expect(report.score).toBe(0); expect(report.candidateLevel).toBe(""); expect(report.durationMs).toBeNull(); expect(report.graph).toBeNull();
});
it("preserves stage feedback in both current and legacy response shapes", () => {
    expect(parseStages([{ stage: "Requirements", score: "8.2", feedback: "Quantify peak traffic." }])).toEqual([{ name: "Requirements", score: 8.2, feedback: "Quantify peak traffic." }]);
    expect(parseStages({ Scaling: 7, Reliability: { score: 5, feedback: "Bound retries." } })).toEqual([{ name: "Scaling", score: 7, feedback: "" }, { name: "Reliability", score: 5, feedback: "Bound retries." }]);
    expect(parseStages([{ stage: "Data Model", score: "invalid" }, {}])).toEqual([{ name: "Data Model", score: null, feedback: "" }]);
});
it("normalizes a read-only snapshot without mutating saved positions or accepting dangling edges", () => {
    const input = { nodes: [{ id: "api", type: "service", position: { x: 32, y: 64 }, data: { label: "Payment API" }, selected: true }, { id: "bad", position: {}, data: {} }], edges: [{ id: "bad-edge", source: "api", target: "missing" }], analysis: { issues: ["No retry bound"], missingComponents: ["Queue"], summary: "Needs backpressure" } };
    const original = structuredClone(input);
    const graph = parseDiagram(input)!;
    expect(graph.nodes).toHaveLength(1); expect(graph.edges).toHaveLength(0);
    expect(graph.nodes[0]).toMatchObject({ position: { x: 32, y: 64 }, draggable: false, connectable: false, selectable: false, focusable: false });
    expect(graph.analysis?.missingComponents).toEqual(["Queue"]); expect(input).toEqual(original);
});
it("uses recorded timing and falls back honestly for older reports", () => {
    const payload = { interview: { started_at: "2026-11-08T12:00:00Z", completed_at: "2026-11-08T12:20:15Z" }, report: { summary: "Ready" } };
    expect(formatDuration(normalizeReport(payload).durationMs)).toBe("20m 15s");
    expect(formatDuration(null)).toBe("Not recorded"); expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(3900000)).toBe("1h 5m");
    expect(normalizeReport({ ...payload, report: { durationMs: 120000 } }).durationMs).toBe(120000);
    expect(normalizeReport({ interview: { completed_at: "not a date" }, report: { summary: "Old" } }).date).toBeNull();
});
