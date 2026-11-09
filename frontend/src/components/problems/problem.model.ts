import type { Problem } from "../../types/api";
import type { HistoryItem } from "../history/history.model";

export const LEVELS = [
    { id: "SDE1", title: "SDE1", description: "Build a clear end-to-end design. Focus on requirements, APIs and the core data flow." },
    { id: "SDE2", title: "SDE2", description: "Go deeper on scaling, data modeling and recovery from failures." },
    { id: "Senior", title: "Senior", description: "Lead an ambiguous design. Defend capacity, operational decisions and architectural tradeoffs." }
] as const;
export type InterviewLevel = typeof LEVELS[number]["id"];
export interface Challenge extends Problem {
    custom: boolean;
    description: string;
    concepts: string[];
    estimatedDuration: number | null;
    difficultyLevels: InterviewLevel[];
    functionalRequirements: string[];
    nonFunctionalRequirements: string[];
    constraints: string[];
    assumption: string;
}
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const strings = (value: unknown) => Array.isArray(value) ? [...new Set(value.map(text).filter(Boolean))] : [];

export function parseChallenge(value: unknown): Challenge {
    const data = record(value);
    const id = text(data.id), title = text(data.title), difficulty = text(data.problemDifficulty);
    if (!/^[a-z0-9_]{1,64}$/.test(id) || !title || !["Easy", "Medium", "Hard"].includes(difficulty)) throw new Error("Challenge unavailable");
    const duration = data.estimatedDuration;
    const levels = data.difficultyLevels === undefined ? LEVELS.map(level => level.id) : strings(data.difficultyLevels).filter((id): id is InterviewLevel => LEVELS.some(level => level.id === id));
    return {
        id, title, custom: data.custom === true, problemDifficulty: difficulty, description: text(data.description), concepts: strings(data.concepts),
        estimatedDuration: typeof duration === "number" && Number.isFinite(duration) && duration > 0 ? duration : null,
        difficultyLevels: levels, functionalRequirements: strings(data.functionalRequirements),
        nonFunctionalRequirements: strings(data.nonFunctionalRequirements), constraints: strings(data.constraints), assumption: text(record(data.scale).assumption)
    };
}
export function parseChallenges(value: unknown): Challenge[] {
    if (!Array.isArray(value)) throw new Error("Challenges unavailable");
    return [...new Map(value.map(item => { const problem = parseChallenge(item); return [problem.id, problem] as const; })).values()];
}
export function challengePerformance(problem: Challenge, history: HistoryItem[]) {
    const attempts = history.filter(item => item.title.trim().toLowerCase() === problem.title.toLowerCase());
    const scores = attempts.filter(item => item.status === "completed" && item.score !== null).map(item => item.score!);
    return { attempted: attempts.length > 0, bestScore: scores.length ? Math.max(...scores) : null };
}
export type ChallengePerformance = ReturnType<typeof challengePerformance>;
