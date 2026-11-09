import { createClient, type Session, type User } from "@supabase/supabase-js";

const mockAuth = import.meta.env.VITE_MOCK_AUTH === "true";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

function hasValidConfiguration() {
    if (!supabaseUrl || !supabaseKey) return false;
    try { return ["http:", "https:"].includes(new URL(supabaseUrl).protocol); }
    catch { return false; }
}

export const authConfigurationError = !mockAuth && !hasValidConfiguration()
    ? "Account access hasn’t been configured yet. Please try again once setup is complete."
    : null;

const unavailableError = () => Object.assign(new Error(authConfigurationError ?? "Account access is unavailable."), { code: "auth_not_configured" });

// Missing configuration must not crash a lazily loaded route or grant a session.
const unavailable = {
    auth: {
        getUser: async () => ({ data: { user: null }, error: unavailableError() }),
        getSession: async () => ({ data: { session: null }, error: unavailableError() }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: unavailableError() }),
        signUp: async () => ({ data: { user: null, session: null }, error: unavailableError() }),
        signOut: async () => ({ error: unavailableError() })
    }
};
const user = { id: "demo-user", email: "demo@example.test", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" } satisfies User;
const session: Session = { access_token: "mock-token-demo-user", refresh_token: "mock-refresh-token", token_type: "bearer", expires_in: 3600, user };
let signedIn = true;

const offline = {
    auth: {
        getUser: async () => ({ data: { user: signedIn ? user : null }, error: null }),
        getSession: async () => ({ data: { session: signedIn ? session : null }, error: null }),
        signInWithPassword: async (_credentials: { email: string; password: string }) => { void _credentials; signedIn = true; return { data: { user, session }, error: null }; },
        signUp: async (_credentials: { email: string; password: string }) => { void _credentials; signedIn = true; return { data: { user, session }, error: null }; },
        signOut: async () => { signedIn = false; return { error: null }; }
    }
};

// Vite replaces the flag at build time: production uses real auth unless
// VITE_MOCK_AUTH=true was explicitly supplied for that build.
export const supabase = mockAuth ? offline : authConfigurationError ? unavailable : createClient(
    supabaseUrl,
    supabaseKey
);
