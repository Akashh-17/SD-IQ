import { describe, expect, it } from "vitest";
import { sceneToGraph, sceneVersion } from "./converter";
import { arrowElements, componentElements, migrateLegacyGraph } from "./factory";
import type { SceneElement } from "./types";

const signature = (graph: ReturnType<typeof sceneToGraph>) => JSON.stringify({
    nodes: graph.nodes.map(node => `${node.id}|${node.type}|${node.data.label}`).sort(),
    edges: graph.edges.map(edge => `${edge.source}>${edge.target}|${edge.label}`).sort()
});
const shape = (id: string, type: string, x: number, y: number, width: number, height: number, extra: Partial<SceneElement> = {}): SceneElement => ({ id, type, x, y, width, height, isDeleted: false, groupIds: [], frameId: null, boundElements: null, ...extra });
const textFor = (id: string, containerId: string | null, value: string): SceneElement => shape(id, "text", 0, 0, 10, 10, { containerId, text: value, originalText: value });

describe("sceneToGraph", () => {
    it("turns tagged library components into typed nodes with their labels", () => {
        const graph = sceneToGraph([...componentElements("redis", { x: 10, y: 20 }, { id: "cache" }), ...componentElements("sqldb", { x: 300, y: 20 }, { id: "db", label: "Orders DB" })]);
        expect(graph.nodes).toEqual([
            { id: "cache", type: "redis", position: { x: 10, y: 20 }, data: { label: "Redis cache" } },
            { id: "db", type: "sqldb", position: { x: 300, y: 20 }, data: { label: "Orders DB" } }
        ]);
    });

    it("turns plain shapes with text into custom nodes and ignores empty shapes", () => {
        const graph = sceneToGraph([shape("box", "ellipse", 0, 0, 120, 60), textFor("box-text", "box", "  Rate   limiter "), shape("empty", "rectangle", 400, 0, 100, 50)]);
        expect(graph.nodes).toEqual([{ id: "box", type: "custom", position: { x: 0, y: 0 }, data: { label: "Rate limiter" } }]);
    });

    it("turns arrows bound at both ends into labelled edges, even when bound to the icon or label", () => {
        const api = componentElements("service", { x: 0, y: 0 }, { id: "api" });
        const db = componentElements("sqldb", { x: 400, y: 0 }, { id: "db" });
        const [arrow, label] = arrowElements(api[0], db[0], { id: "write", label: "writes" });
        const viaIcon = { ...arrowElements(api[0], db[0], { id: "read" })[0], startBinding: { elementId: "api-icon", focus: 0, gap: 4 }, endBinding: { elementId: "db-label", focus: 0, gap: 4 } };
        const graph = sceneToGraph([...api, ...db, arrow, label, viaIcon]);
        expect(graph.edges).toEqual([
            { id: "write", source: "api", target: "db", label: "writes", data: { label: "writes" } },
            { id: "read", source: "api", target: "db", label: "", data: { label: "" } }
        ]);
    });

    it("ignores unbound arrows, half-bound arrows, self-loops, freehand, lines, loose text and deleted elements", () => {
        const api = componentElements("service", { x: 0, y: 0 }, { id: "api" });
        const [bound] = arrowElements(api[0], api[0], { id: "loop" });
        const graph = sceneToGraph([
            ...api, bound,
            shape("free", "arrow", 0, 0, 50, 50, { startBinding: null, endBinding: null }),
            shape("half", "arrow", 0, 0, 50, 50, { startBinding: { elementId: "api", focus: 0, gap: 4 }, endBinding: null }),
            shape("pen", "freedraw", 0, 0, 30, 30), shape("line", "line", 0, 0, 30, 30), textFor("note", null, "remember TTLs"),
            ...componentElements("redis", { x: 500, y: 0 }, { id: "gone" }).map(element => ({ ...element, isDeleted: true }))
        ]);
        expect(graph.nodes.map(node => node.id)).toEqual(["api"]);
        expect(graph.edges).toEqual([]);
    });

    it("treats frames and enclosing labelled shapes as groups, not nodes", () => {
        const api = componentElements("service", { x: 50, y: 50 }, { id: "api" }).map(element => ({ ...element, frameId: "frame" }));
        const cache = componentElements("redis", { x: 650, y: 50 }, { id: "cache" });
        const graph = sceneToGraph([
            shape("frame", "frame", 0, 0, 400, 300, { name: "VPC" }), ...api,
            shape("zone", "rectangle", 600, 0, 400, 300), textFor("zone-text", "zone", "Read path"), ...cache
        ]);
        expect(graph.nodes.map(node => [node.id, node.data.group])).toEqual([["api", "VPC"], ["cache", "Read path"]]);
    });

    it("keeps the same structural signature when elements are only moved or restyled", () => {
        const api = componentElements("service", { x: 0, y: 0 }, { id: "api" });
        const db = componentElements("sqldb", { x: 400, y: 0 }, { id: "db" });
        const scene = [...api, ...db, ...arrowElements(api[0], db[0], { id: "a", label: "SQL" })];
        const moved = scene.map(element => ({ ...element, x: element.x + 137, y: element.y - 42, strokeColor: "#e03131", version: 9 }));
        expect(signature(sceneToGraph(moved))).toBe(signature(sceneToGraph(scene)));
        expect(sceneVersion(moved)).not.toBe(sceneVersion(scene));
        const renamed = moved.map(element => element.id === "db-label" ? { ...element, text: "Postgres", originalText: "Postgres" } : element);
        expect(signature(sceneToGraph(renamed))).not.toBe(signature(sceneToGraph(moved)));
    });
});

describe("migrateLegacyGraph", () => {
    it("rebuilds old React Flow diagrams with the same node ids, labels and edges", () => {
        const legacy = {
            nodes: [
                { id: "webclient_1", type: "webclient", position: { x: 0, y: 0 }, data: { label: "Browser" } },
                { id: "lb_1", type: "lb", position: { x: 300, y: 0 }, data: { label: "Load balancer" } },
                { id: "x", type: "made-up", position: { x: 600, y: 0 }, data: { label: "Mystery" } },
                { id: "bad", type: "lb", position: { x: "nope" }, data: {} }
            ],
            edges: [{ id: "e1", source: "webclient_1", target: "lb_1", data: { label: "HTTPS" } }, { id: "e2", source: "lb_1", target: "missing" }]
        };
        const graph = sceneToGraph(migrateLegacyGraph(legacy));
        expect(graph.nodes.map(node => [node.id, node.type, node.data.label])).toEqual([["webclient_1", "webclient", "Browser"], ["lb_1", "lb", "Load balancer"], ["x", "service", "Mystery"]]);
        expect(graph.edges).toEqual([{ id: "e1", source: "webclient_1", target: "lb_1", label: "HTTPS", data: { label: "HTTPS" } }]);
    });

    it("handles empty or missing graphs", () => {
        expect(migrateLegacyGraph(null)).toEqual([]);
        expect(migrateLegacyGraph({ nodes: [], edges: [] })).toEqual([]);
    });
});
