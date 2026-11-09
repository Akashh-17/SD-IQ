import { Badge, Button, Card, CodeChip, Stepper } from "../ui";
import { Reveal, StreamText } from "../../motion";
import { usePlayback } from "./usePlayback";
import ArchitectureScene from "./ArchitectureScene";
import ScoreBars from "./ScoreBars";
import SectionHeading from "./SectionHeading";
import Glyph from "./Glyph";

const steps = [
    { id: "pick", label: "Pick a problem", title: "Start with a good problem.", description: "A short link. A chat app. A feed for millions. Choose a system that stretches the way you think.", chip: "classify_intent" },
    { id: "talk", label: "Talk it through", title: "The next question is yours.", description: "Explain your decisions to an AI interviewer that asks follow-ups. There is room to hesitate, reconsider, and try again.", chip: "evaluate_answer" },
    { id: "draw", label: "Draw your architecture", title: "Make your thinking visible.", description: "Connect the components on a whiteboard. Your diagram becomes part of the conversation, not an afterthought.", chip: "analyze_diagram" },
    { id: "score", label: "Get scored", title: "Leave with a clearer next step.", description: "See stage scores, gaps and concrete feedback. Know what held up, what broke down, and what to practice next.", chip: "generate_report" }
];

function MiniPreview({ step, complete }: { step: number; complete: boolean }) {
    if (step === 0) return <div className="landing-mini-problems"><p className="section-kicker mb-5">Choose your next challenge</p>{[{ name: "URL shortener", detail: "TinyURL", level: "Easy" }, { name: "Chat application", detail: "WhatsApp", level: "Medium" }, { name: "News feed", detail: "Fanout at scale", level: "Hard" }].map((problem, index) => <Card key={problem.name} className={`mb-3 flex items-center gap-4 px-4 py-4 ${index === 0 ? "!border-accent/50 !bg-accent/5" : ""}`}><span className="font-mono text-[11px] text-muted">0{index + 1}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{problem.name}</p><p className="mt-0.5 font-mono text-[10px] text-muted">{problem.detail}</p></div><Badge mono tone={index === 0 ? "accent" : "neutral"}>{problem.level}</Badge></Card>)}</div>;
    if (step === 1) return <div className="landing-mini-chat"><p className="section-kicker mb-6">A conversation, not a checklist</p><div className="landing-sample-bubble"><p className="mb-2 font-mono text-[10px] text-accent">AI interviewer</p><p className="min-h-12 text-sm leading-relaxed"><StreamText text="Why put the cache in front of the database?" complete={complete} charactersPerSecond={32} caret={false} /></p></div><div className="landing-sample-bubble ml-8 mt-4 !bg-elevated"><p className="mb-2 font-mono text-[10px] text-muted">You</p><p className="text-sm leading-relaxed text-text">Redirects are read-heavy. The cache lowers latency, but the database stays the source of truth.</p></div><p className="mt-5 flex items-center gap-2 font-mono text-[10px] text-muted"><Glyph name="chat" size={12} />Every choice has a follow-up.</p></div>;
    if (step === 2) return <div><div className="mb-4 flex items-center justify-between gap-3"><p className="section-kicker">From explanation to architecture</p><Badge mono tone="accent">6 nodes</Badge></div><ArchitectureScene compact /><p className="mt-4 text-center font-mono text-[10px] text-muted">A diagram the interviewer can reason about.</p></div>;
    return <div className="landing-mini-score"><div className="mb-7 flex items-center justify-between gap-3"><p className="section-kicker">Your next iteration starts here</p><Badge mono>Example report</Badge></div><ScoreBars /><div className="mt-7 rounded-control border border-border bg-bg p-4"><p className="mb-2 flex items-center gap-2 text-xs font-medium"><Glyph name="check" size={13} className="text-success" />A strong foundation.</p><p className="text-xs leading-relaxed text-muted">Next, pressure-test cache failure and explain your fallback.</p></div></div>;
}

export default function HowItWorks({ embedded = false }: { embedded?: boolean }) {
    const { attach, index, playing, reduced, setPlaying, select } = usePlayback(steps.length, 6000);
    const step = steps[index];
    return <section id={embedded ? undefined : "how-it-works"} className="landing-container landing-section" aria-label="How it works">
        <Reveal><SectionHeading eyebrow="02 / THE PRACTICE LOOP" title={<>Better interviews.<br /><span className="text-muted">One decision at a time.</span></>}>No memorized script. A problem, a conversation, a canvas, and a little more clarity than you started with.</SectionHeading></Reveal>
        <div ref={attach}>
            <Card className="landing-workflow">
                <div className="landing-workflow-copy"><span className="landing-big-number" aria-hidden="true">0{index + 1}</span><div className="relative"><CodeChip>{step.chip}</CodeChip><h3 className="mt-6 max-w-xs text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.045em]">{step.title}</h3><p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{step.description}</p><div className="mt-8 flex items-center gap-2 font-mono text-[10px] text-muted"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />{reduced ? "Explore each step at your pace." : playing ? "Auto-playing the practice loop" : "Paused. Take a closer look."}</div></div></div>
                <div className="landing-workflow-preview"><Reveal key={index} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileInView={undefined} transition={{ duration: reduced ? 0 : 0.3 }}><MiniPreview step={index} complete={reduced} /></Reveal></div>
                <div className="landing-workflow-controls"><Stepper steps={steps.map(({ id, label }) => ({ id, label }))} activeStep={index} onStepChange={select} playing={playing} onPlayingChange={reduced ? undefined : setPlaying} label="How SystemIQ works" /></div>
            </Card>
        </div>
        <div className="mt-5 flex justify-end"><Button variant="ghost" size="sm" onClick={() => document.getElementById("live-interview")?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" })}>See the conversation<Glyph name="down" size={13} /></Button></div>
    </section>;
}
