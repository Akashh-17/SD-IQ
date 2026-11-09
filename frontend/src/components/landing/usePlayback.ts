import { useEffect, useState } from "react";
import { useReducedMotion } from "../../motion/useReducedMotion";

export function usePlayback(length: number, interval = 4000) {
    const reduced = useReducedMotion();
    const [target, attach] = useState<HTMLDivElement | null>(null);
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [visible, setVisible] = useState(false);
    const [foreground, setForeground] = useState(() => typeof document === "undefined" || !document.hidden);
    const running = playing && visible && foreground && !reduced;

    useEffect(() => {
        if (!target) return;
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
        observer.observe(target);
        return () => observer.disconnect();
    }, [target]);
    useEffect(() => {
        const change = () => setForeground(!document.hidden);
        document.addEventListener("visibilitychange", change);
        return () => document.removeEventListener("visibilitychange", change);
    }, []);
    useEffect(() => {
        if (!running) return;
        const timer = window.setInterval(() => setIndex(current => (current + 1) % length), interval);
        return () => window.clearInterval(timer);
    }, [interval, length, running]);

    function select(next: number) { setIndex(Math.max(0, Math.min(length - 1, next))); setPlaying(false); }
    function next() { setIndex(current => (current + 1) % length); setPlaying(false); }
    function replay() { setIndex(0); setPlaying(!reduced); }
    return { attach, index, playing: playing && !reduced, running, reduced, setPlaying, select, next, replay };
}
