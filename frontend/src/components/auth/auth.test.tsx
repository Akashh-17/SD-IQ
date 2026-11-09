import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "../../pages/Login";
import Signup from "../../pages/Signup";
import { authErrorMessage, validateAuth } from "./auth.validation";

const auth = vi.hoisted(() => ({ getCurrentUser: vi.fn(), signIn: vi.fn(), signUp: vi.fn() }));
vi.mock("../../services/auth.service", () => auth);

beforeAll(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
beforeEach(() => {
    Object.values(auth).forEach(mock => mock.mockReset());
    auth.getCurrentUser.mockResolvedValue(null);
    auth.signIn.mockResolvedValue({ session: { user: { id: "test-user" } } });
    auth.signUp.mockResolvedValue({ session: null });
    vi.stubEnv("VITE_DEMO_EMAIL", "");
    vi.stubEnv("VITE_DEMO_PASSWORD", "");
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

function show(path = "/login") {
    return render(<MemoryRouter initialEntries={[path]}><Routes>
        <Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<h1>Workspace</h1>} />
    </Routes></MemoryRouter>);
}
async function form(path = "/login") {
    show(path);
    return screen.findByRole("form", { name: path === "/signup" ? "Create account" : "Sign in" });
}
function fill(email = "person@example.test", password = "secure-password") {
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
}

describe("auth validation and safe errors", () => {
    it("validates email and signup length while preserving legacy login passwords", () => {
        expect(validateAuth("signup", "bad", "short")).toEqual({ email: "Enter a valid email address.", password: "Use at least 8 characters." });
        expect(validateAuth("login", " person@example.test ", "123456")).toEqual({ email: "", password: "" });
        expect(validateAuth("login", "", "")).toEqual({ email: "Enter your email address.", password: "Enter your password." });
    });
    it.each([
        [{ code: "invalid_credentials" }, /don’t match/],
        [{ code: "email_not_confirmed" }, /Confirm your email/],
        [{ status: 429 }, /Too many attempts/],
        [{ code: "over_email_send_rate_limit" }, /Too many attempts/],
        [{ code: "weak_password" }, /stronger password/],
        [{ code: "user_already_exists" }, /may already/],
        [new TypeError("private network details"), /connection/],
        [{ status: 503 }, /temporarily unavailable/]
    ])("maps provider failure %j to friendly text", (error, message) => {
        expect(authErrorMessage(error, "login")).toMatch(message);
    });
    it("never renders raw provider details, including demo errors", () => {
        const failure = { message: "private-provider-data" };
        expect(authErrorMessage(failure, "signup")).not.toContain(failure.message);
        expect(authErrorMessage(failure, "demo")).toMatch(/demo account is unavailable/);
    });
});

describe("login and signup", () => {
    it("shows inline errors, focuses the first invalid field, and clears errors as corrected", async () => {
        const target = await form();
        fireEvent.submit(target);
        expect(screen.getByLabelText("Email address")).toHaveFocus();
        expect(screen.getByLabelText("Email address")).toHaveAccessibleDescription("Enter your email address.");
        expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
        expect(auth.signIn).not.toHaveBeenCalled();
        fill();
        expect(screen.getByLabelText("Email address")).not.toHaveAttribute("aria-invalid", "true");
        expect(screen.queryByText("Enter your password.")).not.toBeInTheDocument();
    });
    it("validates on blur and requires eight characters only for signup", async () => {
        const target = await form("/signup");
        fill("bad", "short");
        fireEvent.blur(screen.getByLabelText("Email address"));
        fireEvent.blur(screen.getByLabelText("Password"));
        expect(screen.getByText("Use at least 8 characters.")).toBeInTheDocument();
        fireEvent.submit(target);
        expect(auth.signUp).not.toHaveBeenCalled();
        expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    });
    it("toggles password visibility without submitting and announces Caps Lock", async () => {
        await form();
        const password = screen.getByLabelText("Password");
        fireEvent.click(screen.getByRole("button", { name: "Show password" }));
        expect(password).toHaveAttribute("type", "text");
        expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
        fireEvent.keyDown(password, { key: "A", modifierCapsLock: true });
        expect(screen.getByText("Caps Lock is on.")).toBeInTheDocument();
        expect(password).toHaveAccessibleDescription("Caps Lock is on.");
        fireEvent.blur(password);
        expect(screen.queryByText("Caps Lock is on.")).not.toBeInTheDocument();
        expect(auth.signIn).not.toHaveBeenCalled();
    });
    it("submits a native form, trims email, preserves the password and redirects", async () => {
        const target = await form();
        fill(" person@example.test ", " password with spaces ");
        fireEvent.submit(target);
        expect(await screen.findByRole("heading", { name: "Workspace" })).toBeInTheDocument();
        expect(auth.signIn).toHaveBeenCalledExactlyOnceWith("person@example.test", " password with spaces ");
    });
    it("blocks duplicate submission and disables controls until the request settles", async () => {
        let reject!: (error: unknown) => void;
        auth.signIn.mockReturnValue(new Promise((_, fail) => { reject = fail; }));
        const target = await form();
        fill();
        fireEvent.submit(target);
        fireEvent.submit(target);
        expect(screen.getByRole("button", { name: /Signing in/ })).toBeDisabled();
        expect(screen.getByLabelText("Email address")).toBeDisabled();
        expect(screen.getByLabelText("Password")).toBeDisabled();
        expect(auth.signIn).toHaveBeenCalledTimes(1);
        await act(async () => reject({ code: "invalid_credentials" }));
        expect(screen.getByRole("alert")).toHaveTextContent("don’t match");
        expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
    });
    it.each(["/login", "/signup"])("redirects an existing user away from %s", async path => {
        auth.getCurrentUser.mockResolvedValue({ id: "existing-user" });
        show(path);
        expect(await screen.findByRole("heading", { name: "Workspace" })).toBeInTheDocument();
        expect(screen.queryByRole("form")).not.toBeInTheDocument();
    });
    it("recovers from a failed session lookup", async () => {
        auth.getCurrentUser.mockRejectedValue(new Error("network"));
        expect(await form()).toBeInTheDocument();
    });
    it("shows email confirmation when signup returns no session", async () => {
        const target = await form("/signup");
        fill();
        fireEvent.submit(target);
        expect(await screen.findByRole("heading", { name: "Check your inbox." })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Workspace" })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
        expect(await screen.findByRole("form", { name: "Sign in" })).toBeInTheDocument();
    });
    it("opens the workspace when signup returns an authenticated session", async () => {
        auth.signUp.mockResolvedValue({ session: { user: { id: "new-user" } } });
        const target = await form("/signup");
        fill();
        fireEvent.submit(target);
        expect(await screen.findByRole("heading", { name: "Workspace" })).toBeInTheDocument();
    });
    it.each([{}, { VITE_DEMO_EMAIL: "demo@example.test" }, { VITE_DEMO_PASSWORD: "demo-password" }])("hides the demo unless both settings exist: %j", async env => {
        Object.entries(env).forEach(([key, value]) => vi.stubEnv(key, value));
        await form();
        expect(screen.queryByRole("button", { name: "Try the demo" })).not.toBeInTheDocument();
    });
    it("signs in the configured demo without requiring form fields", async () => {
        vi.stubEnv("VITE_DEMO_EMAIL", "demo@example.test");
        vi.stubEnv("VITE_DEMO_PASSWORD", "demo-password");
        await form("/signup");
        fireEvent.click(screen.getByRole("button", { name: "Try the demo" }));
        expect(await screen.findByRole("heading", { name: "Workspace" })).toBeInTheDocument();
        expect(auth.signIn).toHaveBeenCalledExactlyOnceWith("demo@example.test", "demo-password");
        expect(auth.signUp).not.toHaveBeenCalled();
    });
});
