import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import LiveDemo from "./LiveDemo";
import Navbar from "./Navbar";
import FAQ from "./FAQ";
import PopularProblems from "./PopularProblems";
import DeferredSection from "./DeferredSection";
import LandingPage from "../../pages/LandingPage";
import type { ReactNode } from "react";

const observers = new Set<Observer>();
class Observer {
    target: Element | null = null;
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; observers.add(this); }
    observe(target: Element) { this.target = target; }
    unobserve() {}
    disconnect() { observers.delete(this); }
    fire(visible: boolean) {
        this.callback([{ target: this.target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
}
let reduced = false;
function visibility(visible: boolean) { act(() => { [...observers].forEach(observer => observer.fire(visible)); }); }
function mount(children: ReactNode) { return render(<MemoryRouter><Routes><Route path="/" element={<>{children}</>} /><Route path="/login" element={<h1>Sign in to practice</h1>} /></Routes></MemoryRouter>); }

beforeEach(() => {
    reduced = false;
    observers.clear();
    vi.stubGlobal("IntersectionObserver", Observer);
    vi.stubGlobal("matchMedia", () => ({ matches: reduced, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("hero intro and calls to action", () => {
    it("keeps the architecture flowing after assembly and beyond the initial three seconds", () => {
        vi.useFakeTimers(); mount(<Hero />);
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("System design.Meet yourAI interviewer.");
        expect(screen.getByRole("button", { name: "Start a mock interview" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "Skip intro →" })).toBeEnabled();
        act(() => { vi.advanceTimersByTime(3000); });
        expect(screen.getByRole("button", { name: "Pause architecture animation" })).toBeEnabled();
        expect(screen.getByText("Live flow")).toBeInTheDocument();
        act(() => { vi.advanceTimersByTime(30000); });
        expect(document.querySelectorAll(".landing-packet")).toHaveLength(5);
    });

    it("lets the visitor skip the drawing without waiting or moving focus to a new page", () => {
        vi.useFakeTimers(); mount(<Hero />);
        fireEvent.click(screen.getByRole("button", { name: "Skip intro →" }));
        expect(screen.getByRole("button", { name: "Pause architecture animation" })).toBeEnabled();
        act(() => { vi.advanceTimersByTime(5000); });
        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
        expect(document.querySelectorAll(".landing-packet")).toHaveLength(5);
    });

    it("skips automatic intro motion when reduced motion is requested", () => {
        reduced = true; mount(<Hero />);
        expect(screen.queryByRole("button", { name: "Skip intro →" })).not.toBeInTheDocument();
        expect(screen.getByText("Reduced motion")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Pause architecture animation" })).not.toBeInTheDocument();
        expect(document.querySelectorAll(".landing-packet")).toHaveLength(0);
    });

    it("lets the visitor pause and resume continuous architecture motion", () => {
        mount(<Hero />);
        fireEvent.click(screen.getByRole("button", { name: "Skip intro →" }));
        fireEvent.click(screen.getByRole("button", { name: "Pause architecture animation" }));
        expect(document.querySelectorAll(".landing-packet")).toHaveLength(0);
        expect(screen.getByText("Paused")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Play architecture animation" }));
        expect(document.querySelectorAll(".landing-packet")).toHaveLength(5);
        expect(screen.getByText("Live flow")).toBeInTheDocument();
    });

    it("takes the primary CTA into the existing sign-in flow", () => {
        mount(<Hero />);
        fireEvent.click(screen.getByRole("button", { name: "Start a mock interview" }));
        expect(screen.getByRole("heading", { name: "Sign in to practice" })).toBeInTheDocument();
    });

    it("uses the fake command to reveal the preview and honors reduced motion", () => {
        reduced = true;
        const scrollIntoView = vi.fn();
        mount(<><Hero /><div id="live-interview" /></>);
        document.getElementById("live-interview")!.scrollIntoView = scrollIntoView;
        fireEvent.click(screen.getByRole("button", { name: "start interview --problem tinyurl" }));
        expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "instant" });
    });
});

describe("four-step walkthrough", () => {
    it("selects every step, renders its live specimen and agent label, and pauses on manual navigation", () => {
        mount(<HowItWorks />);
        const expected = ["classify_intent", "evaluate_answer", "analyze_diagram", "generate_report"];
        ["Pick a problem", "Talk it through", "Draw your architecture", "Get scored"].forEach((label, index) => {
            fireEvent.click(screen.getByRole("button", { name: new RegExp(`Step\\s*0${index + 1}\\s*${label}`) }));
            expect(screen.getByText(expected[index], { selector: "code" })).toBeInTheDocument();
        });
        expect(screen.getAllByRole("meter")).toHaveLength(3);
        expect(screen.getByRole("button", { name: "Play step animation" })).toBeInTheDocument();
    });

    it("auto-advances only while visible, pauses explicitly and stops when offscreen", () => {
        vi.useFakeTimers(); mount(<HowItWorks />);
        act(() => { vi.advanceTimersByTime(6000); });
        expect(screen.getByText("classify_intent", { selector: "code" })).toBeInTheDocument();
        visibility(true);
        act(() => { vi.advanceTimersByTime(6000); });
        expect(screen.getByText("evaluate_answer", { selector: "code" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Pause step animation" }));
        act(() => { vi.advanceTimersByTime(12000); });
        expect(screen.getByText("evaluate_answer", { selector: "code" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Play step animation" }));
        visibility(false);
        act(() => { vi.advanceTimersByTime(6000); });
        expect(screen.getByText("evaluate_answer", { selector: "code" })).toBeInTheDocument();
    });

    it("stops when the browser tab is hidden and resumes when it returns", () => {
        vi.useFakeTimers(); mount(<HowItWorks />); visibility(true);
        const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
        act(() => { document.dispatchEvent(new Event("visibilitychange")); });
        act(() => { vi.advanceTimersByTime(6000); });
        expect(screen.getByText("classify_intent", { selector: "code" })).toBeInTheDocument();
        hidden.mockReturnValue(false);
        act(() => { document.dispatchEvent(new Event("visibilitychange")); });
        act(() => { vi.advanceTimersByTime(6000); });
        expect(screen.getByText("evaluate_answer", { selector: "code" })).toBeInTheDocument();
    });

    it("keeps all four steps manually available without autoplay under reduced motion", () => {
        reduced = true; vi.useFakeTimers(); mount(<HowItWorks />); visibility(true);
        act(() => { vi.advanceTimersByTime(24000); });
        expect(screen.getByText("classify_intent", { selector: "code" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /step animation/ })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /Step\s*04\s*Get scored/ }));
        expect(screen.getAllByRole("meter")).toHaveLength(3);
    });
});

describe("scripted interview", () => {
    it("reveals an answer, updates the whiteboard and advances the seven-stage bar", () => {
        mount(<LiveDemo />);
        expect(document.querySelector(".landing-live-answer")).toHaveAttribute("aria-hidden", "true");
        const next = screen.getByRole("button", { name: "Next preview moment" });
        fireEvent.click(next);
        expect(document.querySelector(".landing-live-answer")).toHaveAttribute("aria-hidden", "false");
        fireEvent.click(next);
        expect(screen.getByText("High Level Design").closest("li")).toHaveAttribute("aria-current", "step");
        fireEvent.click(next); fireEvent.click(next);
        expect(screen.getByText("06 nodes / 05 connections")).toBeInTheDocument();
        fireEvent.click(next);
        expect(screen.getByText("Core Flow").closest("li")).toHaveAttribute("aria-current", "step");
        expect(screen.getByRole("button", { name: "Play live interview preview" })).toBeInTheDocument();
    });

    it("loops, pauses and replays without making an API call", () => {
        const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
        vi.useFakeTimers(); mount(<LiveDemo />); visibility(true);
        act(() => { vi.advanceTimersByTime(2800 * 8); });
        expect(screen.getByText("01 / 08")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Pause live interview preview" }));
        act(() => { vi.advanceTimersByTime(2800 * 2); });
        expect(screen.getByText("01 / 08")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Next preview moment" }));
        expect(screen.getByText("02 / 08")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Replay live interview preview" }));
        expect(screen.getByText("01 / 08")).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it("disables live autoplay for reduced motion while retaining next/replay controls", () => {
        reduced = true; vi.useFakeTimers(); mount(<LiveDemo />); visibility(true);
        act(() => { vi.advanceTimersByTime(2800 * 8); });
        expect(screen.getByText("01 / 08")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Pause live/ })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Next preview moment" })).toBeEnabled();
    });
});

it("provides a labelled mobile navigation dialog and real anchor destinations", () => {
    mount(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = screen.getByRole("dialog", { name: "Explore SystemIQ" });
    expect(within(dialog).getByRole("link", { name: "Live preview" })).toHaveAttribute("href", "#live-interview");
    fireEvent.click(within(dialog).getByRole("link", { name: "Live preview" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("keeps FAQ disclosure states and region associations accessible", () => {
    mount(<FAQ />);
    const question = screen.getByRole("button", { name: "How does scoring work?" });
    expect(question).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "How does scoring work?" })).toBeVisible();
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "false");
});

it("presents problem cards as examples without claiming a fixed catalog size", () => {
    mount(<PopularProblems />);
    const list = screen.getByRole("list", { name: "Available problem examples" });
    expect(within(list).getAllByRole("listitem").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Choose a system/ })).toBeInTheDocument();
    expect(screen.queryByText(/Eight problems|08 problems/i)).not.toBeInTheDocument();
    fireEvent.click(within(list).getByRole("button", { name: /URL shortener/ }));
    expect(screen.getByRole("heading", { name: "Sign in to practice" })).toBeInTheDocument();
});

it("omits the technology stack strip from the landing page", () => {
    mount(<LandingPage />);
    expect(screen.queryByRole("region", { name: "Built with" })).not.toBeInTheDocument();
    expect(screen.queryByText("Built on a thoughtful stack")).not.toBeInTheDocument();
});

it("keeps below-fold demos out of the initial render and loads them near the viewport", () => {
    const renderPanel = vi.fn();
    function Panel() { renderPanel(); return <h2>Interactive preview</h2>; }
    mount(<DeferredSection id="example-preview" title="Example"><Panel /></DeferredSection>);
    expect(renderPanel).not.toHaveBeenCalled();
    expect(screen.getByRole("status", { name: "Loading Example" })).toBeInTheDocument();
    visibility(true);
    expect(screen.getByRole("heading", { name: "Interactive preview" })).toBeInTheDocument();
    expect(document.querySelectorAll("#example-preview")).toHaveLength(1);
});

it("also loads a deferred section when an anchor or keyboard action focuses it", () => {
    mount(<DeferredSection id="keyboard-preview" title="Keyboard"><h2>Keyboard-accessible preview</h2></DeferredSection>);
    fireEvent.focus(document.getElementById("keyboard-preview")!);
    expect(screen.getByRole("heading", { name: "Keyboard-accessible preview" })).toBeInTheDocument();
});
