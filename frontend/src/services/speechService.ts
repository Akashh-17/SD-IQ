class SpeechService {
  isListening = false;
  synthesis = window.speechSynthesis;

  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private currentStream: MediaStream | null = null;

  private onRecordingCb:
    ((blob: Blob) => void) | null = null;

  private onStatusCb:
    ((msg: string) => void) | null = null;

  // Record until user presses Stop
  private recording = false;

  init(
onRecording: (blob: Blob) => void, onStatus?: (msg: string) => void ) {
    this.onRecordingCb = onRecording;
    this.onStatusCb = onStatus ?? null;
  }

  // ── Start recording ──────────────────────────────────────────────────────
  async start() {
    if (this.recording) return;

    let stream: MediaStream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      console.error("[SpeechService] Mic denied:", err);
      this.onStatusCb?.("mic_denied");
      return;
    }

    this.recording = true;
    this.isListening = true;
    this.currentStream = stream;
    this.chunks = [];

    const mimeType = MediaRecorder.isTypeSupported(
      "audio/webm;codecs=opus"
    )
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.onerror = (e) => {
      console.error("[Recorder Error]", e);
    };

    this.mediaRecorder.start();

    console.log("[Speech] Recording...");
  }

  // ── Stop recording ───────────────────────────────────────────────────────
  async stop() {
    if (!this.recording) return;

    this.recording = false;
    this.isListening = false;

    if (!this.mediaRecorder) return;

    const recorder = this.mediaRecorder;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();

      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        resolve();
      }
    });

    if (this.currentStream) {
      this.currentStream.getTracks().forEach((t) => t.stop());
      this.currentStream = null;
    }

    const mimeType = recorder.mimeType;

    const blob = new Blob(this.chunks, {
      type: mimeType,
    });

    this.chunks = [];

    if (blob.size < 1000) {
      console.warn("[Speech] Empty recording");
      return;
    }

    console.log("[SpeechService] Blob created:", blob.size);
    this.onRecordingCb?.(blob);
    console.log("[SpeechService] Callback fired");
  }

  // ── TTS (unchanged) ──────────────────────────────────────────────────────
  speak(text: string) {
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/✅|❌|⚠️|🔴|🎤/g, "")
      .trim();

    this.synthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 0.93;
    utter.pitch = 1;
    utter.volume = 1;
    this.synthesis.speak(utter);
  }

  stopSpeaking() {
    this.synthesis.cancel();
  }
}

export default new SpeechService();