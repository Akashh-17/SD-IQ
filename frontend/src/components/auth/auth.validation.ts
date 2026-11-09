export type AuthMode = "login" | "signup";

export function validateAuth(mode: AuthMode, email: string, password: string) {
    return {
        email: !email.trim() ? "Enter your email address." : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "Enter a valid email address." : "",
        password: !password ? "Enter your password." : mode === "signup" && password.length < 8 ? "Use at least 8 characters." : ""
    };
}

export function authErrorMessage(error: unknown, mode: AuthMode | "demo") {
    const details = error && typeof error === "object" ? error as { code?: unknown; status?: unknown; message?: unknown; name?: unknown } : {};
    const code = typeof details.code === "string" ? details.code : "";
    const message = typeof details.message === "string" ? details.message.toLowerCase() : "";
    if (details.status === 429 || ["over_request_rate_limit", "over_email_send_rate_limit", "over_sms_send_rate_limit"].includes(code)) {
        return "Too many attempts. Please wait a little before trying again.";
    }
    if (mode === "demo") return "The demo account is unavailable right now. Please try again later.";
    if (code === "invalid_credentials" || message.includes("invalid login credentials")) return "That email and password don’t match. Check them and try again.";
    if (code === "email_not_confirmed" || message.includes("email not confirmed")) return "Confirm your email before signing in. Check your inbox for the confirmation link.";
    if (["user_already_exists", "email_exists"].includes(code) || message.includes("user already registered")) return "An account may already use that email. Try signing in or check your inbox.";
    if (code === "weak_password") return "Choose a stronger password with a mix of letters, numbers and symbols.";
    if (code === "email_address_invalid") return "Check your email address and try again.";
    if (code === "signup_disabled") return "New accounts are unavailable right now. Please try again later.";
    if (error instanceof TypeError || details.name === "AuthRetryableFetchError" || details.status === 0) return "We couldn’t connect. Check your connection and try again.";
    if (typeof details.status === "number" && details.status >= 500) return "Sign-in is temporarily unavailable. Please try again shortly.";
    // Never render SDK messages, which can contain provider or request details.
    return mode === "signup" ? "We couldn’t create your account. Please try again." : "We couldn’t sign you in. Please try again.";
}
