import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useReducedMotion } from "./useReducedMotion";
import { StreamText, AnimatedNumber, PageTransition } from "./index";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("responds to live reduced-motion changes and removes its listener on unmount", () => {
    let matches = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", () => ({ matches, addEventListener: (_event: string, callback: () => void) => listeners.add(callback), removeEventListener: (_event: string, callback: () => void) => listeners.delete(callback) }));
    function Preference() { return <p>{useReducedMotion() ? "reduced" : "animated"}</p>; }
    const { unmount } = render(<Preference />);
    expect(screen.getByText("animated")).toBeInTheDocument();
    act(() => { matches = true; listeners.forEach(callback => callback()); });
    expect(screen.getByText("reduced")).toBeInTheDocument();
    act(() => { matches = false; listeners.forEach(callback => callback()); });
    expect(screen.getByText("animated")).toBeInTheDocument();
    unmount();
    expect(listeners.size).toBe(0);
});

it("exposes full stream text and final numbers without announcing every animation frame", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    const { rerender } = render(<><StreamText text="Design a queue" /><AnimatedNumber value={128} suffix="ms" /></>);
    expect(screen.getByText("Design a queue", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.getByText("128ms", { selector: ".sr-only" })).toBeInTheDocument();
    rerender(<><StreamText text="Design a queue with retries" complete /><AnimatedNumber value={138} suffix="ms" /></>);
    expect(screen.getByText("Design a queue with retries", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.getByText("138ms", { selector: ".sr-only" })).toBeInTheDocument();
    expect(document.querySelector('[aria-live="assertive"]')).toBeNull();
});

it("keeps page content available when reduced motion is requested", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    render(<PageTransition transitionKey="report"><h1>Report</h1></PageTransition>);
    expect(screen.getByRole("heading", { name: "Report" })).toBeVisible();
});
