import { afterEach, beforeEach, it, expect, vi } from "vitest";
import axios from "axios";
import { streamInterviewMessage } from "./chat.service";
vi.mock("axios", () => ({ default: { post: vi.fn(), isAxiosError: (error: unknown) => Boolean(error && typeof error === "object" && "isAxiosError" in error) } }));
vi.mock("../lib/supabase", () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "mock-token-demo-user" } } }) } } }));
const encoder = new TextEncoder();
const frame = (event: string, data: object) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
const options = () => ({ onToken: vi.fn(), onStatus: vi.fn() });
function response(chunks: Uint8Array[]) {
    return new Response(new ReadableStream({ start(controller) { chunks.forEach(chunk => controller.enqueue(chunk)); controller.close(); } }), { headers: { "content-type": "text/event-stream" } });
}
beforeEach(() => vi.mocked(axios.post).mockResolvedValue({ data: { reply: "Fallback", completed: false } }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it("parses fragmented UTF-8, CRLF, heartbeat and multiple events per chunk", async () => {
    const reply = "Hello \u4e16\u754c";
    const wire = (": heartbeat\n\n" + frame("status", { phase: "evaluating" }) + frame("token", { text: reply }) + frame("done", { reply, completed: true })).replaceAll("\n", "\r\n");
    const bytes = encoder.encode(wire);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(Array.from(bytes, byte => new Uint8Array([byte])))));
    const hooks = options(); expect(await streamInterviewMessage("id", "answer", hooks)).toEqual({ reply, completed: true });
    expect(hooks.onStatus).toHaveBeenCalledWith("evaluating"); expect(hooks.onToken).toHaveBeenCalledWith(reply); expect(axios.post).not.toHaveBeenCalled();
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe("POST"); expect(init?.headers).toMatchObject({ Authorization: "Bearer mock-token-demo-user", "X-Interview-Turn-Id": expect.any(String) });
});
it.each(["network", "missing endpoint", "premature end", "SSE error", "invalid JSON"])("falls back safely on %s", async failure => {
    const fetchMock = vi.fn();
    if (failure === "network") fetchMock.mockRejectedValue(new TypeError("offline"));
    if (failure === "missing endpoint") fetchMock.mockResolvedValue(new Response("", { status: 404 }));
    if (failure === "premature end") fetchMock.mockResolvedValue(response([encoder.encode(frame("token", { text: "Partial" }))]));
    if (failure === "SSE error") fetchMock.mockResolvedValue(response([encoder.encode(frame("error", { message: "failed" }))]));
    if (failure === "invalid JSON") fetchMock.mockResolvedValue(response([encoder.encode("event: token\ndata: invalid\n\n" )]));
    vi.stubGlobal("fetch", fetchMock);
    expect(await streamInterviewMessage("id", "answer", options())).toEqual({ reply: "Fallback", completed: false });
    const id = fetchMock.mock.calls[0][1].headers["X-Interview-Turn-Id"];
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("/interview/message"), { interviewId: "id", message: "answer" }, expect.objectContaining({ headers: expect.objectContaining({ "X-Interview-Turn-Id": id }) }));
});
it.each([400, 401, 403, 409, 429])("does not retry HTTP %s", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status })));
    await expect(streamInterviewMessage("id", "answer", options())).rejects.toMatchObject({ response: { status } }); expect(axios.post).not.toHaveBeenCalled();
});
it("does not fall back when the user leaves", async () => {
    const controller = new AbortController(); controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")));
    await expect(streamInterviewMessage("id", "answer", { ...options(), signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" }); expect(axios.post).not.toHaveBeenCalled();
});
