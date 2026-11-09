import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ChatPanel from "./ChatPanel";
import { getInterviewState } from "../services/interviewState.service";
import { initializeInterview } from "../services/initializeInterview.service";
import { streamInterviewMessage } from "../services/chat.service";
const voice = vi.hoisted(() => ({ init: vi.fn(), start: vi.fn(), stop: vi.fn(), speak: vi.fn() }));
vi.mock("../services/interviewState.service", () => ({ getInterviewState: vi.fn() }));
vi.mock("../services/initializeInterview.service", () => ({ initializeInterview: vi.fn() }));
vi.mock("../services/chat.service", () => ({ streamInterviewMessage: vi.fn() }));
// Keep a speech-output spy so a future accidental read-aloud call fails the regression test.
vi.mock("../services/speechService", () => ({ default: voice }));
const failure = (status: number) => ({ isAxiosError: true, response: { status } });
function mount() { return render(<MemoryRouter initialEntries={["/interview/test-id"]}><Routes><Route path="/interview/:interviewId" element={<ChatPanel />} /><Route path="/report/:interviewId" element={<div>Report page</div>} /></Routes></MemoryRouter>); }
beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.mocked(getInterviewState).mockResolvedValue({ transcript: [] });
    vi.mocked(initializeInterview).mockResolvedValue({ reply: "How would you scale this?" });
    Element.prototype.scrollIntoView = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });
it("renders initialization network errors", async () => {
    vi.mocked(getInterviewState).mockRejectedValueOnce(new Error("offline")); mount();
    expect(await screen.findByText(/Can't reach the server/)).toBeInTheDocument();
});
it("renders a rate-limit message after sending fails", async () => {
    vi.mocked(streamInterviewMessage).mockRejectedValueOnce(failure(429)); mount();
    await screen.findByText("How would you scale this?");
    const input = screen.getByPlaceholderText("Explain your design...");
    fireEvent.change(input, { target: { value: "Use replicated storage" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    expect(await screen.findByText(/sending messages too quickly/)).toBeInTheDocument();
    expect(streamInterviewMessage).toHaveBeenCalledWith("test-id", "Use replicated storage", expect.objectContaining({ signal: expect.any(AbortSignal) }));
});
it("redirects an inactive interview to its report", async () => {
    vi.mocked(getInterviewState).mockRejectedValueOnce(failure(404)); mount();
    expect(await screen.findByText("Report page")).toBeInTheDocument();
});

it("keeps the opening question and completed replies silent", async () => {
    vi.mocked(streamInterviewMessage).mockResolvedValueOnce({ reply: "How would you handle a cache failure?", completed: false });
    mount();
    await screen.findByText("How would you scale this?");
    expect(voice.speak).not.toHaveBeenCalled();
    const input = screen.getByPlaceholderText("Explain your design...");
    fireEvent.change(input, { target: { value: "Use a cache" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByText("How would you handle a cache failure?")).toBeInTheDocument();
    expect(voice.speak).not.toHaveBeenCalled();
});

it("renders tokens and evaluation phase before the reply completes", async () => {
    let finish!: (value: { reply: string; completed: boolean }) => void;
    vi.mocked(streamInterviewMessage).mockImplementationOnce(async (_id, _text, options) => {
        options.onStatus("evaluating");
        options.onToken("Incremental ");
        return new Promise(resolve => { finish = resolve; });
    });
    mount(); await screen.findByText("How would you scale this?");
    const input = screen.getByPlaceholderText("Explain your design...");
    fireEvent.change(input, { target: { value: "Use replicated storage" } }); fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByText("Incremental")).toBeInTheDocument();
    expect(screen.getByText("Evaluating your answer...")).toBeInTheDocument();
    // A second Enter cannot start another run while this turn is active.
    fireEvent.change(input, { target: { value: "Another answer" } }); fireEvent.keyDown(input, { key: "Enter" });
    expect(streamInterviewMessage).toHaveBeenCalledTimes(1);
    finish({ reply: "Incremental reply", completed: false });
    expect(await screen.findByText("Incremental reply")).toBeInTheDocument();
    expect(screen.queryByText("Evaluating your answer...")).not.toBeInTheDocument();
});
it("cancels an in-flight stream on unmount", async () => {
    let signal: AbortSignal | undefined;
    vi.mocked(streamInterviewMessage).mockImplementationOnce(async (_id, _text, options) => {
        signal = options.signal;
        return new Promise((_resolve, reject) => signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))));
    });
    const view = mount(); await screen.findByText("How would you scale this?");
    const input = screen.getByPlaceholderText("Explain your design...");
    fireEvent.change(input, { target: { value: "Use a cache" } }); fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(signal).toBeDefined());
    view.unmount(); expect(signal?.aborted).toBe(true);
});
it("opens the report after a completed streamed reply", async () => {
    vi.mocked(streamInterviewMessage).mockResolvedValueOnce({ reply: "Thank you for your design.", completed: true });
    mount(); await screen.findByText("How would you scale this?");
    const input = screen.getByPlaceholderText("Explain your design...");
    fireEvent.change(input, { target: { value: "let's wrap up" } }); fireEvent.keyDown(input, { key: "Enter" });
    await screen.findByText("Thank you for your design.");
    expect(await screen.findByText("Report page", {}, { timeout: 4500 })).toBeInTheDocument();
});

it("keeps Shift+Enter and composing Enter for text input", async () => {
    mount(); await screen.findByText("How would you scale this?");
    const input = screen.getByRole("textbox", { name: "Your answer" });
    fireEvent.change(input, { target: { value: "Line one\nLine two" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(streamInterviewMessage).not.toHaveBeenCalled();
    expect(input).toHaveValue("Line one\nLine two");
});
it("pauses autoscroll while reading older messages and resumes from Jump to latest", async () => {
    let finish!: (value: { reply: string; completed: boolean }) => void;
    let token!: (text: string) => void;
    vi.mocked(streamInterviewMessage).mockImplementationOnce(async (_id, _text, options) => {
        token = options.onToken;
        return new Promise(resolve => { finish = resolve; });
    });
    mount(); await screen.findByText("How would you scale this?");
    const log = screen.getByRole("log");
    Object.defineProperties(log, { scrollHeight: { configurable: true, value: 1200 }, clientHeight: { configurable: true, value: 300 } });
    log.scrollTop = 100; fireEvent.scroll(log);
    const input = screen.getByRole("textbox", { name: "Your answer" });
    fireEvent.change(input, { target: { value: "Use Redis" } }); fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(token).toBeDefined());
    act(() => token("Consider caching."));
    await screen.findByText("Consider caching.");
    expect(log.scrollTop).toBe(100);
    expect(document.querySelector(".room-stream-cursor")).toBeInTheDocument();
    const scroll = vi.fn(); log.scrollTo = scroll;
    fireEvent.click(screen.getByRole("button", { name: "Jump to latest" }));
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ top: 1200 }));
    await act(async () => finish({ reply: "Consider caching.", completed: false }));
    expect(document.querySelector(".room-stream-cursor")).not.toBeInTheDocument();
});

it("waits for microphone permission before allowing an answer to send", async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => new Promise(() => {}) } });
    vi.stubGlobal("MediaRecorder", class {});
    try {
        mount(); await screen.findByText("How would you scale this?");
        const input = screen.getByRole("textbox", { name: "Your answer" });
        fireEvent.change(input, { target: { value: "Use an atomic counter." } });
        fireEvent.click(screen.getByRole("button", { name: "Record your answer" }));
        expect(await screen.findByText("Opening microphone...")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Send answer" })).toBeDisabled();
        fireEvent.keyDown(input, { key: "Enter" });
        await act(async () => { await Promise.resolve(); });
        expect(streamInterviewMessage).not.toHaveBeenCalled();
    } finally {
        if (original) Object.defineProperty(navigator, "mediaDevices", original);
        else Reflect.deleteProperty(navigator, "mediaDevices");
    }
});
