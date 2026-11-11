import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StageBreakdown from "./StageBreakdown";
import Recommendations from "./Recommendations";
import ReportTranscript from "./ReportTranscript";
import ReportActions from "./ReportActions";
import ReportHero from "./ReportHero";
import { normalizeReport } from "./report.model";
import { getProblems } from "../../services/problem.service";
import { startInterview } from "../../services/interview.service";
import { prepareReportPrint } from "./reportCanvas.loader";
vi.mock("./reportCanvas.loader", () => ({ prepareReportPrint: vi.fn() }));
vi.mock("../../services/problem.service", () => ({ getProblems: vi.fn() }));
vi.mock("../../services/interview.service", () => ({ startInterview: vi.fn() }));
const view = normalizeReport({ interview: { title: "Design payments", overall_score: 8.3, difficulty: "Senior", completed_at: "2026-11-08T12:20:15Z" }, report: { problemId: "custom_" + "a".repeat(32), candidateLevel: "ADVANCED", startedAt: new Date("2026-11-08T12:00:00Z").getTime(), summary: "Ready" } });
const clipboard = vi.fn();
beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("prefers-reduced-motion"), media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: clipboard } });
    clipboard.mockResolvedValue(undefined);
    vi.mocked(prepareReportPrint).mockResolvedValue(undefined);
    vi.mocked(startInterview).mockResolvedValue({ interviewId: "new-id" });
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });
function actions(report = view) {
    return render(<MemoryRouter initialEntries={["/report/test-id"]}><Routes><Route path="/report/:id" element={<ReportActions report={report} interviewId="test-id" />} /><Route path="/interview/:id" element={<div>Interview room</div>} /><Route path="/problems" element={<div>Problem picker</div>} /></Routes></MemoryRouter>);
}
it("shows the computed score, actual candidate level, title and recorded duration", () => {
    render(<ReportHero report={view} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Design payments");
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "8.3");
    expect(screen.getByText("Advanced")).toBeInTheDocument(); expect(screen.getByText("20m 15s")).toBeInTheDocument();
});
it("expands real feedback and exposes stage scores accessibly", () => {
    render(<StageBreakdown stages={[{ name: "Requirements", score: 7.4, feedback: "Estimate peak requests." }]} />);
    const button = screen.getByRole("button", { name: /Requirements/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Estimate peak requests.")).not.toBeVisible();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Estimate peak requests.")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Requirements score" })).toHaveAttribute("aria-valuenow", "7.4");
    fireEvent.click(button); expect(screen.getByText("Estimate peak requests.")).not.toBeVisible();
});
it("turns recommendations into a checkable practice plan", () => {
    render(<Recommendations recommendations={["Bound retry attempts.", "Compare storage options."]} />);
    const item = screen.getByRole("checkbox", { name: "Bound retry attempts." });
    expect(item).toHaveAttribute("aria-checked", "false");
    fireEvent.click(item); expect(item).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("1/2 checked")).toBeInTheDocument();
    fireEvent.click(item); expect(item).toHaveAttribute("aria-checked", "false");
});
it("collapses and searches the transcript without hiding messages from print markup", () => {
    render(<ReportTranscript messages={[{ role: "assistant", content: "Explain your cache." }, { role: "user", content: "Redis handles hot keys." }, { role: "user", content: "The database remains durable." }]} />);
    expect(screen.queryByRole("textbox", { name: "Search transcript" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Your conversation/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Search transcript" }), { target: { value: "redis" } });
    expect(screen.getByText("1 of 3 messages")).toBeInTheDocument();
    expect(screen.getByText("Redis", { selector: "mark" })).toBeVisible();
    expect(screen.getByText("The database remains durable.")).not.toBeVisible();
    expect(screen.getByText("The database remains durable.").closest("li")).toHaveClass("report-message");
    fireEvent.change(screen.getByRole("textbox", { name: "Search transcript" }), { target: { value: "unmatched" } });
    expect(screen.getByText("No messages match your search.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByText("The database remains durable.")).toBeVisible();
});
it("starts exactly the saved custom problem and level", async () => {
    actions(); fireEvent.click(screen.getByRole("button", { name: "Practice again" }));
    expect(await screen.findByText("Interview room")).toBeInTheDocument();
    expect(startInterview).toHaveBeenCalledExactlyOnceWith(view.problemId, "Senior"); expect(getProblems).not.toHaveBeenCalled();
});
it("resolves a legacy report from the user's live problem list and refuses ambiguous matches", async () => {
    vi.mocked(getProblems).mockResolvedValue([{ id: "pay-one", title: view.title }, { id: "pay-two", title: view.title }]);
    actions({ ...view, problemId: "" }); fireEvent.click(screen.getByRole("button", { name: "Practice again" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("choose another problem");
    expect(startInterview).not.toHaveBeenCalled();
    vi.mocked(getProblems).mockResolvedValue([{ id: "pay-one", title: view.title }]);
    fireEvent.click(screen.getByRole("button", { name: "Practice again" }));
    expect(await screen.findByText("Interview room")).toBeInTheDocument();
    expect(startInterview).toHaveBeenCalledWith("pay-one", "Senior");
});
it("does not start duplicate attempts and allows retry after a start failure", async () => {
    let fail!: (reason: Error) => void;
    vi.mocked(startInterview).mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    actions(); const button = screen.getByRole("button", { name: "Practice again" });
    fireEvent.click(button); fireEvent.click(button);
    expect(startInterview).toHaveBeenCalledTimes(1);
    await act(async () => fail(new Error("offline")));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Practice again" }));
    expect(await screen.findByText("Interview room")).toBeInTheDocument();
});
it("prints on request and copies only the private report URL", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    actions(); fireEvent.click(screen.getByRole("button", { name: "Download PDF" })); expect(print).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Copy share link" }));
    expect(await screen.findByText("Report link copied")).toBeInTheDocument();
    expect(clipboard).toHaveBeenCalledWith(window.location.origin + "/report/test-id");
    expect(screen.getByText(/stays private/)).toBeInTheDocument();
});
it("provides a keyboard-copy fallback when clipboard access fails", async () => {
    clipboard.mockRejectedValueOnce(new Error("denied"));
    actions(); fireEvent.click(screen.getByRole("button", { name: "Copy share link" }));
    const dialog = await screen.findByRole("dialog", { name: "Copy your report link" });
    expect(within(dialog).getByRole("textbox", { name: "Report link" })).toHaveValue(window.location.origin + "/report/test-id");
    expect(within(dialog).getByRole("textbox", { name: "Report link" })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("opens the existing problem picker for a different challenge", async () => {
    actions(); fireEvent.click(screen.getByRole("button", { name: "Try another problem" }));
    expect(await screen.findByText("Problem picker")).toBeInTheDocument(); expect(startInterview).not.toHaveBeenCalled();
});
it("waits for the lazy whiteboard before opening PDF printing", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    let ready!: () => void;
    vi.mocked(prepareReportPrint).mockImplementationOnce(() => new Promise(resolve => { ready = resolve; }));
    actions({ ...view, graph: { nodes: [{ id: "api", position: { x: 0, y: 0 }, data: { label: "API", kind: "service", subtype: "" } }], edges: [], scene: null, analysis: null } });
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(print).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeDisabled();
    await act(async () => ready());
    expect(print).toHaveBeenCalledTimes(1);
});
