import { useId, useState } from "react";
import { Check, ListChecks, Square } from "lucide-react";
import { Badge, Button, Card, EmptyState } from "../ui";
import { Reveal } from "../../motion";
export default function Recommendations({ recommendations }: { recommendations: string[] }) {
    const [checked, setChecked] = useState<Set<number>>(() => new Set());
    const id = useId();
    return <Reveal className="report-reveal"><Card className="p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted">02 / make it actionable</p><h2 className="text-h3">Take this into your next attempt.</h2><p className="mt-2 text-xs text-muted">Pick one improvement. Practice it deliberately.</p></div>{recommendations.length > 0 && <Badge mono>{checked.size}/{recommendations.length} checked</Badge>}</div>
        {recommendations.length ? <ul className="mt-6 space-y-2">{recommendations.map((item, index) => <li key={index}><Button variant="ghost" fullWidth role="checkbox" aria-checked={checked.has(index)} aria-labelledby={id + index} className={`!min-h-16 !items-start !justify-start !rounded-control !border !px-4 !py-4 text-left ${checked.has(index) ? "!border-success/30 !bg-success/5" : "!border-border !bg-bg"}`} onClick={() => setChecked(previous => { const next = new Set(previous); if (next.has(index)) next.delete(index); else next.add(index); return next; })}><span className={`mt-0.5 shrink-0 ${checked.has(index) ? "text-success" : "text-muted"}`}>{checked.has(index) ? <Check size={18} aria-hidden="true" /> : <Square size={18} strokeWidth={1.2} aria-hidden="true" />}</span><span id={id + index} className={`whitespace-pre-wrap break-words text-sm font-normal leading-relaxed ${checked.has(index) ? "text-muted line-through" : "text-text"}`}>{item}</span></Button></li>)}</ul> : <div className="mt-6"><EmptyState icon={ListChecks} title="No next steps recorded" description="You can revisit the stage feedback to choose what to practice next." /></div>}
    </Card></Reveal>;
}
