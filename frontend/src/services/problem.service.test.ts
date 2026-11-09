import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as service from "./problem.service";
import { getSession } from "./auth.service";
vi.mock("./auth.service", () => ({ getSession: vi.fn() }));
const fetchMock = vi.fn();
beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue({ access_token: "test-token" } as Awaited<ReturnType<typeof getSession>>);
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());
const response = (data: unknown, status = 200, headers: Record<string, string> = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => data, headers: new Headers(headers) });

it("includes authentication when loading the owner's custom problem list", async () => {
    fetchMock.mockResolvedValue(response([]));
    await service.getProblems();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer test-token");
});
it("does not silently treat failed list/detail responses as valid problems", async () => {
    fetchMock.mockResolvedValue(response({ message: "private database detail" }, 500));
    await expect(service.getProblems()).rejects.toThrow();
    await expect(service.getProblem("custom_example")).rejects.toThrow();
});
it("posts a topic with authentication and an abort signal", async () => {
    expect(typeof service.createCustomProblem).toBe("function");
    fetchMock.mockResolvedValue(response({ problem: { id: "test" }, matched: false }, 201));
    const controller = new AbortController();
    const result = await service.createCustomProblem("Design LeetCode", controller.signal);
    expect(result.matched).toBe(false);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/problems\/custom$/);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ topic: "Design LeetCode" });
    expect(options.headers.Authorization).toBe("Bearer test-token");
    expect(options.signal).toBe(controller.signal);
});
it("refuses unauthenticated custom generation before making a request", async () => {
    expect(typeof service.createCustomProblem).toBe("function");
    vi.mocked(getSession).mockResolvedValue(null);
    await expect(service.createCustomProblem("Design LeetCode")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
});
it.each([
    [429, {}, /five.*hour/i],
    [422, { code: "LOW_LEVEL_DESIGN", suggestion: "Design a parking management system" }, /high-level system design/i],
    [422, { code: "NOT_A_DESIGN_PROBLEM" }, /software system/i],
    [502, { code: "INVALID_KNOWLEDGE_PACK" }, /consistent brief/i],
    [503, { code: "CUSTOM_STORAGE_UNAVAILABLE" }, /saved/i]
])("maps status %s to safe, actionable text", async (status, data, message) => {
    expect(typeof service.createCustomProblem).toBe("function");
    fetchMock.mockResolvedValue(response({ ...data, message: "private provider detail" }, status, { "Retry-After": "3600" }));
    const result = await service.createCustomProblem("Design a service").catch(error => error);
    expect(result.message).toMatch(message);
    expect(result.message).not.toContain("private provider detail");
    if (status === 422 && "suggestion" in data) expect(result.suggestion).toBe(data.suggestion);
    if (status === 429) expect(result.retryAfter).toBe(3600);
});
it("rejects malformed successful responses", async () => {
    expect(typeof service.createCustomProblem).toBe("function");
    fetchMock.mockResolvedValue(response({ message: "unexpected" }));
    await expect(service.createCustomProblem("Design LeetCode")).rejects.toThrow();
});
