import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ReportDiagram from "./ReportDiagram";
import { Button } from "../ui";
import { parseDiagram } from "./report.model";
beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("does not steal page keyboard shortcuts for a read-only diagram", async () => {
    const graph = parseDiagram({ nodes: [{ id: "api", type: "service", position: { x: 0, y: 0 }, data: { label: "API" } }], edges: [] });
    render(<><Button>Outside diagram</Button><ReportDiagram graph={graph} /></>);
    await waitFor(() => expect(document.querySelector(".react-flow__pane")).not.toBeNull(), { timeout: 5000 });
    const button = screen.getByRole("button", { name: "Outside diagram" });
    button.focus();
    for (const [key, code] of [[" ", "Space"], ["Shift", "ShiftLeft"], ["Meta", "MetaLeft"], ["Delete", "Delete"]]) {
        const event = new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true });
        fireEvent(button, event);
        expect(event.defaultPrevented).toBe(false);
        fireEvent.keyUp(button, { key, code });
    }
    const wheel = new WheelEvent("wheel", { deltaY: 200, bubbles: true, cancelable: true });
    fireEvent(document.querySelector(".react-flow__pane")!, wheel);
    expect(wheel.defaultPrevented).toBe(false);
});
