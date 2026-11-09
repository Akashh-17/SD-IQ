import { CalendarDays, Clock3, Layers, Sparkles } from "lucide-react";
import { Badge, Card } from "../ui";
import { Reveal } from "../../motion";
import ScoreGauge from "./ScoreGauge";
import { formatDate, formatDuration, levelLabel, type ReportView } from "./report.model";

export default function ReportHero({ report }: { report: ReportView }) {
    return <Reveal className="report-reveal"><Card className="report-hero relative overflow-hidden !border-accent/20 p-6 sm:p-9 lg:p-10">
        <div aria-hidden="true" className="report-hero-glow pointer-events-none absolute -right-24 -top-40 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0"><div className="mb-6 flex flex-wrap items-center gap-2"><Badge tone="success" dot mono>Interview complete</Badge>{report.difficulty && <Badge mono>{report.difficulty}</Badge>}</div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Your interview. In perspective.</p>
                <h1 className="max-w-3xl break-words text-h1">{report.title}</h1>
                <div className="mt-6 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 text-xs text-muted"><Sparkles size={14} aria-hidden="true" />Candidate level</span><Badge tone={report.candidateLevel ? "accent" : "neutral"} mono>{report.candidateLevel ? levelLabel(report.candidateLevel) : "Not assessed"}</Badge></div>
                <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6 sm:grid-cols-3">
                    {[{ label: "Completed", value: formatDate(report.date), Icon: CalendarDays }, { label: "Duration", value: formatDuration(report.durationMs), Icon: Clock3 }, { label: "Interview level", value: report.level || "Not recorded", Icon: Layers }].map(({ label, value, Icon }) => <div key={label}><dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted"><Icon size={12} aria-hidden="true" />{label}</dt><dd className="mt-2 text-xs font-medium">{value}</dd></div>)}
                </dl>
            </div>
            <div className="border-t border-border pt-7 text-center lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"><ScoreGauge score={report.score} /><p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">Overall score</p><p className="mx-auto mt-2 max-w-48 text-xs leading-relaxed text-muted">{report.score === null ? "This report has no recorded score." : "A measure of this session. A starting point for your next."}</p></div>
        </div>
    </Card></Reveal>;
}
