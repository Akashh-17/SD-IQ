import { Card, CodeChip } from "../ui";
import { Reveal, Stagger, StaggerItem } from "../../motion";
import ScoreBars from "./ScoreBars";
import SectionHeading from "./SectionHeading";
import Glyph from "./Glyph";

export default function FeatureShowcase({ embedded = false }: { embedded?: boolean }) {
    return <section id={embedded ? undefined : "what-you-get"} className="landing-container landing-section" aria-label="What you get">
        <Reveal><SectionHeading eyebrow="05 / WHAT YOU TAKE WITH YOU" title={<>Feedback you can<br /><span className="text-accent">build on.</span></>}>An interview should leave you with more than a number. Find the next decision worth revisiting.</SectionHeading></Reveal>
        <Stagger className="grid gap-4 lg:grid-cols-3">
            <StaggerItem><Card className="landing-benefit-card"><div className="landing-benefit-visual"><ScoreBars compact /></div><CodeChip>stage_scores</CodeChip><h3 className="mt-4 text-xl font-medium tracking-[-0.035em]">Know where you stand.</h3><p className="mt-3 text-sm leading-relaxed text-muted">Stage-by-stage scores show where your reasoning is strong and where the next question should take you.</p><p className="mt-4 font-mono text-[9px] text-muted">Illustrative scores shown above</p></Card></StaggerItem>
            <StaggerItem><Card className="landing-benefit-card"><div className="landing-benefit-visual"><div className="mb-4 flex items-center gap-3 rounded-control border border-border bg-bg p-3"><Glyph name="draw" size={18} className="text-accent" /><span className="font-mono text-[10px] text-muted">architecture_review</span></div><p className="mb-4 flex gap-2 text-xs leading-relaxed"><Glyph name="check" size={14} className="shrink-0 text-success" />The cache belongs on the read path.</p><p className="flex gap-2 text-xs leading-relaxed text-muted"><Glyph name="plus" size={14} className="shrink-0 text-warning" />Next: explain the database fallback.</p></div><CodeChip>diagram_feedback</CodeChip><h3 className="mt-4 text-xl font-medium tracking-[-0.035em]">See the bigger picture.</h3><p className="mt-3 text-sm leading-relaxed text-muted">Your whiteboard gets a second look. Find missing connections, unclear choices and useful follow-up questions.</p></Card></StaggerItem>
            <StaggerItem><Card className="landing-benefit-card"><div className="landing-benefit-visual">{["Requirements clarified", "Tradeoffs explained", "Next attempt planned"].map((label, index) => <div key={label} className="flex items-center gap-3 border-b border-border py-3 last:border-0"><span className="font-mono text-[10px] text-muted">0{index + 1}</span><span className="flex-1 text-xs">{label}</span><Glyph name={index === 2 ? "arrow" : "check"} size={14} className={index === 2 ? "text-muted" : "text-success"} /></div>)}</div><CodeChip>practice_history</CodeChip><h3 className="mt-4 text-xl font-medium tracking-[-0.035em]">Keep a trail of progress.</h3><p className="mt-3 text-sm leading-relaxed text-muted">Return to past interviews and reports. Compare your decisions, spot recurring gaps, and choose what to practice next.</p></Card></StaggerItem>
        </Stagger>
    </section>;
}
