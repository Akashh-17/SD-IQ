import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Dashboard from "../../pages/Dashboard";
import HistoryPage from "../../pages/HistoryPage";
import ProgressPage from "../../pages/ProgressPage";
import HistoryTable from "./HistoryTable";
import { normalizeHistory } from "./history.model";

const api = vi.hoisted(() => ({ getHistory: vi.fn(), getSession: vi.fn(), startInterview: vi.fn() }));
vi.mock("../../services/history.service", () => ({ getHistory: api.getHistory }));
vi.mock("../../services/auth.service", () => ({ getSession: api.getSession }));
vi.mock("../../services/interview.service", () => ({ startInterview: api.startInterview }));
vi.mock("../layout/DashboardLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
// Fix only the container dimensions in jsdom; render the real Recharts charts.
vi.mock("recharts", async importOriginal => ({ ...await importOriginal<typeof import("recharts")>(), ResponsiveContainer: ({ children }: { children: ReactElement<{ width: number; height: number }> }) => <div>{cloneElement(children, { width: 600, height: 280 })}</div> }));

beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 8, 16));
    Object.values(api).forEach(mock => mock.mockReset());
    api.getHistory.mockResolvedValue([]);
    api.getSession.mockResolvedValue({ user: { email: "engineer@example.test", user_metadata: {} } });
    api.startInterview.mockResolvedValue({ interviewId: "recommended-id" });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
function show(content: ReactNode) {
    return render(<MemoryRouter><Routes><Route path="/" element={content} /><Route path="/problems" element={<h1>Problem picker</h1>} /><Route path="/report/:interviewId" element={<h1>Interview report</h1>} /><Route path="/interview/:interviewId" element={<h1>Interview workspace</h1>} /></Routes></MemoryRouter>);
}
const rows = [
    { id: "first", interview_id: "first", title: "Design TinyURL", difficulty: "SDE1", problem_difficulty: "Easy", status: "COMPLETED", overall_score: 4, completed_at: "2026-11-01T12:00:00Z", stage_breakdown: { Reliability: 3, Scaling: 8 } },
    { id: "last", interview_id: "last", title: "Design WhatsApp", difficulty: "SDE2", problem_difficulty: "Medium", status: "COMPLETED", overall_score: 5.8, completed_at: "2026-11-08T12:00:00Z", stage_breakdown: { Reliability: 5, Scaling: 9 } },
    { id: "open", interview_id: "open", title: "Design a News Feed", difficulty: "Senior", problem_difficulty: "Hard", status: "ACTIVE", overall_score: null, started_at: "2026-11-08T13:00:00Z" }
];

describe.each([{ name: "dashboard", Page: Dashboard }, { name: "history", Page: HistoryPage }, { name: "progress", Page: ProgressPage }])("$name data states", ({ Page }) => {
    it("shows skeletons while loading, then an honest empty state", async () => {
        let resolve!: (value: unknown[]) => void;
        api.getHistory.mockReturnValue(new Promise(done => { resolve = done; }));
        show(<Page />);
        expect(screen.getByRole("status", { name: "Loading interview history" })).toBeInTheDocument();
        await act(async () => resolve([]));
        expect(screen.queryByRole("status", { name: "Loading interview history" })).not.toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /first problem|Start an interview/i }).length).toBeGreaterThan(0);
    });
    it("recovers from a failed load with the retry button", async () => {
        api.getHistory.mockRejectedValueOnce(new Error("offline"));
        show(<Page />);
        expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t load");
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect((await screen.findAllByRole("button", { name: /first problem|Start an interview/i })).length).toBeGreaterThan(0);
        expect(api.getHistory).toHaveBeenCalledTimes(2);
    });
});

it("offers a real resume link and routes the active interview to its workspace", async () => {
    api.getHistory.mockResolvedValue(rows);
    show(<Dashboard />);
    fireEvent.click(await screen.findByRole("button", { name: "Continue interview" }));
    expect(await screen.findByRole("heading", { name: "Interview workspace" })).toBeInTheDocument();
});
it("recommends practice for the weakest stage and starts that problem at the previous level", async () => {
    api.getHistory.mockResolvedValue(rows);
    show(<Dashboard />);
    expect(await screen.findByRole("heading", { name: "Give reliability another look." })).toBeInTheDocument();
    expect(screen.getByText("4.9/10", { selector: ".sr-only" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Practice this problem" }));
    expect(await screen.findByRole("heading", { name: "Interview workspace" })).toBeInTheDocument();
    expect(api.startInterview).toHaveBeenCalledExactlyOnceWith("notification_system", "SDE2");
});
it("renders a safe retryable error when recommended practice cannot start", async () => {
    api.startInterview.mockRejectedValueOnce(new Error("private provider detail"));
    show(<Dashboard />);
    fireEvent.click(await screen.findByRole("button", { name: "Practice this problem" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t start");
    expect(screen.queryByText("private provider detail")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Practice this problem" })).toBeEnabled();
});
it("renders real progress charts, accessible data tables, calendar counts and improvement", async () => {
    api.getHistory.mockResolvedValue(rows);
    show(<ProgressPage />);
    expect(await screen.findByRole("heading", { name: "Your practice is adding up." })).toBeInTheDocument();
    expect(screen.getByText("+1.8", { selector: ".sr-only" })).toBeInTheDocument();
    const trend = screen.getByRole("table", { name: "Overall scores in chronological order" });
    expect(within(trend).getAllByRole("row")).toHaveLength(3);
    const stages = screen.getByRole("table", { name: "Stage averages" });
    expect(within(stages).getByText("8.5")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Practice calendar: 3 interviews/ })).toBeInTheDocument();
    expect(document.querySelectorAll(".recharts-wrapper")).toHaveLength(2);
});
it("keeps stage and trend charts unavailable for an unscored attempt", async () => {
    api.getHistory.mockResolvedValue([rows[2]]);
    show(<ProgressPage />);
    expect(await screen.findByText("Your baseline is ahead.")).toBeInTheDocument();
    expect(screen.getByText("More signal after your first report.")).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Stage averages" })).not.toBeInTheDocument();
});
it("ignores a load that finishes after the page unmounts", async () => {
    let resolve!: (value: unknown[]) => void;
    api.getHistory.mockReturnValue(new Promise(done => { resolve = done; }));
    const view = show(<HistoryPage />);
    view.unmount();
    await act(async () => resolve(rows));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

describe("history interactions", () => {
    it("combines search, difficulty and status, and clears an empty result", () => {
        show(<HistoryTable history={normalizeHistory(rows)} />);
        fireEvent.change(screen.getByLabelText("Search problems"), { target: { value: "whats" } });
        expect(screen.getByRole("link", { name: "Design WhatsApp" })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Design TinyURL" })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Hard" }));
        expect(screen.getByText("No matching interviews.")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
        fireEvent.click(screen.getByRole("button", { name: "In progress" }));
        expect(screen.getByRole("link", { name: "Design a News Feed" })).toHaveAttribute("href", "/interview/open");
        expect(screen.queryByRole("link", { name: "Design WhatsApp" })).not.toBeInTheDocument();
    });
    it("sorts scores in both directions with unscored rows last and supports row navigation", () => {
        show(<HistoryTable history={normalizeHistory(rows)} />);
        const sort = screen.getByRole("button", { name: "Sort by score" });
        fireEvent.click(sort);
        expect(sort.closest("th")).toHaveAttribute("aria-sort", "descending");
        expect(screen.getAllByRole("link").map(link => link.textContent)).toEqual(["Design WhatsApp", "Design TinyURL", "Design a News Feed"]);
        fireEvent.click(sort);
        expect(screen.getAllByRole("link").map(link => link.textContent)).toEqual(["Design TinyURL", "Design WhatsApp", "Design a News Feed"]);
        fireEvent.click(screen.getByRole("link", { name: "Design TinyURL" }).closest("tr")!);
        expect(screen.getByRole("heading", { name: "Interview report" })).toBeInTheDocument();
    });
    it("paginates and returns to page one when the filter changes", () => {
        const lots = Array.from({ length: 12 }, (_, index) => ({ ...rows[0], id: `${index}`, interview_id: `${index}`, title: `Problem ${index}`, completed_at: new Date(2026, 10, index + 1).toISOString() }));
        show(<HistoryTable history={normalizeHistory(lots)} />);
        expect(screen.getAllByRole("link")).toHaveLength(8);
        fireEvent.click(screen.getByRole("button", { name: "Next page" }));
        expect(screen.getAllByRole("link")).toHaveLength(4);
        expect(screen.getByRole("status")).toHaveTextContent("9–12 of 12");
        fireEvent.change(screen.getByLabelText("Search problems"), { target: { value: "Problem 11" } });
        expect(screen.getByRole("status")).toHaveTextContent("1–1 of 1");
        expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    });
});
