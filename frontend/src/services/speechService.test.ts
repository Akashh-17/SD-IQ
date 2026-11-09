import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("records microphone input without a browser speech-output API", async () => {
    vi.stubGlobal("speechSynthesis", undefined);
    vi.stubGlobal("SpeechSynthesisUtterance", undefined);
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.spyOn(console, "log").mockImplementation(() => {});
    class Recorder {
        static isTypeSupported() { return true; }
        mimeType = "audio/webm;codecs=opus";
        state = "inactive";
        ondataavailable: ((event: { data: Blob }) => void) | null = null;
        onstop: (() => void) | null = null;
        start() { this.state = "recording"; }
        stop() {
            this.state = "inactive";
            this.ondataavailable?.({ data: new Blob([new Uint8Array(1500)], { type: this.mimeType }) });
            this.onstop?.();
        }
    }
    vi.stubGlobal("MediaRecorder", Recorder);
    const { default: service } = await import("./speechService");
    const onRecording = vi.fn();
    service.init(onRecording);
    await service.start();
    expect(service.isListening).toBe(true);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    await service.stop();
    expect(service.isListening).toBe(false);
    expect(onRecording).toHaveBeenCalledExactlyOnceWith(expect.any(Blob));
    expect(onRecording.mock.calls[0][0].size).toBe(1500);
    expect(stopTrack).toHaveBeenCalledTimes(1);
});
