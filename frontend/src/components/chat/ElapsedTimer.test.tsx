import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import ElapsedTimer from "./ElapsedTimer";
afterEach(() => { cleanup(); vi.useRealTimers(); });
it("updates elapsed seconds and retains the existing 45-minute end policy", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
    const deadline = vi.fn();
    render(<ElapsedTimer startedAt={Date.now() - (45 * 60 - 1) * 1000} onDeadline={deadline} />);
    expect(screen.getByRole("timer")).toHaveTextContent("44:59");
    expect(deadline).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("timer")).toHaveTextContent("45:00");
    expect(deadline).toHaveBeenCalledTimes(1);
});
