import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Topbar from "./InterviewTopbar";
import { endInterview } from "../services/endInterview.service";
vi.mock("../services/endInterview.service", () => ({ endInterview: vi.fn() }));
vi.mock("../services/interviewState.service", () => ({ getInterviewState: async () => ({ interview: { title: "Design TinyURL", stage: "Core Flow", startedAt: Date.now() - 62000 } }) }));
beforeEach(() => {
    vi.mocked(endInterview).mockResolvedValue({ status: "generating" });
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function mount() {
    render(<MemoryRouter initialEntries={["/interview/id"]}><Routes><Route path="/interview/:interviewId" element={<Topbar />} /><Route path="/report/:interviewId" element={<div>Report waiting page</div>} /></Routes></MemoryRouter>);
}
function confirmEnd() {
    fireEvent.click(screen.getByRole("button", { name: "End interview" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "End interview" }));
}
it("navigates to the report as soon as end is accepted, without waiting for generation", async () => {
    mount(); confirmEnd();
    expect(await screen.findByText("Report waiting page")).toBeInTheDocument();
    expect(endInterview).toHaveBeenCalledTimes(1);
});
it("shows the real stage grouped into the five-step display and elapsed time", async () => {
    mount(); await screen.findByText("Design TinyURL");
    expect(screen.getByText("Deep dive").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("timer")).toHaveTextContent(/01:0[12]/);
    fireEvent.click(screen.getByRole("button", { name: "End interview" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep practicing" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(endInterview).not.toHaveBeenCalled();
});
it("keeps the interview open on failure and lets the user retry", async () => {
    vi.mocked(endInterview).mockRejectedValueOnce(new Error("offline"));
    mount(); confirmEnd();
    expect(await screen.findByRole("alert")).toHaveTextContent("Please try again");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "End interview" }));
    expect(await screen.findByText("Report waiting page")).toBeInTheDocument();
    expect(endInterview).toHaveBeenCalledTimes(2);
});
