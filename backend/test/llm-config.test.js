import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { clients } = vi.hoisted(() => ({ clients: [] }));

vi.mock("@langchain/openai", () => ({
    ChatOpenAI: class {
        constructor(options) { clients.push(options); }
    }
}));

beforeEach(() => {
    vi.resetModules();
    clients.length = 0;
    vi.stubEnv("MOCK_MODE", "false");
    vi.stubEnv("OPENROUTER_API_KEY", "test-key-not-used-for-network");
    for (const key of ["OPENROUTER_MODEL", "OPENROUTER_FAST_MODEL", "PROBLEM_GENERATOR_MODEL"]) vi.stubEnv(key, "");
});

afterEach(() => vi.unstubAllEnvs());

it("defaults every live client to the free endpoint with reasoning disabled", async () => {
    await import("../src/agents/problemGenerator/agent.js");
    expect(clients).toHaveLength(3);
    expect(clients.map(client => client.maxTokens)).toEqual([4096, 512, 16384]);
    for (const client of clients) {
        expect(client.model).toBe("nvidia/nemotron-3.5-super-vl:free");
        expect(client.modelKwargs).toEqual({ reasoning: { enabled: false } });
    }
});

it("preserves explicit main, fast and generator overrides without NVIDIA-specific parameters", async () => {
    vi.stubEnv("OPENROUTER_MODEL", "test/main");
    vi.stubEnv("OPENROUTER_FAST_MODEL", "test/fast");
    vi.stubEnv("PROBLEM_GENERATOR_MODEL", "test/generator");
    await import("../src/agents/problemGenerator/agent.js");
    expect(clients.map(client => client.model)).toEqual(["test/main", "test/fast", "test/generator"]);
    expect(clients.every(client => client.modelKwargs === undefined)).toBe(true);
});

it("inherits the main override for fast classification and generation", async () => {
    vi.stubEnv("OPENROUTER_MODEL", "test/shared");
    await import("../src/agents/problemGenerator/agent.js");
    expect(clients.map(client => client.model)).toEqual(["test/shared", "test/shared", "test/shared"]);
});

it("keeps offline mode independent of OpenRouter credentials", async () => {
    vi.stubEnv("MOCK_MODE", "true");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    await import("../src/agents/problemGenerator/agent.js");
    expect(clients).toHaveLength(0);
});
