import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useMicrophone } from "./useMicrophone";
import { transcribeAudio } from "../../services/voiceService";
vi.mock("../../services/voiceService", () => ({ transcribeAudio: vi.fn() }));
class Recorder {
    static latest: Recorder;
    static isTypeSupported() { return true; }
    state = "inactive";
    mimeType = "audio/webm";
    ondataavailable?: (event: { data: Blob }) => void;
    onstop?: () => void;
    onerror?: () => void;
    constructor() { Recorder.latest = this; }
    start() { this.state = "recording"; }
    stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob(["x".repeat(1200)]) }); this.onstop?.(); }
}
const stopTrack = vi.fn();
const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
const permission = vi.fn();
beforeEach(() => {
    vi.stubGlobal("MediaRecorder", Recorder);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: permission } });
    permission.mockResolvedValue(stream); vi.mocked(transcribeAudio).mockResolvedValue("Use an API gateway.");
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });
it("exposes the real recording stream, releases it, and transcribes once without sending", async () => {
    const text = vi.fn(), error = vi.fn();
    let resolve!: (text: string) => void;
    vi.mocked(transcribeAudio).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const { result } = renderHook(() => useMicrophone(text, error));
    await act(async () => { await result.current.start(); });
    expect(result.current.recording).toBe(true); expect(result.current.stream).toBe(stream);
    act(() => result.current.stop());
    expect(result.current.transcribing).toBe(true); expect(result.current.recording).toBe(false);
    expect(stopTrack).toHaveBeenCalledTimes(1); expect(transcribeAudio).toHaveBeenCalledTimes(1);
    await act(async () => { resolve("Use a cache."); });
    expect(text).toHaveBeenCalledExactlyOnceWith("Use a cache.");
    expect(result.current.transcribing).toBe(false); expect(error).not.toHaveBeenCalled();
});
it("handles denied permission and recorder errors without leaving recording active", async () => {
    permission.mockRejectedValueOnce(new Error("denied"));
    const error = vi.fn(); const { result } = renderHook(() => useMicrophone(vi.fn(), error));
    await act(async () => { await result.current.start(); });
    expect(error).toHaveBeenLastCalledWith(expect.stringContaining("permission"));
    expect(result.current.opening).toBe(false);
    await act(async () => { await result.current.start(); });
    act(() => { Recorder.latest.state = "inactive"; Recorder.latest.onerror?.(); });
    expect(result.current.recording).toBe(false); expect(result.current.stream).toBeNull();
    expect(stopTrack).toHaveBeenCalled(); expect(transcribeAudio).not.toHaveBeenCalled();
});
it("stops tracks on unmount and ignores a late permission response", async () => {
    let allow!: (stream: MediaStream) => void;
    permission.mockImplementationOnce(() => new Promise(resolve => { allow = resolve; }));
    const text = vi.fn(); const { result, unmount } = renderHook(() => useMicrophone(text, vi.fn()));
    let starting!: Promise<void>;
    act(() => { starting = result.current.start(); }); unmount();
    await act(async () => { allow(stream); await starting; });
    expect(stopTrack).toHaveBeenCalledTimes(1); expect(text).not.toHaveBeenCalled();
    expect(transcribeAudio).not.toHaveBeenCalled();
});
