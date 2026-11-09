import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import Waveform from "./Waveform";
const connect = vi.fn(), disconnect = vi.fn(), close = vi.fn(() => Promise.resolve());
const source = { connect, disconnect };
const analyser = { fftSize: 64, disconnect, getByteTimeDomainData: (values: Uint8Array) => values.fill(150) };
beforeEach(() => {
    vi.stubGlobal("AudioContext", class { createMediaStreamSource() { return source; } createAnalyser() { return analyser; } close = close; });
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("animates from actual input samples, connects only to the analyser, and releases audio resources", () => {
    const { container, unmount } = render(<Waveform stream={{} as MediaStream} />);
    expect(container.querySelector("span span")?.getAttribute("style")).toContain("scaleY(0.488");
    expect(connect).toHaveBeenCalledExactlyOnceWith(analyser);
    unmount(); expect(close).toHaveBeenCalled(); expect(disconnect).toHaveBeenCalled();
});
it("keeps recording visuals safe if Web Audio is unavailable", () => {
    vi.stubGlobal("AudioContext", class { constructor() { throw new Error("Audio disabled"); } });
    expect(() => render(<Waveform stream={{} as MediaStream} />)).not.toThrow();
});
