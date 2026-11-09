import { expect, it } from "vitest";
import { documentReducer as reduce, initialDocument, vacantPosition } from "./document";
import { diagramReferences, stageIndex } from "../chat/room.context";
const a = { id: "a", type: "service", position: { x: 0, y: 0 }, data: { label: "API" } };
const b = { id: "b", type: "redis", position: { x: 200, y: 0 }, data: { label: "Redis" } };
it("places click-added components in a free space rather than over an existing card", () => {
    expect(vacantPosition({ x: 0, y: 0 }, [])).toEqual({ x: 0, y: 0 });
    const point = vacantPosition({ x: 0, y: 0 }, [a, b]);
    expect(point.y >= 120 || point.x >= 412 || point.x <= -212 || point.y <= -120).toBe(true);
});
it("undoes deletion of a node and its connected edges as one edit", () => {
    let state = reduce(initialDocument, { type: "restore", graph: { nodes: [{ ...a, selected: true }, b], edges: [{ id: "ab", source: "a", target: "b" }] } });
    state = reduce(state, { type: "delete" });
    expect(state.graph.edges).toHaveLength(0);
    expect(state.graph.nodes).toHaveLength(1);
    state = reduce(state, { type: "undo" });
    expect(state.graph.nodes).toHaveLength(2); expect(state.graph.edges).toHaveLength(1);
    state = reduce(state, { type: "redo" }); expect(state.graph.nodes).toHaveLength(1);
});
it("groups a whole drag into one undo and ignores selection/dimensions as edits", () => {
    let state = reduce(initialDocument, { type: "restore", graph: { nodes: [a], edges: [] } });
    state = reduce(state, { type: "nodes", changes: [{ type: "select", id: "a", selected: true }] });
    expect(state.revision).toBe(0);
    state = reduce(state, { type: "drag-start" });
    for (let x = 10; x <= 100; x += 10) state = reduce(state, { type: "nodes", changes: [{ type: "position", id: "a", position: { x, y: 0 }, dragging: true }] });
    state = reduce(state, { type: "drag-stop" });
    expect(state.past).toHaveLength(1);
    state = reduce(state, { type: "undo" }); expect(state.graph.nodes[0].position.x).toBe(0);
    state = reduce(state, { type: "redo" }); expect(state.graph.nodes[0].position.x).toBe(100);
});
it("maps the real seven stages into five visual stages", () => {
    expect(["Requirements", "High Level Design", "Core Flow", "Data Model", "Reliability", "Scaling", "Tradeoffs"].map(stageIndex)).toEqual([0, 1, 2, 2, 2, 3, 4]);
    expect(stageIndex(undefined)).toBe(-1);
});
it("highlights only analyzed node labels actually mentioned in the reply", () => {
    const graph = { nodes: [a, b], analysis: { components: [{ name: "API" }, { name: "Redis" }] } };
    expect(diagramReferences("What if Redis fails?", graph)).toEqual(["redis"]);
    expect(diagramReferences("API? What about Redis?", graph)).toEqual(["api", "redis"]);
    expect(diagramReferences("An APIary is unrelated.", graph)).toEqual([]);
});
