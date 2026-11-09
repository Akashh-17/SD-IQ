import { act, cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getCurrentUser } from "../../services/auth.service";
import ProtectedRoute from "../ProtectedRoute";
import ProfileMenu from "./ProfileMenu";
import RouteLoader from "./RouteLoader";
vi.mock("../../services/auth.service", () => ({ getCurrentUser: vi.fn(), signOut: vi.fn() }));
const user = { id: "u", email: "ada@example.test", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-11-09T00:00:00Z" };
beforeEach(() => { vi.mocked(getCurrentUser).mockResolvedValue(user); });
afterEach(() => { cleanup(); vi.resetAllMocks(); });
it("announces the themed loader inside one main landmark", () => {
    render(<RouteLoader />);
    expect(screen.getByRole("main", { name: "Loading page" })).toHaveClass("bg-bg", "text-text");
    expect(screen.getByRole("status")).toHaveTextContent("Loading page");
});
it("waits for auth before mounting a downloaded protected page", async () => {
    let resolve!: (value: typeof user) => void;
    vi.mocked(getCurrentUser).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const mounted = vi.fn();
    function PrivatePage() { mounted(); return <h1>Private page</h1>; }
    render(<MemoryRouter><ProtectedRoute><PrivatePage /></ProtectedRoute></MemoryRouter>);
    expect(screen.getByRole("status")).toBeInTheDocument(); expect(mounted).not.toHaveBeenCalled();
    await act(async () => resolve(user));
    expect(await screen.findByRole("heading", { name: "Private page" })).toBeInTheDocument();
    expect(mounted).toHaveBeenCalledTimes(1);
});
it("redirects an unauthenticated visitor without mounting the protected page", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    const mounted = vi.fn();
    function PrivatePage() { mounted(); return <h1>Private page</h1>; }
    render(<MemoryRouter initialEntries={["/dashboard"]}><Routes><Route path="/dashboard" element={<ProtectedRoute><PrivatePage /></ProtectedRoute>} /><Route path="/" element={<h1>Public page</h1>} /></Routes></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Public page" })).toBeInTheDocument();
    expect(mounted).not.toHaveBeenCalled();
});
it("includes the visible account name/email in the accessible name and retains the collapsed label", async () => {
    const view = render(<MemoryRouter><ProfileMenu /></MemoryRouter>);
    const trigger = await screen.findByRole("button", { name: /ada@example.test/ });
    expect(trigger).toHaveAccessibleName(/ada\s*ada@example.test/);
    view.rerender(<MemoryRouter><ProfileMenu collapsed /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Account menu for ada" })).toHaveAttribute("aria-haspopup", "menu");
});
