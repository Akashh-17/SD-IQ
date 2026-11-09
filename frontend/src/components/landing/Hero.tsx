import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CodeChip } from "../ui";
import { StreamText } from "../../motion";
import { useReducedMotion } from "../../motion/useReducedMotion";
import ArchitectureScene from "./ArchitectureScene";
import Glyph from "./Glyph";

export default function Hero() {
    const navigate = useNavigate();
    const reduced = useReducedMotion();
    const [intro, setIntro] = useState({ phase: 0, finished: false });
    const [paused, setPaused] = useState(false);
    const finished = intro.finished || reduced;
    const flowing = !reduced && !paused;
    useEffect(() => {
        if (reduced || intro.finished) return;
        const timings = [[450, 1], [950, 2], [1550, 3], [2100, 4]];
        const timers = timings.map(([delay, phase]) => window.setTimeout(() => setIntro(current => ({ ...current, phase })), delay));
        timers.push(window.setTimeout(() => setIntro({ phase: 4, finished: true }), 3000));
        return () => timers.forEach(window.clearTimeout);
    }, [intro.finished, reduced]);
    return <section id="hero" aria-labelledby="hero-heading" className="landing-container landing-hero">
        <div className="landing-hero-copy">
            <p className="section-kicker mb-7 flex items-center gap-2.5"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />A better way to practice system design</p>
            <h1 id="hero-heading" className="landing-hero-heading"><span>System design.</span><span>Meet your</span><span className="text-accent">AI interviewer.</span></h1>
            <p className="landing-hero-subline">Talk through the hard parts. Draw the bigger picture. Get feedback that makes your next interview better than your last.</p>
            <div className="mt-8 flex flex-col items-start gap-3">
                <Button size="lg" className="landing-main-cta" onClick={() => navigate("/login")}>Start a mock interview<Glyph name="arrow" size={17} /></Button>
                <Button variant="secondary" className="landing-command" onClick={() => document.getElementById("live-interview")?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" })}><span aria-hidden="true" className="text-accent">$</span><span>start interview --problem tinyurl</span><Glyph name="down" size={13} /></Button>
            </div>
            <div className="mt-7 hidden flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] text-muted sm:flex"><span className="inline-flex items-center gap-1.5"><Glyph name="check" size={12} />Your own pace</span><span className="inline-flex items-center gap-1.5"><Glyph name="check" size={12} />Real design problems</span><span className="inline-flex items-center gap-1.5"><Glyph name="check" size={12} />Clear next steps</span></div>
        </div>
        <div className="landing-hero-art">
            <div className="mb-4 flex min-h-11 items-center justify-between gap-3">
                <p className="section-kicker">01 / An idea takes shape</p>
                {!finished ? <Button variant="ghost" size="sm" onClick={() => setIntro({ phase: 4, finished: true })} className="!min-h-11 !px-1 font-mono !text-[10px]">Skip intro →</Button>
                    : reduced ? <span className="font-mono text-[10px] text-muted">Reduced motion</span>
                    : <Button variant="ghost" size="sm" onClick={() => setPaused(value => !value)} aria-label={paused ? "Play architecture animation" : "Pause architecture animation"} aria-pressed={!paused} className="!min-h-11 !px-1 font-mono !text-[10px]"><Glyph name={paused ? "play" : "pause"} size={12} />{paused ? "Play" : "Pause"}</Button>}
            </div>
            <Card className="landing-hero-canvas">
                <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5"><span className="flex items-center gap-2 font-mono text-[10px] text-muted"><Glyph name="draw" size={13} />architecture.canvas</span><Badge mono dot tone={flowing ? "accent" : "neutral"}>{!finished ? "Building" : reduced ? "Connected" : paused ? "Paused" : "Live flow"}</Badge></div>
                <ArchitectureScene phase={reduced ? 4 : intro.phase} flowing={flowing} />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 font-mono text-[9px] text-muted sm:px-5"><span><span className="mr-1.5 text-accent">↳</span>Think in connections, not components.</span><span>06 nodes / 05 edges</span></div>
            </Card>
            <Card className="landing-hero-question"><span className="landing-interviewer-mark" aria-hidden="true"><Glyph name="chat" size={16} /></span><div className="min-w-0"><p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Your AI interviewer</p><p className="min-h-[2.8em] text-sm leading-relaxed text-text"><StreamText text="Your cache is fast. What happens when it fails?" charactersPerSecond={24} complete={finished} caret={!finished} /></p></div><CodeChip className="hidden self-start xl:inline-flex">follow_up</CodeChip></Card>
        </div>
    </section>;
}
