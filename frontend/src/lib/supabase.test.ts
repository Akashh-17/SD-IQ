import { afterEach, it, expect, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it("explicit mock auth auto-signs in and uses the backend demo token", async () => {
    vi.stubEnv("VITE_MOCK_AUTH", "true");
    const { supabase, authConfigurationError } = await import("./supabase");
    expect(authConfigurationError).toBeNull();
    expect((await supabase.auth.getSession()).data.session?.access_token).toBe("mock-token-demo-user");
    expect((await supabase.auth.getUser()).data.user?.id).toBe("demo-user");
    await supabase.auth.signOut(); expect((await supabase.auth.getSession()).data.session).toBeNull();
    await supabase.auth.signInWithPassword({ email: "demo@example.test", password: "demo" });
    expect((await supabase.auth.getUser()).data.user?.id).toBe("demo-user");
});
it("a regular production build does not silently enable mock auth", async () => {
    vi.stubEnv("VITE_MOCK_AUTH", "false"); vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SUPABASE_URL", "http://127.0.0.1:54321"); vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");
    const { supabase } = await import("./supabase");
    expect((await supabase.auth.getSession()).data.session).toBeNull();
});

it.each([
    ["", "public-key"],
    ["https://example.supabase.co", ""],
    ["  ", "  "],
    ["not-a-url", "public-key"],
    ["ftp://example.test", "public-key"]
])("missing or invalid real configuration renders safely without granting access (%s)", async (url, key) => {
    vi.stubEnv("VITE_MOCK_AUTH", "false"); vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SUPABASE_URL", url); vi.stubEnv("VITE_SUPABASE_ANON_KEY", key);
    const { supabase, authConfigurationError } = await import("./supabase");
    expect(authConfigurationError).toContain("hasn’t been configured");
    expect((await supabase.auth.getUser()).data.user).toBeNull();
    expect((await supabase.auth.getSession()).data.session).toBeNull();
    expect((await supabase.auth.signInWithPassword({ email: "user@example.test", password: "password" })).error).toMatchObject({ code: "auth_not_configured" });
    expect((await supabase.auth.signUp({ email: "user@example.test", password: "password" })).data.session).toBeNull();
});
