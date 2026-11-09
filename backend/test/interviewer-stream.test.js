import { it, expect, vi, afterEach } from "vitest";
import { generateInterviewerResponse } from "../src/agents/interviewer/agent.js";
import { llm } from "../src/services/llm.js";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); delete llm.stream; });
it("uses the provider streaming API with cancellation config and only text content", async () => {
    vi.stubEnv("MOCK_MODE", "false");
    const events = [];
    llm.stream = vi.fn(async function* () {
        yield { content: "Hello " };
        yield { content: [{ type: "text", text: "world" }, { type: "reasoning", text: "private reasoning" }] };
    });
    const signal = new AbortController().signal;
    const config = { configurable: { streamInterview: true }, signal, writer: event => events.push(event) };
    expect(await generateInterviewerResponse({ decision: {} }, config)).toBe("Hello world");
    expect(events).toEqual([{ type: "interviewer-token", text: "Hello " }, { type: "interviewer-token", text: "world" }]);
    expect(llm.stream).toHaveBeenCalledWith(expect.any(Array), config);
});
it("stops forwarding provider chunks after abort", async () => {
    vi.stubEnv("MOCK_MODE", "false"); const abort = new AbortController();
    llm.stream = vi.fn(async function* () { yield { content: "Hello" }; yield { content: "never sent" }; });
    const writer = vi.fn(() => abort.abort());
    await expect(generateInterviewerResponse({}, { configurable: { streamInterview: true }, signal: abort.signal, writer })).rejects.toMatchObject({ name: "AbortError" });
    expect(writer).toHaveBeenCalledTimes(1);
});
it("keeps the non-streaming response API unchanged", async () => {
    vi.spyOn(llm, "invoke").mockResolvedValueOnce({ content: "  Normal reply  " });
    expect(await generateInterviewerResponse({})).toBe("Normal reply");
});
