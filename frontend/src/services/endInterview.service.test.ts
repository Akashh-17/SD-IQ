import { afterEach, it, expect, vi } from "vitest";
import axios from "axios";
import { endInterview, getReportStatus } from "./endInterview.service";
vi.mock("axios", () => ({ default: { post: vi.fn(), get: vi.fn() } }));
vi.mock("../lib/supabase", () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "mock-token-demo-user" } } }) } } }));
afterEach(() => vi.clearAllMocks());
it("uses authenticated end and status requests with cancellation", async () => {
    const signal = new AbortController().signal;
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { status: "generating" } });
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { status: "ready" } });
    expect(await endInterview("id", signal)).toEqual({ status: "generating" });
    expect(await getReportStatus("id", signal)).toEqual({ status: "ready" });
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("/interview/end"), { interviewId: "id" }, expect.objectContaining({ signal, headers: { Authorization: "Bearer mock-token-demo-user" } }));
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/report/id/status"), expect.objectContaining({ signal }));
});
it("rejects unknown status responses", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { status: "unknown" } });
    await expect(getReportStatus("id")).rejects.toThrow("Invalid report status");
});
