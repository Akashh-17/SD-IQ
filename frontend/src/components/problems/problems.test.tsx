import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProblemPage from "../../pages/ProblemPage";
import { challengePerformance, parseChallenge, parseChallenges } from "./problem.model";
import { normalizeHistory } from "../history/history.model";

const api = vi.hoisted(() => ({ getProblems: vi.fn(), getProblem: vi.fn(), getHistory: vi.fn(), startInterview: vi.fn(), createCustomProblem: vi.fn() }));
vi.mock("../../services/problem.service", () => ({ getProblems: api.getProblems, getProblem: api.getProblem, createCustomProblem: api.createCustomProblem, ProblemApiError: Error }));
vi.mock("../../services/history.service", () => ({ getHistory: api.getHistory }));
vi.mock("../../services/interview.service", () => ({ startInterview: api.startInterview }));
vi.mock("../layout/DashboardLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
const problems = [
    { id: "short_links", title: "Design Short Links", problemDifficulty: "Easy", description: "Build a fast redirect service.", concepts: ["Unique identifiers", "Cache invalidation"], estimatedDuration: 35, difficultyLevels: ["SDE1", "SDE2", "Senior"], functionalRequirements: ["Create a short link"], nonFunctionalRequirements: ["Fast redirects"], constraints: ["A fictional workload of 100 writes per second"] },
    { id: "feed", title: "Design a Feed", problemDifficulty: "Hard", description: "Deliver updates to followers.", concepts: ["Fanout", "Ranking"], estimatedDuration: 55, difficultyLevels: ["SDE1", "SDE2", "Senior"], functionalRequirements: ["Publish updates"], nonFunctionalRequirements: ["An available feed"], constraints: ["Assume a read-heavy workload"] }
];
function history(title = problems[0].title, score: number | null = 0, status = "COMPLETED") {
    return { id: `${title}-${score}`, interview_id: `${title}-${score}`, title, status, difficulty: "SDE1", problem_difficulty: "Easy", overall_score: score, completed_at: "2026-11-08T10:00:00Z" };
}
beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); this.querySelector<HTMLElement>("button")?.focus(); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
beforeEach(() => {
    Object.values(api).forEach(mock => mock.mockReset());
    api.getProblems.mockResolvedValue(problems);
    api.getProblem.mockImplementation(async id => problems.find(problem => problem.id === id));
    api.getHistory.mockResolvedValue([]);
    api.startInterview.mockResolvedValue({ interviewId: "new-room" });
});
afterEach(cleanup);
function show() { return render(<MemoryRouter><Routes><Route path="/" element={<ProblemPage />} /><Route path="/interview/:interviewId" element={<h1>Interview workspace</h1>} /></Routes></MemoryRouter>); }
async function openBrief() {
    show();
    fireEvent.click(await screen.findByRole("button", { name: `Explore ${problems[0].title}` }));
    await screen.findByRole("group", { name: "Interview level" });
    return screen.getByRole("dialog");
}

describe("challenge data", () => {
    it("keeps source metadata and never invents missing estimates or concepts", () => {
        expect(parseChallenge(problems[0])).toMatchObject({ estimatedDuration: 35, concepts: ["Unique identifiers", "Cache invalidation"] });
        expect(parseChallenge({ ...problems[0], estimatedDuration: undefined, concepts: undefined })).toMatchObject({ estimatedDuration: null, concepts: [] });
        expect(parseChallenge({ ...problems[0], estimatedDuration: -5 }).estimatedDuration).toBeNull();
    });
    it("rejects error payloads and unsafe IDs rather than rendering fake challenges", () => {
        expect(() => parseChallenges({ message: "Internal error" })).toThrow();
        expect(() => parseChallenge({ ...problems[0], id: "../private" })).toThrow();
    });
    it("deduplicates catalog items and honors supported levels", () => {
        expect(parseChallenges([problems[0], problems[0]])).toHaveLength(1);
        expect(parseChallenge({ ...problems[0], difficultyLevels: ["Senior", "unknown"] }).difficultyLevels).toEqual(["Senior"]);
    });
    it("uses the best completed score including zero, while counting unscored attempts honestly", () => {
        const problem = parseChallenge(problems[0]);
        expect(challengePerformance(problem, normalizeHistory([history(problem.title, 0)]))).toEqual({ attempted: true, bestScore: 0 });
        expect(challengePerformance(problem, normalizeHistory([history(problem.title, 4), history(problem.title, 8.2), history(problem.title, 10, "ACTIVE")]))).toEqual({ attempted: true, bestScore: 8.2 });
        expect(challengePerformance(problem, normalizeHistory([history(problem.title, null, "ACTIVE")]))).toEqual({ attempted: true, bestScore: null });
        expect(challengePerformance(problem, [])).toEqual({ attempted: false, bestScore: null });
    });
});

describe("problem picker", () => {
    it("shows skeletons during loading and renders API descriptions, concepts, estimates and best scores", async () => {
        let finish!: (value: unknown) => void;
        api.getProblems.mockReturnValue(new Promise(resolve => { finish = resolve; }));
        api.getHistory.mockResolvedValue([history(problems[0].title, 8.2), history(problems[0].title, 5)]);
        show();
        expect(screen.getByRole("status", { name: "Loading challenges" })).toBeInTheDocument();
        await act(async () => finish(problems));
        expect(screen.getByText("Build a fast redirect service.")).toBeInTheDocument();
        expect(screen.getByText("Cache invalidation")).toBeInTheDocument();
        expect(screen.getByText("~35 min")).toBeInTheDocument();
        expect(screen.getByText("Best 8.2/10")).toBeInTheDocument();
    });
    it("combines concept search, difficulty and attempted filters and can clear empty results", async () => {
        api.getHistory.mockResolvedValue([history()]);
        show();
        await screen.findByRole("button", { name: `Explore ${problems[0].title}` });
        fireEvent.change(screen.getByLabelText("Search challenges"), { target: { value: "invalidation" } });
        expect(screen.queryByRole("button", { name: `Explore ${problems[1].title}` })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Hard" }));
        expect(screen.getByText("No challenges match just yet.")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
        fireEvent.click(screen.getByRole("button", { name: "Not attempted" }));
        expect(screen.queryByRole("button", { name: `Explore ${problems[0].title}` })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: `Explore ${problems[1].title}` })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Attempted" }));
        expect(screen.getByRole("button", { name: `Explore ${problems[0].title}` })).toBeInTheDocument();
    });
    it.each(["network", "bad payload"])("offers retry when catalog loading fails: %s", async kind => {
        if (kind === "network") api.getProblems.mockRejectedValueOnce(new Error("offline"));
        else api.getProblems.mockResolvedValueOnce({ message: "Database detail" });
        show();
        expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t load");
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("button", { name: `Explore ${problems[0].title}` })).toBeInTheDocument();
        expect(api.getProblems).toHaveBeenCalledTimes(2);
    });
    it("shows an empty catalog with refresh", async () => {
        api.getProblems.mockResolvedValueOnce([]);
        show();
        expect(await screen.findByText("New challenges are on their way.")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Refresh challenges" }));
        expect(await screen.findByRole("button", { name: `Explore ${problems[0].title}` })).toBeInTheDocument();
    });
    it("keeps the picker usable if history fails and retries personal data separately", async () => {
        api.getHistory.mockRejectedValueOnce(new Error("offline"));
        show();
        expect(await screen.findByRole("alert")).toHaveTextContent("Past attempts couldn’t load");
        expect(screen.getByRole("button", { name: "Not attempted" })).toBeDisabled();
        expect(await screen.findByRole("button", { name: `Explore ${problems[0].title}` })).toBeEnabled();
        fireEvent.click(screen.getByRole("button", { name: "Retry history" }));
        await waitFor(() => expect(screen.getByRole("button", { name: "Not attempted" })).toBeEnabled());
        expect(api.getProblems).toHaveBeenCalledTimes(1);
    });
    it("loads the selected detail API and shows its full requirements before level selection", async () => {
        api.getProblem.mockResolvedValueOnce({ ...problems[0], functionalRequirements: ["Actual detail requirement"] });
        const dialog = await openBrief();
        expect(api.getProblem).toHaveBeenCalledExactlyOnceWith("short_links");
        expect(within(dialog).getByText("Actual detail requirement")).toBeInTheDocument();
        expect(within(dialog).getByText("Fast redirects")).toBeInTheDocument();
        expect(within(dialog).getByText("A fictional workload of 100 writes per second")).toBeInTheDocument();
        expect(within(dialog).getByRole("button", { name: /^SDE1/ })).toHaveAttribute("aria-pressed", "true");
    });
    it("does not allow starting before the brief loads", async () => {
        api.getProblem.mockReturnValue(new Promise(() => {}));
        show();
        fireEvent.click(await screen.findByRole("button", { name: `Explore ${problems[0].title}` }));
        expect(screen.getByRole("status", { name: "Loading challenge brief" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Start interview" })).toBeDisabled();
    });
    it("retries a missing brief and refuses mismatched problem IDs", async () => {
        api.getProblem.mockResolvedValueOnce(problems[1]);
        show();
        fireEvent.click(await screen.findByRole("button", { name: `Explore ${problems[0].title}` }));
        expect(await screen.findByRole("alert")).toHaveTextContent("brief couldn’t load");
        fireEvent.click(screen.getByRole("button", { name: "Retry brief" }));
        expect(await screen.findByRole("group", { name: "Interview level" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Start interview" })).toBeEnabled();
    });
    it("uses the chosen level, shows setup while the request is pending, and navigates on success", async () => {
        let finish!: (value: { interviewId: string }) => void;
        api.startInterview.mockReturnValue(new Promise(resolve => { finish = resolve; }));
        await openBrief();
        fireEvent.click(screen.getByRole("button", { name: /^Senior/ }));
        const start = screen.getByRole("button", { name: "Start interview" });
        fireEvent.click(start); fireEvent.click(start);
        expect(screen.getByRole("dialog")).toHaveAccessibleName("Setting up your interview room");
        expect(api.startInterview).toHaveBeenCalledExactlyOnceWith("short_links", "Senior");
        await act(async () => finish({ interviewId: "room-id" }));
        expect(await screen.findByRole("heading", { name: "Interview workspace" })).toBeInTheDocument();
    });
    it("shows a safe start error and allows retry without losing the chosen level", async () => {
        api.startInterview.mockRejectedValueOnce(new Error("private provider detail"));
        await openBrief();
        fireEvent.click(screen.getByRole("button", { name: /^SDE2/ }));
        fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t create your interview room");
        expect(screen.queryByText("private provider detail")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^SDE2/ })).toHaveAttribute("aria-pressed", "true");
        fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
        expect(await screen.findByRole("heading", { name: "Interview workspace" })).toBeInTheDocument();
    });
    it("restores card focus on dismissal and ignores a setup result after dismissal", async () => {
        let finish!: (value: { interviewId: string }) => void;
        api.startInterview.mockReturnValue(new Promise(resolve => { finish = resolve; }));
        show();
        const card = await screen.findByRole("button", { name: `Explore ${problems[0].title}` });
        card.focus(); fireEvent.click(card);
        await screen.findByRole("group", { name: "Interview level" });
        fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
        fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
        expect(card).toHaveFocus();
        await act(async () => finish({ interviewId: "cancelled-room" }));
        expect(screen.queryByRole("heading", { name: "Interview workspace" })).not.toBeInTheDocument();
    });
    it("shows a transparent attempted badge when no scored report exists", async () => {
        api.getHistory.mockResolvedValue([history(problems[0].title, null, "ACTIVE")]);
        show();
        expect(await screen.findByText("Attempted · not scored yet")).toBeInTheDocument();
        expect(screen.queryByText(/Best /)).not.toBeInTheDocument();
    });
});
