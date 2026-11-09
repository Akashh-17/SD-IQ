import { describe, expect, it } from "vitest";
import { activityCalendar, currentStreak, historyStats, improvement, normalizeHistory, scoreTrend, stageAverages, validScore } from "./history.model";
import { recommendProblem } from "../dashboard/recommendation";

function row(id: string, score: unknown, overrides: Record<string, unknown> = {}) {
    return { id, interview_id: id, title: "Design TinyURL", difficulty: "SDE2", problem_difficulty: "Easy", status: "COMPLETED", overall_score: score, completed_at: "2026-11-01T12:00:00Z", ...overrides };
}
describe("history normalization and statistics", () => {
    it("normalizes legacy stage objects and arrays, preserves zero, and deduplicates attempts", () => {
        const history = normalizeHistory([row("a", "0", { stage_breakdown: { Reliability: "0" } }), row("a", 0, { stageBreakdown: [{ name: "Scaling", value: "7" }] }), row("b", null), null]);
        expect(history).toHaveLength(2);
        expect(history[0]).toMatchObject({ score: 0, stages: [{ stage: "Scaling", score: 7 }], level: "SDE2", difficulty: "Easy" });
        expect(history[1].score).toBeNull();
    });
    it.each([null, undefined, "", " ", false, NaN, Infinity, -1, 11, "not a number"])("does not turn missing/invalid score %j into a real score", value => {
        expect(validScore(value)).toBeNull();
    });
    it("rejects a malformed history payload", () => expect(() => normalizeHistory({ error: "unavailable" })).toThrow());
    it("averages scored completions only and computes best and weakest stages without filling missing stages with zero", () => {
        const history = normalizeHistory([
            row("a", 0, { stage_breakdown: [{ stage: "Scaling", score: 9 }, { stage: "Reliability", score: 3 }] }),
            row("b", 8, { stage_breakdown: { Reliability: 5, "Data Model": null } }),
            row("c", null), row("d", 10, { status: "ACTIVE", started_at: "2026-11-03T12:00:00Z" })
        ]);
        expect(historyStats(history)).toMatchObject({ completed: 3, scored: 2, average: 4, bestStage: { stage: "Scaling", score: 9 }, weakestStage: { stage: "Reliability", score: 4 } });
        expect(stageAverages(history)).toEqual([{ stage: "Reliability", score: 4, count: 2 }, { stage: "Scaling", score: 9, count: 1 }]);
    });
    it("keeps no-data averages unavailable", () => expect(historyStats(normalizeHistory([row("a", null)]))).toMatchObject({ average: null, bestStage: null, weakestStage: null }));
    it("orders scores chronologically and compares latest with first, ignoring invalid dates", () => {
        const history = normalizeHistory([row("latest", 5.8, { completed_at: "2026-11-08T12:00:00Z" }), row("first", 4), row("bad", 10, { completed_at: "bad date" })]);
        expect(scoreTrend(history).map(item => item.id)).toEqual(["first", "latest"]);
        expect(improvement(history)).toBe(1.8);
        expect(improvement(normalizeHistory([row("one", 8)]))).toBeNull();
        expect(improvement(normalizeHistory([row("first", 8), row("last", 6, { completed_at: "2026-11-08T12:00:00Z" })]))).toBe(-2);
    });
    it("counts consecutive local completion days once, including a streak ending yesterday", () => {
        const today = new Date(2026, 10, 8, 15);
        const dated = (id: string, day: number) => row(id, 7, { completed_at: new Date(2026, 10, day, 12).toISOString() });
        const history = normalizeHistory([dated("a", 7), dated("b", 7), dated("c", 6), dated("future", 9), dated("active", 8)]);
        expect(currentStreak(history, today)).toBe(3);
        const yesterday = history.filter(item => item.interviewId !== "active");
        expect(currentStreak(yesterday, today)).toBe(2);
        expect(currentStreak(normalizeHistory([dated("old", 5)]), today)).toBe(0);
        expect(currentStreak(normalizeHistory([row("open", null, { status: "ACTIVE", started_at: today.toISOString() })]), today)).toBe(0);
    });
    it("builds a Monday-first 13-week calendar, counts attempts, and excludes future activity", () => {
        const today = new Date(2026, 10, 4, 15);
        const items = normalizeHistory([row("a", 6, { completed_at: today.toISOString() }), row("b", null, { status: "ACTIVE", started_at: today.toISOString() }), row("future", 6, { completed_at: new Date(2026, 10, 5, 12).toISOString() })]);
        const days = activityCalendar(items, today);
        expect(days).toHaveLength(91);
        expect(days[0].date.getDay()).toBe(1);
        expect(days.reduce((sum, day) => sum + day.count, 0)).toBe(2);
        expect(days.filter(day => day.future)).toHaveLength(4);
    });
    it("selects a practice problem from the weakest stage and prefers a less-practiced candidate", () => {
        const items = normalizeHistory([row("a", 7, { title: "Design a Notification System", stage_breakdown: { Reliability: 3, Scaling: 9 } })]);
        expect(recommendProblem(items)).toMatchObject({ id: "rate_limiter", level: "SDE2", weakest: { stage: "Reliability", score: 3 } });
        expect(recommendProblem([])).toMatchObject({ id: "url_shortener", level: "SDE1", weakest: null });
    });
});
