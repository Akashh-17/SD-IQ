import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ReportDiagram from "./ReportDiagram";
import { Button } from "../ui";
import { parseDiagram } from "./report.model";

// Excalidraw's SVG export needs a real canvas; the drawing itself is covered
// by the converter tests. Here we check what the report does with the SVG.
const exported = vi.hoisted(() => ({ elements: [] as { id: string; customData?: unknown }[] }));
vi.mock("@excalidraw/excalidraw", () => ({
    restoreElements: (elements: unknown[]) => elements,
    exportToSvg: async ({ elements }: { elements: { id: string }[] }) => {
        exported.elements = elements;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "640"); svg.setAttribute("height", "320");
        return svg;
    }
}));
vi.mock("../excalidraw/icons", () => ({ iconFileMap: () => ({}) }));

beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); exported.elements = []; });

it("draws an old React Flow report as a static, read-only SVG that doesn't capture page keys", async () => {
    const graph = parseDiagram({ nodes: [{ id: "api", type: "service", position: { x: 0, y: 0 }, data: { label: "API" } }], edges: [] });
    render(<><Button>Outside diagram</Button><ReportDiagram graph={graph} /></>);
    const svg = await screen.findByRole("img", { name: "Final whiteboard" }, { timeout: 5000 });
    expect(svg.getAttribute("width")).toBeNull();
    expect(exported.elements.find(element => element.id === "api")?.customData).toEqual({ componentType: "service" });
    const button = screen.getByRole("button", { name: "Outside diagram" });
    button.focus();
    for (const [key, code] of [[" ", "Space"], ["Shift", "ShiftLeft"], ["Meta", "MetaLeft"], ["Delete", "Delete"]]) {
        const event = new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true });
        fireEvent(button, event);
        expect(event.defaultPrevented).toBe(false);
    }
});

it("draws a saved Excalidraw scene even when it has sketches but no components", async () => {
    const graph = parseDiagram({ graph: { nodes: [], edges: [], scene: { elements: [{ id: "pen", type: "freedraw", x: 0, y: 0, width: 10, height: 10 }] } } });
    render(<ReportDiagram graph={graph} />);
    await waitFor(() => expect(document.querySelector("[data-report-whiteboard][data-ready='true']")).not.toBeNull());
    expect(exported.elements.map(element => element.id)).toEqual(["pen"]);
});
