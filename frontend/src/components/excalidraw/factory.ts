import { NODE_CATALOG } from "../diagram/nodeCatalog";
import type { Graph, SceneElement } from "./types";

// Builds Excalidraw elements without importing Excalidraw (pure + testable).
// The board passes them through Excalidraw's restoreElements() at runtime,
// which fills any remaining defaults.

// Colours are picked for Excalidraw's dark mode, which renders the canvas
// through an invert filter: these come out as a soft green card, a bright
// green outline and near-white text on the dark background.
export const COMPONENT_STYLE = { stroke: "#2f9e44", background: "#ebfbee", text: "#1e1e1e" } as const;
export const COMPONENT_SIZE = { width: 184, height: 96, icon: 30 } as const;
const EXCALIFONT = 5;

export const iconFileId = (type: string) => `systemiq-icon-${type}`;
const random = () => Math.floor(Math.random() * 2 ** 31);

function base(id: string, type: string, x: number, y: number, width: number, height: number, extra: Partial<SceneElement> = {}): SceneElement {
    return {
        id, type, x, y, width, height, angle: 0,
        strokeColor: COMPONENT_STYLE.stroke, backgroundColor: "transparent", fillStyle: "solid",
        strokeWidth: 2, strokeStyle: "solid", roughness: 1, opacity: 100, roundness: null,
        seed: random(), version: 1, versionNonce: random(), index: null, isDeleted: false,
        groupIds: [], frameId: null, boundElements: null, updated: Date.now(), link: null, locked: false,
        ...extra
    };
}

function text(id: string, value: string, x: number, y: number, width: number, containerId: string, extra: Partial<SceneElement> = {}): SceneElement {
    const lines = Math.max(1, Math.ceil((value.length * 9) / width));
    return base(id, "text", x, y, width, lines * 20, {
        strokeColor: COMPONENT_STYLE.text, text: value, originalText: value, fontSize: 16, fontFamily: EXCALIFONT,
        textAlign: "center", verticalAlign: "middle", containerId, autoResize: true, lineHeight: 1.25, ...extra
    });
}

export function knownComponent(type: string) {
    return Object.hasOwn(NODE_CATALOG, type) ? type : "service";
}

// One component: a hand-drawn card with the icon on top and an editable label
// (bound text) at the bottom, grouped so it moves as one piece.
export function componentElements(type: string, position: { x: number; y: number }, options: { id?: string; label?: string } = {}): SceneElement[] {
    const kind = knownComponent(type);
    const id = options.id ?? `${kind}_${crypto.randomUUID()}`;
    const label = options.label?.trim() || NODE_CATALOG[kind].label;
    const group = `${id}-group`;
    const { width, height, icon } = COMPONENT_SIZE;
    const card = base(id, "rectangle", position.x, position.y, width, height, {
        backgroundColor: COMPONENT_STYLE.background, roundness: { type: 3 }, groupIds: [group],
        boundElements: [{ id: `${id}-label`, type: "text" }],
        customData: { componentType: kind }
    });
    const image = base(`${id}-icon`, "image", position.x + (width - icon) / 2, position.y + 12, icon, icon, {
        strokeColor: "transparent", groupIds: [group], fileId: iconFileId(kind), status: "saved", scale: [1, 1], crop: null
    });
    const caption = text(`${id}-label`, label, position.x + 8, position.y + height - 32, width - 16, id, { verticalAlign: "bottom", groupIds: [group] });
    return [card, image, caption];
}

// An arrow from one component to another, bound at both ends.
export function arrowElements(source: SceneElement, target: SceneElement, options: { id?: string; label?: string } = {}): SceneElement[] {
    const id = options.id ?? `arrow_${crypto.randomUUID()}`;
    const start = { x: source.x + source.width, y: source.y + source.height / 2 };
    const end = { x: target.x, y: target.y + target.height / 2 };
    const label = options.label?.trim() ?? "";
    const arrow = base(id, "arrow", start.x, start.y, Math.abs(end.x - start.x), Math.abs(end.y - start.y), {
        strokeColor: COMPONENT_STYLE.text, roundness: { type: 2 },
        points: [[0, 0], [end.x - start.x, end.y - start.y]], lastCommittedPoint: null,
        startBinding: { elementId: source.id, focus: 0, gap: 6 }, endBinding: { elementId: target.id, focus: 0, gap: 6 },
        startArrowhead: null, endArrowhead: "arrow", elbowed: false,
        boundElements: label ? [{ id: `${id}-label`, type: "text" }] : null
    });
    const result = [arrow];
    if (label) result.push(text(`${id}-label`, label, (start.x + end.x) / 2 - 60, (start.y + end.y) / 2 - 10, 120, id, { fontSize: 14 }));
    return result;
}

// Old interviews saved React Flow nodes/edges. Rebuild them as Excalidraw
// components, keeping node ids so the graph (and its signature) stays the same.
export function migrateLegacyGraph(graph: { nodes?: unknown[]; edges?: unknown[] } | null | undefined): SceneElement[] {
    const elements: SceneElement[] = [];
    const cards = new Map<string, SceneElement>();
    for (const item of graph?.nodes ?? []) {
        const node = item as { id?: unknown; type?: unknown; position?: { x?: unknown; y?: unknown }; data?: { label?: unknown } };
        const x = Number(node.position?.x), y = Number(node.position?.y);
        if (typeof node.id !== "string" || !node.id || cards.has(node.id) || !Number.isFinite(x) || !Number.isFinite(y)) continue;
        const parts = componentElements(String(node.type ?? "service"), { x, y }, { id: node.id, label: typeof node.data?.label === "string" ? node.data.label : undefined });
        cards.set(node.id, parts[0]);
        elements.push(...parts);
    }
    for (const item of graph?.edges ?? []) {
        const edge = item as { id?: unknown; source?: unknown; target?: unknown; label?: unknown; data?: { label?: unknown } };
        const source = cards.get(String(edge.source)), target = cards.get(String(edge.target));
        if (!source || !target || source === target) continue;
        const rawLabel = edge.data?.label ?? edge.label;
        const parts = arrowElements(source, target, { id: typeof edge.id === "string" && edge.id ? edge.id : undefined, label: typeof rawLabel === "string" ? rawLabel : "" });
        for (const card of [source, target]) card.boundElements = [...(card.boundElements ?? []), { id: parts[0].id, type: "arrow" }];
        elements.push(...parts);
    }
    return elements;
}

export type { Graph };
