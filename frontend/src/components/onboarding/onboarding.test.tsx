import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OnboardingGate from "./OnboardingGate";
import OnboardingDialog from "./OnboardingDialog";
import { dismissOnboarding, hasDismissedOnboarding, onboardingKey } from "./onboarding.storage";

const auth = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("../../services/auth.service", () => auth);
let userId = "";
let sequence = 0;
beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
beforeEach(() => {
    localStorage.clear();
    userId = `onboarding-user-${++sequence}`;
    auth.getSession.mockReset().mockResolvedValue({ user: { id: userId } });
});
afterEach(cleanup);

function show(enabled = true) {
    return render(<MemoryRouter initialEntries={["/dashboard"]}><Routes>
        <Route path="/dashboard" element={<OnboardingGate enabled={enabled} />} />
        <Route path="/problems" element={<h1>Choose a problem</h1>} />
    </Routes></MemoryRouter>);
}

describe("first-run onboarding", () => {
    it("explains three steps, supports previous/direct selection, and focuses the new heading", () => {
        const onStart = vi.fn();
        render(<OnboardingDialog onDismiss={vi.fn()} onStart={onStart} />);
        expect(screen.getByRole("dialog")).toHaveAccessibleName("A quick start to SystemIQ");
        expect(screen.getByRole("heading", { name: "Follow the thread." })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(screen.getByRole("heading", { name: "Make your thinking visible." })).toHaveFocus();
        fireEvent.click(screen.getByRole("button", { name: "Previous onboarding step" }));
        expect(screen.getByRole("heading", { name: "Follow the thread." })).toHaveFocus();
        fireEvent.click(screen.getByRole("button", { name: /Step\s*03\s*Scoring/ }));
        expect(screen.getByRole("heading", { name: "Leave with a next step." })).toHaveFocus();
        fireEvent.click(screen.getByRole("button", { name: "Pick your first problem" }));
        expect(onStart).toHaveBeenCalledTimes(1);
    });
    it("finishes by saving dismissal and opening the problem picker", async () => {
        show();
        await screen.findByRole("dialog");
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        fireEvent.click(screen.getByRole("button", { name: "Pick your first problem" }));
        expect(await screen.findByRole("heading", { name: "Choose a problem" })).toBeInTheDocument();
        expect(localStorage.getItem(onboardingKey(userId))).toBe("done");
    });
    it.each(["Skip for now", "Close dialog"])("persists %s and never reopens for that user", async name => {
        const view = show();
        await screen.findByRole("dialog");
        fireEvent.click(screen.getByRole("button", { name }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(localStorage.getItem(onboardingKey(userId))).toBe("done");
        view.unmount();
        await act(async () => { show(); });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    it("dismisses on Escape via the native dialog cancel event", async () => {
        show();
        fireEvent(await screen.findByRole("dialog"), new Event("cancel", { cancelable: true }));
        expect(hasDismissedOnboarding(userId)).toBe(true);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    it("honors persistent dismissal but keeps first-run state specific to each user", async () => {
        localStorage.setItem(onboardingKey(userId), "done");
        const view = show();
        await act(async () => {});
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        view.unmount();
        auth.getSession.mockResolvedValue({ user: { id: `${userId}-different` } });
        show();
        expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });
    it("still remembers dismissal in this session when storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("disabled"); });
        dismissOnboarding(userId);
        expect(hasDismissedOnboarding(userId)).toBe(true);
    });
    it("does not interrupt an unauthenticated visit", async () => {
        auth.getSession.mockResolvedValue(null);
        await act(async () => { show(); });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    it("does not interrupt the shell when the session lookup fails", async () => {
        auth.getSession.mockRejectedValue(new Error("offline"));
        await act(async () => { show(); });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    it("does not query auth or open onboarding in the design preview", () => {
        show(false);
        expect(auth.getSession).not.toHaveBeenCalled();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
