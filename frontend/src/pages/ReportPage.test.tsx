import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import ReportPage from "./ReportPage";
import { endInterview, getReportStatus } from "../services/endInterview.service";
vi.mock("../components/layout/DashboardLayout", () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("../services/endInterview.service", () => ({ endInterview: vi.fn(), getReportStatus: vi.fn() }));
vi.mock("../services/auth.service", () => ({ getSession: async () => ({ access_token: "mock-token-demo-user" }) }));
const report = {
    interview: { id: "row", interview_id: "test-id", title: "Design TinyURL", difficulty: "SDE1", problem_difficulty: "Easy", overall_score: 7, completed_at: "2026-11-08", status: "COMPLETED" },
    report: { summary: "Practice report ready", strengths: ["Clear design"], weaknesses: [], recommendations: [], stageBreakdown: [] }
};
function mount() { return render(<MemoryRouter initialEntries={["/report/test-id"]}><Routes><Route path="/report/:interviewId" element={<ReportPage />} /></Routes></MemoryRouter>); }
async function flush() { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); }
beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.mocked(getReportStatus).mockResolvedValue({ status: "generating" });
    vi.mocked(endInterview).mockResolvedValue({ status: "generating" });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify(report), { headers: { "Content-Type": "application/json" } })));
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); vi.unstubAllGlobals(); });
it("shows preparation steps, polls after 2 seconds and renders the ready report", async () => {
    vi.useFakeTimers(); vi.mocked(getReportStatus).mockResolvedValueOnce({ status: "generating" }).mockResolvedValueOnce({ status: "ready" });
    mount(); await flush();
    expect(screen.getByRole("heading", { name: "Generating your report" })).toBeInTheDocument();
    for (const label of ["Analyzing answers", "Scoring stages", "Writing feedback"]) expect(screen.getByText(label)).toBeInTheDocument();
    expect(getReportStatus).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1999); }); expect(getReportStatus).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(screen.getByRole("heading", { name: "Design TinyURL" })).toBeInTheDocument();
    expect(getReportStatus).toHaveBeenCalledTimes(2); expect(fetch).toHaveBeenCalledTimes(1);
});
it("backs off on long jobs and cancels polling on unmount", async () => {
    vi.useFakeTimers(); const view = mount(); await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); }); expect(getReportStatus).toHaveBeenCalledTimes(3);
    await act(async () => { await vi.advanceTimersByTimeAsync(1999); }); expect(getReportStatus).toHaveBeenCalledTimes(3);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); }); expect(getReportStatus).toHaveBeenCalledTimes(4);
    await act(async () => { await vi.advanceTimersByTimeAsync(2999); }); expect(getReportStatus).toHaveBeenCalledTimes(4);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); }); expect(getReportStatus).toHaveBeenCalledTimes(5);
    const signal = vi.mocked(getReportStatus).mock.calls[0][1]; view.unmount(); expect(signal?.aborted).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); }); expect(getReportStatus).toHaveBeenCalledTimes(5);
});
it("does not overlap status requests while a poll is pending", async () => {
    vi.useFakeTimers(); vi.mocked(getReportStatus).mockImplementationOnce(() => new Promise(() => {}));
    mount(); await flush(); await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(getReportStatus).toHaveBeenCalledTimes(1);
});
it("offers retry after failure and shows the report when the retry succeeds", async () => {
    vi.mocked(getReportStatus).mockResolvedValueOnce({ status: "failed", error: "private provider details" }).mockResolvedValueOnce({ status: "ready" });
    mount(); const button = await screen.findByRole("button", { name: "Retry report generation" });
    expect(screen.queryByText("private provider details")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(await screen.findByRole("heading", { name: "Design TinyURL" })).toBeInTheDocument();
    expect(endInterview).toHaveBeenCalledWith("test-id", expect.any(AbortSignal));
});
it("treats an unauthorized or missing report as unavailable without retrying", async () => {
    vi.mocked(getReportStatus).mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } }); mount();
    expect(await screen.findByText("Report not found.")).toBeInTheDocument(); expect(getReportStatus).toHaveBeenCalledTimes(1);
});
it("recovers from a temporary status failure with backoff", async () => {
    vi.useFakeTimers(); vi.mocked(getReportStatus).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ status: "ready" });
    mount(); await flush(); expect(screen.getByText(/Reconnecting/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(3999); }); expect(getReportStatus).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); }); expect(screen.getByRole("heading", { name: "Design TinyURL" })).toBeInTheDocument();
});

it("never shows the previous report while a different report is loading", async () => {
    function NextReport() { const navigate = useNavigate(); return <button onClick={() => navigate("/report/next-id")}>Next report</button>; }
    vi.mocked(getReportStatus).mockResolvedValueOnce({ status: "ready" }).mockResolvedValueOnce({ status: "ready" });
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(async () => new Response(JSON.stringify(report))).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    render(<MemoryRouter initialEntries={["/report/test-id"]}><NextReport /><Routes><Route path="/report/:interviewId" element={<ReportPage />} /></Routes></MemoryRouter>);
    await screen.findByRole("heading", { name: "Design TinyURL" });
    fireEvent.click(screen.getByRole("button", { name: "Next report" })); await flush();
    expect(screen.queryByRole("heading", { name: "Design TinyURL" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Generating your report" })).toBeInTheDocument();
    await act(async () => { finish(new Response(JSON.stringify({ ...report, interview: { ...report.interview, title: "Design Google Drive" } }))); });
    expect(await screen.findByRole("heading", { name: "Design Google Drive" })).toBeInTheDocument();
});

it("shows a dedicated unauthorized state and stops polling", async () => {
    vi.useFakeTimers();
    vi.mocked(getReportStatus).mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } });
    mount(); await flush();
    expect(screen.getByRole("heading", { name: "Sign in to view this report" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(getReportStatus).toHaveBeenCalledTimes(1); expect(fetch).not.toHaveBeenCalled();
});
it("handles an expired session while fetching a ready report", async () => {
    vi.mocked(getReportStatus).mockResolvedValueOnce({ status: "ready" });
    vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 403 }));
    mount();
    expect(await screen.findByRole("heading", { name: "Sign in to view this report" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Design TinyURL" })).not.toBeInTheDocument();
});
it("keeps generation retry available after a temporary restart failure", async () => {
    vi.mocked(getReportStatus).mockResolvedValueOnce({ status: "failed" });
    vi.mocked(endInterview).mockRejectedValueOnce(new Error("offline"));
    mount(); fireEvent.click(await screen.findByRole("button", { name: "Retry report generation" }));
    expect(await screen.findByText("Couldn't restart report generation. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry report generation" })).not.toBeDisabled();
});
