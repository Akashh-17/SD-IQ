import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AuthForm from "./AuthForm";

const auth = vi.hoisted(() => ({ getCurrentUser: vi.fn(), signIn: vi.fn(), signUp: vi.fn() }));
vi.mock("../../services/auth.service", () => auth);
vi.mock("../../lib/supabase", () => ({ authConfigurationError: "Account access hasn’t been configured yet. Please try again once setup is complete." }));
vi.mock("./AuthLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("../../motion", () => ({ Reveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllEnvs(); });

it.each(["login", "signup"] as const)("keeps %s visible with a setup message and blocks all authentication attempts", mode => {
    vi.stubEnv("VITE_DEMO_EMAIL", "demo@example.test");
    vi.stubEnv("VITE_DEMO_PASSWORD", "demo-password");
    render(<MemoryRouter><AuthForm mode={mode} /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(mode === "login" ? "Welcome back." : "Create your account.");
    expect(screen.getByRole("alert")).toHaveTextContent("Account access hasn’t been configured yet");
    expect(screen.getByLabelText("Email address")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByRole("button", { name: mode === "login" ? "Sign in" : "Create account" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Try the demo" })).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole("form"));
    expect(auth.getCurrentUser).not.toHaveBeenCalled();
    expect(auth.signIn).not.toHaveBeenCalled();
    expect(auth.signUp).not.toHaveBeenCalled();
});
