import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useState, type ReactNode } from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";

const loaded = vi.hoisted(() => ({ login: vi.fn(), interview: vi.fn(), auth: vi.fn() }));
vi.mock("../../pages/LandingPage.tsx", () => ({ default: () => <h1>Public landing</h1> }));
vi.mock("../../pages/Login", () => { loaded.login(); return { default: () => <h1>Sign in</h1> }; });
vi.mock("../../pages/Interview", () => { loaded.interview(); return { default: () => <h1>Interview editor</h1> }; });
vi.mock("../ProtectedRoute.tsx", () => {
    loaded.auth();
    return { default: function Guard({ children }: { children: ReactNode }) {
        const [authenticated, setAuthenticated] = useState(false);
        return authenticated ? children : <button onClick={() => setAuthenticated(true)}>Finish auth check</button>;
    } };
});
import AppRoutes from "../../routes/AppRoutes";

afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("keeps auth and the editor out of the public landing load, then resolves each route on navigation", async () => {
    function Navigation() {
        const navigate = useNavigate();
        return <><button onClick={() => navigate("/login")}>Open sign in</button><button onClick={() => navigate("/interview/example")}>Open interview</button><AppRoutes /></>;
    }
    render(<MemoryRouter><Navigation /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Public landing" })).toBeInTheDocument();
    expect(loaded.login).not.toHaveBeenCalled();
    expect(loaded.interview).not.toHaveBeenCalled();
    expect(loaded.auth).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open sign in" }));
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(loaded.login).toHaveBeenCalledTimes(1);
    expect(loaded.interview).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open interview" }));
    const authCheck = await screen.findByRole("button", { name: "Finish auth check" });
    expect(loaded.interview).toHaveBeenCalledTimes(1);
    expect(loaded.auth).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("heading", { name: "Interview editor" })).not.toBeInTheDocument();
    fireEvent.click(authCheck);
    expect(await screen.findByRole("heading", { name: "Interview editor" })).toBeInTheDocument();
    expect(loaded.interview).toHaveBeenCalledTimes(1);
    expect(loaded.auth).toHaveBeenCalledTimes(1);
});
