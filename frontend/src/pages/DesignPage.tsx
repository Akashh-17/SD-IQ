import { useReducedMotion } from "../motion/useReducedMotion";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Braces, Check, CheckCheck, CircleHelp, Layers3, Plus, RotateCcw, SlidersHorizontal, Terminal, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import DashboardLayout from "../components/layout/DashboardLayout";
import LogoMark from "../components/branding/LogoMark";
import {
    Badge, Button, Card, CardContent, CardHeader, Chip, CodeChip, Dialog, EmptyState,
    Input, Kbd, ProgressBar, Skeleton, StatCard, Stepper, Tabs, Textarea, Toast, Tooltip
} from "../components/ui";
import { AnimatedNumber, CountUp, PageTransition, Reveal, Stagger, StaggerItem, StreamText, Typewriter } from "../motion";

const steps = [{ id: "understand", label: "Understand" }, { id: "design", label: "Design" }, { id: "refine", label: "Refine" }];
const swatches = [
    { name: "Canvas", token: "bg", hex: "#0B110E", color: "bg-bg" },
    { name: "Surface", token: "surface", hex: "#121A15", color: "bg-surface" },
    { name: "Elevated", token: "elevated", hex: "#1A241D", color: "bg-elevated" },
    { name: "Signal lime", token: "accent", hex: "#B5ED72", color: "bg-accent" }
];

function SectionHeading({ number, title, children }: { number: string; title: string; children: ReactNode }) {
    return <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="section-kicker mb-3">{number}</p><h2 className="text-h2">{title}</h2></div>
        <p className="max-w-xs text-sm leading-relaxed text-muted">{children}</p>
    </div>;
}

function Specimen({ title, label, children }: { title: string; label: string; children: ReactNode }) {
    return <Card className="min-w-0"><CardHeader className="flex items-center justify-between gap-4"><h3 className="text-sm font-medium">{title}</h3><span className="font-mono text-[10px] text-muted">{label}</span></CardHeader><CardContent>{children}</CardContent></Card>;
}

function SystemTrace({ active, complete }: { active: number; complete: boolean }) {
    const reduced = useReducedMotion();
    return <div className="relative flex min-h-[248px] flex-col justify-between overflow-hidden px-5 pb-5 pt-5 sm:px-6">
        <div className="flex items-center justify-between gap-3"><span className="section-kicker">A thought, connected.</span><span className="font-mono text-[10px] text-muted">sys.trace / 00{active + 1}</span></div>
        <div className="bg-grid relative my-3 flex h-32 items-center justify-center rounded-control">
            <svg viewBox="0 0 400 130" fill="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <path d="M75 65H175M225 65H325M200 40V16H300V40M200 90V115H100V90" stroke="rgb(var(--color-border))" strokeWidth="1.5" />
                <motion.path key={active} d={active === 0 ? "M75 65H175" : active === 1 ? "M225 65H325" : "M200 40V16H300V40"}
                    stroke="rgb(var(--color-accent))" strokeWidth="1.5" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduced ? 0 : 0.8 }} />
                <circle cx="100" cy="115" r="3" fill="rgb(var(--color-muted))" /><circle cx="300" cy="40" r="3" fill="rgb(var(--color-accent))" />
            </svg>
            <div className="relative flex w-full items-center justify-between px-3 sm:px-6">
                <div className="flex h-12 w-[74px] items-center justify-center rounded-control border border-border bg-surface font-mono text-[10px] text-muted">input</div>
                <div className="flex h-16 w-20 flex-col items-center justify-center gap-1.5 rounded-card border border-accent/50 bg-surface shadow-glow"><Workflow size={20} strokeWidth={1.4} aria-hidden="true" className="text-accent" /><span className="font-mono text-[9px] text-text">reason</span></div>
                <div className="flex h-12 w-[74px] items-center justify-center rounded-control border border-border bg-surface font-mono text-[10px] text-muted">refine</div>
            </div>
        </div>
        <p className="min-h-8 font-mono text-[11px] leading-relaxed text-muted"><span className="mr-2 text-accent" aria-hidden="true">↳</span><StreamText text={["Define the constraints before the components.", "Connect the choices. Explain the tradeoffs.", "Find the signal. Build a stronger system."][active]} complete={complete} /></p>
    </div>;
}

export default function DesignPage() {
    const reduced = useReducedMotion();
    const [activeStep, setActiveStep] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [introSkipped, setIntroSkipped] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [toastOpen, setToastOpen] = useState(false);
    const [replay, setReplay] = useState(0);
    const [number, setNumber] = useState(128);
    const [view, setView] = useState(0);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        const oldTitle = document.title;
        document.title = "Design system · SystemIQ";
        return () => { document.title = oldTitle; };
    }, []);
    useEffect(() => {
        if (!playing || reduced) return;
        const timer = window.setInterval(() => setActiveStep(step => (step + 1) % steps.length), 5000);
        return () => window.clearInterval(timer);
    }, [playing, reduced]);
    useEffect(() => {
        if (!busy) return;
        const timer = window.setTimeout(() => { setBusy(false); setToastOpen(true); }, 1200);
        return () => window.clearTimeout(timer);
    }, [busy]);
    function skipIntro() { setIntroSkipped(true); setPlaying(false); setActiveStep(2); }

    return <DashboardLayout title="Design system" preview>
        <div className="mx-auto max-w-[1200px]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                <p className="section-kicker"><span className="mr-3 text-accent">SI / 001</span>Interface foundations</p>
                <nav aria-label="Design system sections" className="flex gap-5 text-xs text-muted"><a href="#foundations" className="py-2 hover:text-text">Foundations</a><a href="#components" className="py-2 hover:text-text">Components</a><a href="#motion" className="py-2 hover:text-text">Motion<ArrowDown size={10} aria-hidden="true" className="ml-1 inline" /></a></nav>
            </div>

            <section aria-labelledby="design-heading" className="grid items-center gap-10 pb-10 pt-12 lg:grid-cols-[1.12fr_1fr] lg:gap-10 lg:pb-12 lg:pt-16">
                <Reveal>
                    <div className="mb-7 flex items-center gap-2.5"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" /><p className="section-kicker">Made for the way you think.</p></div>
                    <h1 id="design-heading" className="text-display">Good systems.<br /><span className="text-accent">Clear thinking.</span></h1>
                    <p className="mt-6 max-w-[370px] text-base leading-relaxed text-muted">A quieter interface for complex ideas. Built to help you connect the dots, explain the tradeoffs, and find your next breakthrough.</p>
                    <div className="mt-8 flex flex-wrap items-center gap-4"><a href="#components" className="btn-primary">Explore the system<ArrowRight size={15} aria-hidden="true" /></a><button type="button" onClick={skipIntro} disabled={introSkipped} className="min-h-11 rounded-pill px-2 text-xs text-muted underline-offset-4 hover:text-text hover:underline disabled:cursor-default">{introSkipped ? "Intro skipped" : "Skip intro"}</button></div>
                </Reveal>
                <Reveal delay={0.12}>
                    <Card className="overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border px-5 py-3"><span className="inline-flex items-center gap-2 font-mono text-[10px] text-muted"><Terminal size={12} aria-hidden="true" />interview_pipeline</span><Badge mono tone="accent" dot>Live preview</Badge></div>
                        <SystemTrace active={activeStep} complete={introSkipped || Boolean(reduced)} />
                        <div className="border-t border-border px-5 py-4"><Stepper steps={steps} activeStep={activeStep} onStepChange={step => { setActiveStep(step); setPlaying(false); }} playing={playing && !reduced} onPlayingChange={reduced ? undefined : setPlaying} label="Animated design process" /></div>
                    </Card>
                    <p className="mt-3 text-right font-mono text-[10px] text-muted">{reduced ? "Reduced motion · your preference, respected." : "Motion should explain. Never distract."}</p>
                </Reveal>
            </section>

            <Stagger className="mb-12 grid gap-3 sm:grid-cols-3">
                <StaggerItem><StatCard label="Problems to think through" value={8} detail="Different systems. One approach." icon={Layers3} /></StaggerItem>
                <StaggerItem><StatCard label="Stages from idea to insight" value={7} detail="A clear path through complexity." icon={Workflow} /></StaggerItem>
                <StaggerItem><StatCard label="Shared visual language" value={1} detail="Every detail, part of the system." icon={Braces} /></StaggerItem>
            </Stagger>

            <section id="foundations" aria-label="Foundations" className="design-section">
                <Reveal><SectionHeading number="01 / FOUNDATIONS" title="Less noise. More signal.">Warm neutrals. A living green. Enough contrast to keep the important things clear.</SectionHeading></Reveal>
                <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-4">{swatches.map(swatch => <StaggerItem key={swatch.token}><div className="overflow-hidden rounded-card border border-border"><div className={`h-24 border-b border-border ${swatch.color}`} aria-hidden="true" /><div className="bg-surface p-4"><div className="flex flex-wrap items-center justify-between gap-1"><h3 className="text-xs font-medium">{swatch.name}</h3><span className="font-mono text-[10px] text-muted">{swatch.hex}</span></div><p className="mt-1.5 font-mono text-[10px] text-muted">--color-{swatch.token}</p></div></div></StaggerItem>)}</Stagger>
                <div className="mt-4 flex flex-wrap items-center gap-3"><span className="mr-2 text-xs text-muted">Semantic signals</span><Badge tone="success" dot>Success</Badge><Badge tone="warning" dot>Warning</Badge><Badge tone="danger" dot>Danger</Badge><span className="ml-auto font-mono text-[10px] text-muted">Status always has a label.</span></div>
                <Reveal className="mt-10 grid gap-8 border-t border-border pt-10 md:grid-cols-[1fr_1.5fr]">
                    <div><span className="font-display text-8xl font-medium tracking-[-0.08em]">Aa<span className="text-accent">.</span></span><h3 className="mt-4 text-sm font-medium">Geist & Geist Mono</h3><p className="mt-2 max-w-xs text-sm text-muted">Human where it matters.<br />Precise where it counts.</p><div className="mt-4 flex gap-2"><CodeChip>12px radius</CodeChip><CodeChip>1px border</CodeChip></div></div>
                    <div className="space-y-5"><div><span className="section-kicker">H1 / Tight & intentional</span><p className="mt-2 text-h1">Think in systems.</p></div><div className="grid grid-cols-2 gap-4"><div><span className="section-kicker">H2 / Section</span><p className="mt-2 text-h2">Find clarity.</p></div><div><span className="section-kicker">H3 / Card</span><p className="mt-2 text-h3">Follow the signal.</p><p className="mt-2 text-h4">H4 / The finer details</p></div></div><div className="border-t border-border pt-4"><p className="text-body text-muted">Body / Space to reason. Room to breathe.</p><p className="mt-2 font-mono text-mono text-muted">Mono / evaluate_answer → 128ms</p></div></div>
                </Reveal>
            </section>

            <section id="components" aria-label="Components" className="design-section">
                <Reveal><SectionHeading number="02 / COMPONENTS" title="Small parts. Strong systems.">Familiar interactions, carefully considered. Try them with a mouse or just your keyboard.</SectionHeading></Reveal>
                <div className="grid items-start gap-4 xl:grid-cols-2">
                    <div className="space-y-4">
                        <Specimen title="Actions" label="Button / 04 variants">
                            <div className="flex flex-wrap items-center gap-3"><Button onClick={() => setBusy(true)} loading={busy}>Start a session<ArrowUpRight size={14} aria-hidden="true" /></Button><Button variant="secondary" onClick={() => setDialogOpen(true)}><SlidersHorizontal size={14} aria-hidden="true" />Configure</Button><Tooltip content="A little context, right when you need it."><Button variant="ghost" size="icon" aria-label="Show contextual help"><CircleHelp size={18} aria-hidden="true" /></Button></Tooltip></div>
                            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5"><Button size="sm" variant="secondary" onClick={() => setToastOpen(true)}>Small action</Button><Button size="lg" variant="ghost" onClick={() => setToastOpen(true)}>Ghost action</Button><Button variant="danger" size="sm" onClick={() => setToastOpen(true)}>Discard</Button><Button size="sm" disabled>Unavailable</Button><Button size="sm" loading>Loading</Button></div>
                            <p className="mt-5 text-xs text-muted">One primary action. Everything else makes room.</p>
                        </Specimen>
                        <Specimen title="Labels & shortcuts" label="Badge · Chip · Kbd">
                            <div className="flex flex-wrap gap-2"><Badge>Neutral</Badge><Badge tone="accent" dot>In progress</Badge><Chip tone="success"><Check size={11} aria-hidden="true" />Completed</Chip><Badge tone="warning">Needs review</Badge><Badge tone="danger">Failed</Badge></div>
                            <div className="mt-5 flex flex-wrap items-center gap-2"><CodeChip>evaluate_answer</CodeChip><CodeChip>intent: ANSWER</CodeChip><CodeChip>p95 &lt; 200ms</CodeChip></div>
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><span className="text-xs text-muted">Keyboard notation</span><span className="flex items-center gap-1.5"><Kbd>Ctrl</Kbd><span className="text-xs text-muted">+</span><Kbd>Enter</Kbd></span></div>
                        </Specimen>
                    </div>
                    <Specimen title="Space for your thinking" label="Input · Textarea">
                        <form className="space-y-5" onSubmit={event => { event.preventDefault(); setToastOpen(true); }}>
                            <Input label="System name" placeholder="e.g. A distributed rate limiter" hint="Give the problem a name you can reason about." />
                            <Textarea label="Design notes" placeholder="Start with the constraints. What does your system need to do?" rows={3} />
                            <Input label="Validation example" defaultValue="not a valid number" error="Enter a positive number, such as 1000." />
                            <div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] text-muted">Your ideas, at your pace.</span><Button variant="secondary" type="submit" size="sm">Save notes<CheckCheck size={14} aria-hidden="true" /></Button></div>
                        </form>
                    </Specimen>
                </div>

                <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
                    <Specimen title="A place for every perspective" label="Tabs · ProgressBar">
                        <Tabs label="Interview preview" items={[
                            { id: "overview", label: "Overview", content: <div><p className="mb-6 text-sm leading-relaxed text-muted">A good architecture starts with a clear problem. Follow the thread from requirements to tradeoffs.</p><ProgressBar value={57} label="Interview progress" /></div> },
                            { id: "stages", label: "Stages", content: <div className="space-y-5"><ProgressBar value={100} label="Requirements" /><ProgressBar value={72} label="High level design" /><ProgressBar value={25} label="Core flow" /></div> },
                            { id: "trace", label: "Trace", content: <div className="rounded-control border border-border bg-bg p-4 font-mono text-xs leading-7 text-muted">input <span className="text-accent">→</span> graph_analysis<br />intent <span className="text-accent">→</span> evaluate_answer<br />conversation <span className="text-accent">→</span> interviewer</div> }
                        ]} />
                    </Specimen>
                    <Specimen title="Feedback, without friction" label="Dialog · Toast · Tooltip">
                        <div className="mb-5 flex items-start gap-3 rounded-control border border-success/25 bg-success/5 p-4"><CheckCheck size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-success" /><div><h4 className="text-sm font-medium">Your thinking is saved.</h4><p className="mt-1 text-xs leading-relaxed text-muted">Clear feedback keeps you moving. Nothing should leave you guessing.</p></div></div>
                        <div className="flex flex-wrap gap-3"><Button variant="secondary" size="sm" onClick={() => setDialogOpen(true)}>Open dialog<ArrowUpRight size={13} aria-hidden="true" /></Button><Button variant="ghost" size="sm" onClick={() => setToastOpen(true)}>Show notification</Button></div>
                    </Specimen>
                </div>
                <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
                    <Specimen title="Something is on its way" label="Skeleton · Card">
                        <div role="status" aria-label="Loading interview preview" className="space-y-4"><div className="flex gap-3"><Skeleton className="h-10 w-10 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></div><Skeleton className="h-24 w-full" /><div className="flex justify-between"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-14" /></div><span className="sr-only">Loading preview</span></div>
                    </Specimen>
                    <EmptyState title="Every system starts somewhere." description="No sessions yet. Pick a problem, make a few decisions, and see where they take you." action={<Button variant="secondary" size="sm" onClick={() => setDialogOpen(true)}>Create a session<Plus size={14} aria-hidden="true" /></Button>} />
                </div>
            </section>

            <section id="motion" aria-label="Motion" className="design-section">
                <Reveal><SectionHeading number="03 / MOTION" title="Movement with meaning.">Reveal the next idea. Connect a cause to its effect. Always respect reduced motion.</SectionHeading></Reveal>
                <div className="mb-6 flex items-center justify-between gap-4"><Badge mono dot>prefers-reduced-motion: {reduced ? "reduce" : "no-preference"}</Badge><Button variant="ghost" size="sm" onClick={() => setReplay(value => value + 1)}><RotateCcw size={13} aria-hidden="true" />Replay samples</Button></div>
                <Stagger key={replay} className="grid gap-4 md:grid-cols-3">
                    <StaggerItem><Card className="h-full p-6"><p className="section-kicker">01 / CountUp</p><p className="mb-3 mt-7 font-mono text-4xl tracking-[-0.06em]"><CountUp value={99.9} decimals={1} suffix="%" /></p><p className="text-xs text-muted">Numbers settle into place.</p></Card></StaggerItem>
                    <StaggerItem><Card className="h-full p-6"><p className="section-kicker">02 / AnimatedNumber</p><div className="mb-3 mt-5 flex items-center justify-between gap-2"><p className="font-mono text-4xl tracking-[-0.06em]"><AnimatedNumber value={number} suffix="ms" /></p><Button variant="secondary" size="icon" onClick={() => setNumber(value => value + 10)} aria-label="Increase sample latency by 10 milliseconds"><Plus size={16} aria-hidden="true" /></Button></div><p className="text-xs text-muted">A change you can follow.</p></Card></StaggerItem>
                    <StaggerItem><Card className="h-full p-6"><p className="section-kicker">03 / StreamText</p><p className="mb-3 mt-7 min-h-10 font-mono text-sm text-text"><Typewriter text="Think → build → understand." charactersPerSecond={18} /></p><p className="text-xs text-muted">Ideas arrive as they form.</p></Card></StaggerItem>
                </Stagger>
                <div className="mt-4 grid gap-4 md:grid-cols-2"><Reveal><Card className="p-6"><div className="mb-6 flex items-center justify-between gap-3"><p className="section-kicker">04 / PageTransition</p><Button variant="ghost" size="sm" onClick={() => setView(value => 1 - value)}>Switch view<ArrowRight size={13} aria-hidden="true" /></Button></div><PageTransition transitionKey={String(view)}><div className="rounded-control border border-border bg-bg p-5"><CodeChip>{view ? "refine_architecture" : "understand_problem"}</CodeChip><p className="mt-3 text-sm text-muted">{view ? "Each iteration makes the next decision clearer." : "Give each new idea a little room to arrive."}</p></div></PageTransition></Card></Reveal><Reveal delay={0.08}><Card className="p-6"><p className="section-kicker mb-6">05 / Reveal + Stagger</p><Stagger key={replay} className="flex flex-wrap gap-2">{["Requirements", "Architecture", "Tradeoffs"].map((label, index) => <StaggerItem key={label}><div className="flex min-h-16 items-center gap-3 rounded-control border border-border bg-bg px-4"><span className="font-mono text-xs text-accent">0{index + 1}</span><span className="text-xs">{label}</span></div></StaggerItem>)}</Stagger><p className="mt-5 text-xs text-muted">A sequence. Never a spectacle.</p></Card></Reveal></div>
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-border py-8"><div className="flex items-center gap-3"><LogoMark className="!h-7 !w-7" /><p className="text-xs text-muted">Built for clearer thinking.</p></div><div className="flex items-center gap-3"><CodeChip>SystemIQ / v0.1</CodeChip><a href="#design-heading" aria-label="Back to top" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted hover:text-text"><ArrowUpRight size={16} aria-hidden="true" /></a></div></footer>
        </div>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Make room for your next idea." description="A small configuration dialog. Keyboard focus stays here until you close it."
            footer={<><Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => { setDialogOpen(false); setToastOpen(true); }}>Save configuration<Check size={14} aria-hidden="true" /></Button></>}>
            <Input label="Session name" defaultValue="My next system" hint="You can always change your approach." />
        </Dialog>
        <Toast open={toastOpen} onClose={() => setToastOpen(false)} title="All set. Keep thinking.">This is a preview notification. Your next idea is waiting.</Toast>
    </DashboardLayout>;
}
