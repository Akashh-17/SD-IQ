import type { SceneElement, StoredScene } from "../excalidraw/types";

export const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
export const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
export function validScore(value: unknown): number | null {
    if (!["number", "string"].includes(typeof value) || value === null || String(value).trim() === "") return null;
    const score = Number(value);
    return Number.isFinite(score) && score >= 0 && score <= 10 ? score : null;
}
export interface StageResult { name: string; score: number | null; feedback: string; }
export interface TranscriptMessage { role: "assistant" | "user" | "system"; content: string; }
export interface DiagramAnalysis { summary: string; issues: string[]; missingComponents: string[]; strengths: string[]; }
export interface SnapshotNode { id: string; position: { x: number; y: number }; data: { label: string; kind: string; subtype: string } }
export interface SnapshotEdge { id: string; source: string; target: string; data: { label: string } }
// nodes/edges: the graph the AI analysed. scene: the full Excalidraw drawing
// (null for interviews saved before the whiteboard switched to Excalidraw).
export interface DiagramSnapshot { nodes: SnapshotNode[]; edges: SnapshotEdge[]; scene: StoredScene | null; analysis: DiagramAnalysis | null; }
export interface ReportView {
    title: string; level: string; difficulty: string; candidateLevel: string;
    problemId: string; date: string | null; durationMs: number | null; score: number | null;
    summary: string; strengths: string[]; weaknesses: string[]; recommendations: string[];
    stages: StageResult[]; transcript: TranscriptMessage[]; graph: DiagramSnapshot | null;
}
function dateTime(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return null;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : null;
}
export function parseStages(value: unknown): StageResult[] {
    const entries: Record<string, unknown>[] = Array.isArray(value) ? value.map(object) : Object.entries(object(value)).map(([name, score]) => ({ name, ...(score !== null && typeof score === "object" ? object(score) : { score }) }));
    return entries.map(entry => ({ name: text(entry.stage ?? entry.name), score: validScore(entry.score ?? entry.value), feedback: text(entry.feedback) })).filter(entry => entry.name);
}
export function parseDiagram(value: unknown): DiagramSnapshot | null {
    if (value === null || typeof value !== "object") return null;
    const input = object(value), raw = object(input.graph ?? input), analysis = object(input.analysis);
    const nodes: SnapshotNode[] = [], ids = new Set<string>();
    for (const item of Array.isArray(raw.nodes) ? raw.nodes : []) {
        const node = object(item), position = object(node.position), data = object(node.data), id = text(node.id);
        if (!id || ids.has(id) || typeof position.x !== "number" || typeof position.y !== "number" || !Number.isFinite(position.x) || !Number.isFinite(position.y)) continue;
        ids.add(id);
        nodes.push({ id, position: { x: position.x, y: position.y }, data: { label: text(data.label) || text(node.type) || "Component", kind: text(node.type), subtype: text(data.subtype) } });
    }
    const edges: SnapshotEdge[] = (Array.isArray(raw.edges) ? raw.edges : []).map((item, index) => {
        const edge = object(item);
        return { id: text(edge.id) || "connection-" + index, source: text(edge.source), target: text(edge.target), data: { label: text(object(edge.data).label ?? edge.label) } };
    }).filter(edge => ids.has(edge.source) && ids.has(edge.target));
    const sceneElements = object(raw.scene).elements;
    const scene = Array.isArray(sceneElements) ? { elements: sceneElements.filter((element): element is SceneElement => Boolean(element) && typeof element === "object" && typeof (element as SceneElement).id === "string") } : null;
    return { nodes, edges, scene, analysis: Object.keys(analysis).length ? { summary: text(analysis.summary), issues: strings(analysis.issues), missingComponents: strings(analysis.missingComponents), strengths: strings(analysis.strengths) } : null };
}
export function normalizeReport(payload: unknown): ReportView {
    const input = object(payload), interview = object(input.interview), report = object(input.report);
    if (!Object.keys(interview).length || !Object.keys(report).length) throw new Error("Invalid report response");
    const date = dateTime(interview.completed_at ?? report.completedAt ?? report.createdAt);
    const start = dateTime(report.startedAt ?? interview.started_at);
    const duration = typeof report.durationMs === "number" && Number.isFinite(report.durationMs) && report.durationMs >= 0 ? report.durationMs : start !== null && date !== null && date >= start ? date - start : null;
    return {
        title: text(interview.title) || "System design interview", level: text(interview.difficulty), difficulty: text(interview.problem_difficulty),
        candidateLevel: text(report.candidateLevel), problemId: text(report.problemId ?? interview.problem_id),
        date: date !== null ? new Date(date).toISOString() : null, durationMs: duration,
        score: validScore(interview.overall_score) ?? validScore(report.overallScore),
        summary: text(report.summary), strengths: strings(report.strengths), weaknesses: strings(report.weaknesses), recommendations: strings(report.recommendations),
        stages: parseStages(report.stage_breakdown ?? report.stageBreakdown),
        transcript: (Array.isArray(report.transcript) ? report.transcript : []).map(item => {
            const message = object(item);
            return { role: message.role === "assistant" ? "assistant" as const : message.role === "user" ? "user" as const : "system" as const, content: typeof message.content === "string" ? message.content : "" };
        }).filter(message => message.content.trim()), graph: parseDiagram(input.graph)
    };
}
export function formatDuration(value: number | null) {
    if (value === null) return "Not recorded";
    const seconds = Math.floor(value / 1000), minutes = Math.floor(seconds / 60);
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}
export function formatDate(value: string | null) {
    return value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "Not recorded";
}
export const levelLabel = (level: string) => level.replace(/[_-]+/g, " ").toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
