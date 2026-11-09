import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio } from "../../services/voiceService";

export function useMicrophone(onText: (text: string) => void, onError: (message: string) => void) {
    const [recording, setRecording] = useState(false);
    const [opening, setOpening] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const recorder = useRef<MediaRecorder | null>(null);
    const media = useRef<MediaStream | null>(null);
    const alive = useRef(true);
    const starting = useRef(false);
    const release = useCallback(() => { media.current?.getTracks().forEach(track => track.stop()); media.current = null; }, []);
    useEffect(() => {
        alive.current = true;
        return () => { alive.current = false; if (recorder.current?.state === "recording") recorder.current.stop(); release(); };
    }, [release]);
    const stop = useCallback(() => { if (recorder.current?.state === "recording") recorder.current.stop(); }, []);
    const start = useCallback(async () => {
        if (starting.current || recorder.current?.state === "recording" || transcribing) return;
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { onError("Voice input isn’t supported here. You can still type your answer."); return; }
        starting.current = true; setOpening(true);
        try {
            const input = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
            if (!alive.current) { input.getTracks().forEach(track => track.stop()); return; }
            media.current = input;
            const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(type => MediaRecorder.isTypeSupported(type));
            const capture = new MediaRecorder(input, mimeType ? { mimeType } : undefined);
            recorder.current = capture;
            const chunks: Blob[] = [];
            let failed = false;
            capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
            capture.onerror = () => { failed = true; if (alive.current) { setRecording(false); setStream(null); onError("The microphone recording was interrupted. Please try again."); } stop(); release(); };
            capture.onstop = async () => {
                release();
                if (!alive.current) return;
                setRecording(false); setStream(null);
                const blob = new Blob(chunks, { type: capture.mimeType || "audio/webm" });
                if (failed) return;
                if (blob.size < 1000) { onError("That recording was too short. Try recording your answer again."); return; }
                setTranscribing(true);
                try { const text = await transcribeAudio(blob); if (alive.current) onText(text); }
                catch { if (alive.current) onError("Your recording couldn’t be transcribed. Please try again or type your answer."); }
                finally { if (alive.current) setTranscribing(false); }
            };
            capture.start(); setRecording(true); setStream(input);
        } catch {
            release(); if (alive.current) onError("Microphone access was unavailable. Check your browser permission or type your answer.");
        } finally { starting.current = false; if (alive.current) setOpening(false); }
    }, [transcribing, onText, onError, release, stop]);
    return { recording, opening, transcribing, stream, start, stop };
}
