import { memo, useEffect, useRef } from "react";
import { useReducedMotion } from "../../motion/useReducedMotion";

function Waveform({ stream }: { stream: MediaStream | null }) {
    const bars = useRef<(HTMLSpanElement | null)[]>([]);
    const reduced = useReducedMotion();
    useEffect(() => {
        if (!stream || reduced || typeof AudioContext === "undefined") return;
        let context: AudioContext;
        try { context = new AudioContext(); } catch { return; }
        let source: MediaStreamAudioSourceNode;
        let analyser: AnalyserNode;
        try { source = context.createMediaStreamSource(stream); analyser = context.createAnalyser(); }
        catch { void context.close().catch(() => {}); return; }
        analyser.fftSize = 64; source.connect(analyser);
        const values = new Uint8Array(analyser.fftSize);
        let frame = 0;
        const draw = () => {
            analyser.getByteTimeDomainData(values);
            bars.current.forEach((bar, index) => { if (bar) bar.style.transform = `scaleY(${Math.min(1, Math.max(0.08, Math.abs(values[index * 2] - 128) / 45))})`; });
            frame = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(frame); source.disconnect(); analyser.disconnect(); void context.close().catch(() => {}); };
    }, [stream, reduced]);
    return <span aria-hidden="true" className="inline-flex h-6 items-center gap-[3px]">{Array.from({ length: 24 }, (_, index) => <span key={index} ref={element => { bars.current[index] = element; }} className="h-6 w-0.5 origin-center rounded-full bg-danger" style={{ transform: "scaleY(.12)" }} />)}</span>;
}
export default memo(Waveform);
