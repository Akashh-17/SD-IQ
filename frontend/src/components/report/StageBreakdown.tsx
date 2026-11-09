import { useId, useState, type CSSProperties } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { Badge, Button, Card, EmptyState, ProgressBar } from "../ui";
import { Reveal } from "../../motion";
import type { StageResult } from "./report.model";
export default function StageBreakdown({ stages }: { stages: StageResult[] }) {
    const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
    const [visible, setVisible] = useState(false);
    const id = useId();
    return <Reveal className="report-reveal" onViewportEnter={() => setVisible(true)}><Card className={`overflow-hidden ${visible ? "report-stage-animate" : ""}`}><div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-6 sm:px-8"><div><p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted">01 / stage by stage</p><h2 className="text-h3">Where your design landed</h2><p className="mt-2 text-xs leading-relaxed text-muted">Open a stage for its feedback. Only evaluated stages are shown.</p></div><Badge mono>{stages.length} evaluated</Badge></div>
        {stages.length ? <div className="divide-y divide-border">{stages.map((stage, index) => <section key={stage.name + index} className="report-stage-fill px-6 py-5 sm:px-8" style={{ "--report-delay": `${index * 65}ms` } as CSSProperties}>
            <Button variant="ghost" fullWidth className="!min-h-11 !justify-between !rounded-control !p-0 text-left hover:!bg-transparent" aria-expanded={expanded.has(index)} aria-controls={id + index} onClick={() => setExpanded(previous => { const next = new Set(previous); if (next.has(index)) next.delete(index); else next.add(index); return next; })}>
                <span className="flex min-w-0 items-center gap-3"><span className="font-mono text-[10px] text-muted">{String(index + 1).padStart(2, "0")}</span><span className="break-words text-sm text-text">{stage.name}</span></span><span className="flex shrink-0 items-center gap-4"><span className="font-mono text-sm text-text">{stage.score ?? "—"}<span className="ml-0.5 text-[10px] text-muted">/10</span></span><ChevronDown size={14} aria-hidden="true" className={`report-no-print text-muted transition-transform motion-reduce:transition-none ${expanded.has(index) ? "rotate-180" : ""}`} /></span>
            </Button>
            {stage.score !== null ? <div className="mt-2"><ProgressBar value={stage.score} max={10} label={`${stage.name} score`} showValue={false} /></div> : <p className="mt-2 font-mono text-[10px] text-muted">Score not recorded</p>}
            <div id={id + index} hidden={!expanded.has(index)} className="report-expand mt-4 rounded-control border border-border bg-bg px-4 py-3"><p className="whitespace-pre-wrap text-xs leading-[1.85] text-muted">{stage.feedback || "No additional stage feedback was saved."}</p></div>
        </section>)}</div> : <div className="p-6"><EmptyState icon={Layers} title="No stage scores recorded" description="This interview did not produce individual stage evaluations." /></div>}
    </Card></Reveal>;
}
