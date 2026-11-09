import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import ProblemPage from "../../pages/ProblemPage";
import * as problemApi from "../../services/problem.service";

const api = vi.hoisted(() => ({ getProblems: vi.fn(), getProblem: vi.fn(), createCustomProblem: vi.fn(), getHistory: vi.fn() }));
vi.mock("../../services/problem.service", async importOriginal => ({ ...await importOriginal<typeof import("../../services/problem.service")>(), getProblems: api.getProblems, getProblem: api.getProblem, createCustomProblem: api.createCustomProblem }));
vi.mock("../../services/history.service", () => ({ getHistory: api.getHistory }));
vi.mock("../layout/DashboardLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
const builtin = { id: "url_shortener", title: "Design TinyURL", problemDifficulty: "Easy", description: "Short links", functionalRequirements: ["Create short links"], nonFunctionalRequirements: ["Fast redirects"], constraints: ["Assume a read-heavy workload"] };
const generated = { ...builtin, id: "custom_0123456789abcdef0123456789abcdef", title: "Design LeetCode", custom: true };
beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
beforeEach(() => {
    Object.values(api).forEach(mock => mock.mockReset());
    api.getProblems.mockResolvedValue([builtin]);
    api.getHistory.mockResolvedValue([]);
    api.getProblem.mockImplementation(async id => id === builtin.id ? builtin : generated);
    api.createCustomProblem.mockResolvedValue({ problem: generated, matched: false });
});
afterEach(cleanup);
const show = () => render(<MemoryRouter><ProblemPage /></MemoryRouter>);
async function topicForm() { show(); return screen.findByRole("form", { name: "Practice any topic" }); }

it("provides topic examples and inline validation without spending a request", async () => {
    const form = await topicForm();
    fireEvent.submit(form);
    expect(api.createCustomProblem).not.toHaveBeenCalled();
    expect(screen.getByText(/3.*120 characters/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Design Google Docs" }));
    expect(screen.getByLabelText("What would you like to design?")).toHaveValue("Design Google Docs");
    expect(screen.getByLabelText("What would you like to design?")).toHaveFocus();
});
it("shows real pending state, blocks duplicates and opens the generated brief", async () => {
    let finish!: (result: { problem: typeof generated; matched: boolean }) => void;
    api.createCustomProblem.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const form = await topicForm();
    fireEvent.click(screen.getByRole("button", { name: "Design LeetCode" }));
    fireEvent.submit(form); fireEvent.submit(form);
    expect(screen.getByRole("status", { name: "Preparing your interview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Preparing/ })).toBeDisabled();
    expect(api.createCustomProblem).toHaveBeenCalledTimes(1);
    expect(api.createCustomProblem).toHaveBeenCalledWith("Design LeetCode", expect.any(AbortSignal));
    await act(async () => finish({ problem: generated, matched: false }));
    expect(await screen.findByRole("dialog", { name: "Design LeetCode" })).toBeInTheDocument();
    expect(await within(screen.getByRole("dialog")).findByText("AI-generated")).toBeInTheDocument();
});
it("reuses a matched builtin without duplicating it or marking it AI-generated", async () => {
    api.createCustomProblem.mockResolvedValue({ problem: builtin, matched: true });
    const form = await topicForm();
    fireEvent.change(screen.getByLabelText("What would you like to design?"), { target: { value: "Design a URL shortener" } });
    fireEvent.submit(form);
    expect(await screen.findByRole("dialog", { name: builtin.title })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: `Explore ${builtin.title}` })).toHaveLength(1);
    expect(screen.queryByText("AI-generated")).not.toBeInTheDocument();
});
it("shows HLD suggestions and lets the user edit to the suggested topic", async () => {
    const form = await topicForm();
    api.createCustomProblem.mockRejectedValueOnce(new problemApi.ProblemApiError(422, "SystemIQ focuses on high-level system design.", "LOW_LEVEL_DESIGN", "Design a parking management system"));
    fireEvent.change(screen.getByLabelText("What would you like to design?"), { target: { value: "Design parking lot classes" } });
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent("high-level system design");
    fireEvent.click(screen.getByRole("button", { name: "Use suggested topic" }));
    expect(screen.getByLabelText("What would you like to design?")).toHaveValue("Design a parking management system");
});
it("surfaces rate limits and recovers after a failed request", async () => {
    const form = await topicForm();
    api.createCustomProblem.mockRejectedValueOnce(new problemApi.ProblemApiError(429, "Five requests per hour. Please try again later.", "RATE_LIMITED"));
    fireEvent.click(screen.getByRole("button", { name: "Design LeetCode" }));
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent(/per hour/);
    expect(screen.getByRole("button", { name: "Prepare interview" })).toBeEnabled();
    fireEvent.submit(form);
    expect(await screen.findByRole("dialog", { name: "Design LeetCode" })).toBeInTheDocument();
});
it("never renders arbitrary provider errors", async () => {
    const form = await topicForm();
    api.createCustomProblem.mockRejectedValueOnce(new Error("private provider payload"));
    fireEvent.click(screen.getByRole("button", { name: "Design LeetCode" }));
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent(/try again/i);
    expect(screen.queryByText("private provider payload")).not.toBeInTheDocument();
});
it("aborts the browser request and ignores a response after unmount", async () => {
    let finish!: (result: { problem: typeof generated; matched: boolean }) => void;
    api.createCustomProblem.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const view = show();
    const form = await screen.findByRole("form", { name: "Practice any topic" });
    fireEvent.click(screen.getByRole("button", { name: "Design LeetCode" }));
    fireEvent.submit(form);
    const signal = api.createCustomProblem.mock.calls[0][1] as AbortSignal;
    view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => finish({ problem: generated, matched: false }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
