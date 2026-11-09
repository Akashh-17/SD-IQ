import { createContext, useContext } from "react";
import type { Node, Edge } from "reactflow";

export type SaveStatus = "loading" | "saved" | "saving" | "error";
export interface RoomSnapshot {
    interview: { title?: string; stage?: string; startedAt?: number; difficulty?: string };
    transcript?: { role: string; content: string }[];
    graph?: { nodes?: Node[]; edges?: Edge[]; analysis?: { components?: { name: string }[] } | null };
}
export interface RoomState {
    snapshot: RoomSnapshot | null;
    ingest: (state: RoomSnapshot) => void;
    loadInitial: () => Promise<RoomSnapshot>;
    refresh: () => Promise<RoomSnapshot | null>;
    publishReply: (text: string, completed?: boolean) => void;
    references: string[];
    saveStatus: SaveStatus;
    setSaveStatus: (status: SaveStatus) => void;
    registerFlush: (flush: () => Promise<void>) => () => void;
    flushGraph: () => Promise<void>;
    collapsed: boolean;
    toggleChat: () => void;
    fullscreen: boolean;
    toggleFullscreen: () => void;
    showHelp: () => void;
    compact: boolean;
}
export const RoomContext = createContext<RoomState | null>(null);
export const useRoom = () => useContext(RoomContext);

// Per-room cache only: share the first read across shell/chat/canvas, retry
// failures, and leave the separate live refresh path uncached.
export function sharedInitial<T>(fetchState: () => Promise<T>) {
    let pending: Promise<T> | null = null;
    return () => pending ??= fetchState().catch(error => { pending = null; throw error; });
}

export const ROOM_STEPS = ["Requirements", "High-level", "Deep dive", "Scaling", "Wrap-up"];
export function stageIndex(stage?: string) {
    if (stage === "Requirements") return 0;
    if (stage === "High Level Design") return 1;
    if (["Core Flow", "Data Model", "Reliability"].includes(stage ?? "")) return 2;
    if (stage === "Scaling") return 3;
    if (["Tradeoffs", "Wrap-up"].includes(stage ?? "")) return 4;
    return -1;
}
export function editableTarget(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}
export const labelKey = (label: string) => label.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export function diagramReferences(reply: string, graph?: RoomSnapshot["graph"]) {
    const text = labelKey(reply);
    const labels = new Set((graph?.nodes ?? []).map(node => labelKey(String(node.data?.label ?? ""))));
    return [...new Set((graph?.analysis?.components ?? []).map(component => labelKey(component.name)).filter(name => name && labels.has(name) && (` ${text} `).includes(` ${name} `)))];
}
