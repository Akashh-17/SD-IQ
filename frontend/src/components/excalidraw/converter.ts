import type { Graph, GraphEdge, GraphNode, SceneElement } from "./types";

// Excalidraw scene -> { nodes, edges } for the AI (same shape as the old
// React Flow graph, so the backend, analysis and signature are unchanged).
//
// - Library components (customData.componentType) become typed nodes.
// - Plain rectangles / ellipses / diamonds with text become "custom" nodes
//   labelled with that text, unless they enclose other nodes: then they're a
//   zone ("VPC", "Read path") and label those nodes' group instead.
// - Frames label the group of the nodes inside them.
// - Arrows bound to two different nodes become edges; their text is the label.
// - Freehand, lines, loose text and unbound arrows are ignored here (they stay
//   in the saved scene for the candidate).
const SHAPES = new Set(["rectangle", "ellipse", "diamond"]);

const live = (element: SceneElement) => !element.isDeleted;
const clean = (text: unknown) => (typeof text === "string" ? text : "").replace(/\s+/g, " ").trim();
const box = (element: SceneElement) => ({ left: element.x, top: element.y, right: element.x + element.width, bottom: element.y + element.height });
const encloses = (outer: SceneElement, inner: SceneElement) => {
    const a = box(outer), b = box(inner);
    return a.left <= b.left && a.top <= b.top && a.right >= b.right && a.bottom >= b.bottom;
};

export function componentType(element: SceneElement): string | null {
    const type = element.customData?.componentType;
    return typeof type === "string" && type ? type : null;
}

export function sceneToGraph(sceneElements: readonly SceneElement[]): Graph {
    const elements = sceneElements.filter(live);
    const textOf = new Map<string, string>();
    for (const element of elements) {
        if (element.type === "text" && element.containerId) textOf.set(element.containerId, clean(element.originalText ?? element.text));
    }

    // 1. Candidate nodes
    const components = elements.filter(element => SHAPES.has(element.type) && componentType(element));
    const shapes = elements.filter(element => SHAPES.has(element.type) && !componentType(element) && textOf.get(element.id));
    const candidates = [...components, ...shapes];

    // A plain shape that fully encloses another candidate is a zone, not a node
    const zones = shapes.filter(shape => candidates.some(other => other !== shape && encloses(shape, other)));
    const zoneIds = new Set(zones.map(zone => zone.id));
    const nodeElements = candidates.filter(element => !zoneIds.has(element.id));

    // 2. Map every element of a component (icon, label) to its node
    const nodeOf = new Map<string, string>();
    for (const element of nodeElements) {
        nodeOf.set(element.id, element.id);
        const group = componentType(element) ? element.groupIds?.[0] : undefined;
        if (!group) continue;
        for (const member of elements) if (member.groupIds?.[0] === group) nodeOf.set(member.id, element.id);
    }

    // 3. Group labels from frames and zones (smallest enclosing zone wins)
    const frames = new Map(elements.filter(element => element.type === "frame" || element.type === "magicframe").map(frame => [frame.id, clean(frame.name)]));
    const sortedZones = [...zones].sort((a, b) => a.width * a.height - b.width * b.height);
    const groupOf = (element: SceneElement) => {
        const zone = sortedZones.find(candidate => encloses(candidate, element));
        if (zone) return textOf.get(zone.id) ?? "";
        return element.frameId ? frames.get(element.frameId) ?? "" : "";
    };

    const nodes: GraphNode[] = nodeElements.map(element => {
        const type = componentType(element) ?? "custom";
        const label = textOf.get(element.id) || clean(element.customData?.label) || type;
        const group = groupOf(element);
        return { id: element.id, type, position: { x: Math.round(element.x), y: Math.round(element.y) }, data: group ? { label, group } : { label } };
    });

    // 4. Edges from arrows bound at both ends to two different nodes
    const edges: GraphEdge[] = [];
    const seen = new Set<string>();
    for (const arrow of elements) {
        if (arrow.type !== "arrow") continue;
        const source = arrow.startBinding ? nodeOf.get(arrow.startBinding.elementId) : undefined;
        const target = arrow.endBinding ? nodeOf.get(arrow.endBinding.elementId) : undefined;
        if (!source || !target || source === target) continue;
        const label = textOf.get(arrow.id) ?? "";
        const key = `${source}>${target}|${label}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ id: arrow.id, source, target, label, data: { label } });
    }

    return { nodes, edges };
}

// Changes when anything in the drawing changes (used to trigger autosave).
export function sceneVersion(elements: readonly SceneElement[]) {
    let hash = elements.length;
    for (const element of elements) hash = (hash * 31 + Number(element.version ?? 0) + (element.isDeleted ? 7 : 0)) % 2147483647;
    return hash;
}
