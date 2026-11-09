export const STAGES = ["Requirements", "High Level Design", "Core Flow", "Data Model", "Reliability", "Scaling", "Tradeoffs"];
export type InterviewStatus = "completed" | "active" | "generating" | "failed" | "expired" | "unknown";
export interface StageAverage { stage: string; score: number; count: number; }
export interface HistoryItem {
    id: string;
    interviewId: string;
    title: string;
    difficulty: string;
    level: string;
    status: InterviewStatus;
    score: number | null;
    date: string | null;
    timestamp: number | null;
    stages: { stage: string; score: number }[];
}
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const round = (value: number) => Math.round((value + Number.EPSILON) * 10) / 10;
export function validScore(value: unknown) {
    if ((typeof value !== "number" && typeof value !== "string") || value === "" || (typeof value === "string" && !value.trim())) return null;
    const score = Number(value);
    return Number.isFinite(score) && score >= 0 && score <= 10 ? score : null;
}
function parseStages(value: unknown): HistoryItem["stages"] {
    const entries: Record<string, unknown>[] = Array.isArray(value) ? value.map(record) : Object.entries(record(value)).map(([stage, score]) => ({ stage, score }));
    const unique = new Map<string, number>();
    for (const entry of entries) {
        const stage = text(entry.stage ?? entry.name);
        const score = validScore(entry.score ?? entry.value);
        if (stage && score !== null) unique.set(stage, score);
    }
    return [...unique].map(([stage, score]) => ({ stage, score }));
}
export function normalizeHistory(payload: unknown): HistoryItem[] {
    if (!Array.isArray(payload)) throw new Error("Invalid history response");
    const unique = new Map<string, HistoryItem>();
    for (const value of payload) {
        const row = record(value);
        const id = text(row.id), interviewId = text(row.interview_id);
        if (!id || !interviewId) continue;
        const rawStatus = text(row.status).toLowerCase();
        const status: InterviewStatus = ["completed", "active", "generating", "failed", "expired"].includes(rawStatus) ? rawStatus as InterviewStatus : "unknown";
        const date = text(status === "completed" ? row.completed_at ?? row.started_at ?? row.created_at : row.started_at ?? row.created_at);
        const timestamp = date ? new Date(date).getTime() : NaN;
        const difficulty = text(row.problem_difficulty);
        unique.set(interviewId, {
            id, interviewId, title: text(row.title) || "Untitled interview",
            difficulty: ["easy", "medium", "hard"].includes(difficulty.toLowerCase()) ? difficulty[0].toUpperCase() + difficulty.slice(1).toLowerCase() : "Unspecified",
            level: text(row.difficulty) || "SDE1", status,
            score: status === "completed" ? validScore(row.overall_score) : null,
            date: Number.isFinite(timestamp) ? date : null, timestamp: Number.isFinite(timestamp) ? timestamp : null,
            stages: status === "completed" ? parseStages(row.stage_breakdown ?? row.stageBreakdown) : []
        });
    }
    return [...unique.values()].sort((a, b) => (b.timestamp ?? -Infinity) - (a.timestamp ?? -Infinity));
}
export function stageAverages(items: HistoryItem[]): StageAverage[] {
    const totals = new Map<string, { total: number; count: number }>();
    for (const item of items.filter(item => item.status === "completed")) for (const { stage, score } of item.stages) {
        const previous = totals.get(stage) ?? { total: 0, count: 0 };
        totals.set(stage, { total: previous.total + score, count: previous.count + 1 });
    }
    const order = (stage: string) => STAGES.includes(stage) ? STAGES.indexOf(stage) : STAGES.length;
    return [...totals].map(([stage, { total, count }]) => ({ stage, count, score: round(total / count) }))
        .sort((a, b) => order(a.stage) - order(b.stage) || a.stage.localeCompare(b.stage));
}
export function localDay(date: Date) { return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000; }
export function currentStreak(items: HistoryItem[], today = new Date()) {
    const current = localDay(today);
    const days = new Set(items.filter(item => item.status === "completed" && item.timestamp !== null)
        .map(item => localDay(new Date(item.timestamp!))).filter(day => day <= current));
    let day = days.has(current) ? current : current - 1;
    let streak = 0;
    while (days.has(day)) { streak++; day--; }
    return streak;
}
export function historyStats(items: HistoryItem[], today = new Date()) {
    const completed = items.filter(item => item.status === "completed");
    const scored = completed.filter(item => item.score !== null);
    const stages = stageAverages(items);
    return {
        completed: completed.length, scored: scored.length,
        average: scored.length ? round(scored.reduce((sum, item) => sum + item.score!, 0) / scored.length) : null,
        bestStage: [...stages].sort((a, b) => b.score - a.score)[0] ?? null,
        weakestStage: [...stages].sort((a, b) => a.score - b.score)[0] ?? null,
        streak: currentStreak(items, today), problems: new Set(items.map(item => item.title.toLowerCase())).size
    };
}
export function scoreTrend(items: HistoryItem[]) {
    return items.filter(item => item.status === "completed" && item.score !== null && item.timestamp !== null)
        .sort((a, b) => a.timestamp! - b.timestamp!).map(item => ({ id: item.interviewId, title: item.title, date: formatDate(item.date), score: item.score! }));
}
export function improvement(items: HistoryItem[]) {
    const trend = scoreTrend(items);
    return trend.length >= 2 ? round(trend[trend.length - 1].score - trend[0].score) : null;
}
export function formatDate(date: string | null) {
    return date ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(date)) : "Date unavailable";
}
export function interviewPath(item: HistoryItem) {
    return item.status === "active" ? `/interview/${encodeURIComponent(item.interviewId)}` : `/report/${encodeURIComponent(item.interviewId)}`;
}
export function activityCalendar(items: HistoryItem[], today = new Date()) {
    const current = localDay(today);
    const weekday = (today.getDay() + 6) % 7;
    const firstDay = current - weekday - 12 * 7;
    const counts = new Map<number, number>();
    for (const item of items) if (item.timestamp !== null) {
        const day = localDay(new Date(item.timestamp));
        if (day <= current) counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return Array.from({ length: 91 }, (_, index) => {
        const day = firstDay + index;
        const utc = new Date(day * 86400000);
        const date = new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
        return { key: day, date, label: formatDate(date.toISOString()), count: counts.get(day) ?? 0, future: day > current };
    });
}
