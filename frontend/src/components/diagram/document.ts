import { applyEdgeChanges, applyNodeChanges, addEdge, type Connection, type Edge, type EdgeChange, type Node, type NodeChange } from "reactflow";

export interface GraphDocument { nodes: Node[]; edges: Edge[]; }
export interface DocumentState { graph: GraphDocument; past: GraphDocument[]; future: GraphDocument[]; dragStart: GraphDocument | null; revision: number; loaded: boolean; }
export type DocumentAction =
    | { type: "restore"; graph: GraphDocument }
    | { type: "nodes"; changes: NodeChange[] }
    | { type: "edges"; changes: EdgeChange[] }
    | { type: "add"; node: Node }
    | { type: "connect"; connection: Connection }
    | { type: "drag-start" | "drag-stop" | "delete" | "undo" | "redo" };
export const initialDocument: DocumentState = { graph: { nodes: [], edges: [] }, past: [], future: [], dragStart: null, revision: 0, loaded: false };

// Click-to-add leaves room for the card; drag-to-add keeps the user's chosen point.
export function vacantPosition(origin: { x: number; y: number }, nodes: Node[]) {
    const open = (point: { x: number; y: number }) => nodes.every(node => point.x + 212 <= node.position.x || point.x >= node.position.x + (node.width ?? 196) + 16 || point.y + 120 <= node.position.y || point.y >= node.position.y + (node.height ?? 104) + 16);
    if (open(origin)) return origin;
    for (let ring = 1; ring <= nodes.length + 1; ring++) {
        for (const [x, y] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
            const point = { x: origin.x + x * 224 * ring, y: origin.y + y * 128 * ring };
            if (open(point)) return point;
        }
    }
    return origin;
}

function snapshot(graph: GraphDocument): GraphDocument {
    return structuredClone({ nodes: graph.nodes.map(node => {
        const result = { ...node }; delete result.selected; delete result.dragging; delete result.width; delete result.height; delete result.positionAbsolute; return result;
    }), edges: graph.edges.map(edge => { const result = { ...edge }; delete result.selected; return result; }) });
}
const same = (a: GraphDocument, b: GraphDocument) => JSON.stringify(snapshot(a)) === JSON.stringify(snapshot(b));
function changed(state: DocumentState, graph: GraphDocument): DocumentState {
    if (same(state.graph, graph)) return { ...state, graph };
    return { ...state, graph, past: [...state.past.slice(-49), snapshot(state.graph)], future: [], revision: state.revision + 1 };
}
export function documentReducer(state: DocumentState, action: DocumentAction): DocumentState {
    switch (action.type) {
        case "restore": return { ...initialDocument, graph: action.graph, loaded: true };
        case "nodes": {
            const graph = { ...state.graph, nodes: applyNodeChanges(action.changes, state.graph.nodes) };
            if (action.changes.every(change => change.type === "select" || change.type === "dimensions")) return { ...state, graph };
            return state.dragStart ? { ...state, graph, revision: state.revision + 1 } : changed(state, graph);
        }
        case "edges": {
            const graph = { ...state.graph, edges: applyEdgeChanges(action.changes, state.graph.edges) };
            return action.changes.every(change => change.type === "select") ? { ...state, graph } : changed(state, graph);
        }
        case "add": return changed(state, { ...state.graph, nodes: [...state.graph.nodes, action.node] });
        case "connect": return changed(state, { ...state.graph, edges: addEdge({ ...action.connection, type: "labeled", data: { label: "" } }, state.graph.edges) });
        case "drag-start": return { ...state, dragStart: snapshot(state.graph) };
        case "drag-stop": return !state.dragStart || same(state.dragStart, state.graph) ? { ...state, dragStart: null } : { ...state, dragStart: null, past: [...state.past.slice(-49), state.dragStart], future: [] };
        case "delete": {
            const deleted = new Set(state.graph.nodes.filter(node => node.selected).map(node => node.id));
            return changed(state, { nodes: state.graph.nodes.filter(node => !deleted.has(node.id)), edges: state.graph.edges.filter(edge => !edge.selected && !deleted.has(edge.source) && !deleted.has(edge.target)) });
        }
        case "undo": {
            const graph = state.past.at(-1); if (!graph) return state;
            return { ...state, graph, past: state.past.slice(0, -1), future: [snapshot(state.graph), ...state.future], dragStart: null, revision: state.revision + 1 };
        }
        case "redo": {
            const graph = state.future[0]; if (!graph) return state;
            return { ...state, graph, past: [...state.past, snapshot(state.graph)], future: state.future.slice(1), dragStart: null, revision: state.revision + 1 };
        }
    }
}
