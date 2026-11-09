import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { AnimatedNumber } from "../../motion";
import { Card, CodeChip } from "../ui";
import { improvement, scoreTrend, type HistoryItem } from "../history/history.model";

export default function ImprovementCallout({ history }: { history: HistoryItem[] }) {
    const delta = improvement(history);
    const trend = scoreTrend(history);
    const Icon = delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
    return <Card className="flex flex-wrap items-center justify-between gap-6 !border-accent/25 p-6 sm:p-8"><div><CodeChip>small_steps.compound()</CodeChip><h2 className="mt-5 text-h3">{delta === null ? "Set the baseline. Then build on it." : delta > 0 ? "Your practice is adding up." : delta < 0 ? "A dip is a direction, not a destination." : "A steady base to build from."}</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{delta === null ? "Complete two scored interviews to compare your latest score with your first." : "Latest overall score minus your first overall score. Different problems and interview levels can change the difficulty of the comparison."}</p></div>
        <div className="min-w-0"><div className={`flex items-center gap-2 ${delta !== null && delta < 0 ? "text-warning" : "text-accent"}`}><Icon size={25} aria-hidden="true" /><p className="font-mono text-4xl tracking-tight">{delta !== null ? <AnimatedNumber value={delta} decimals={1} prefix={delta > 0 ? "+" : ""} /> : "—"}</p></div><p className="mt-2 font-mono text-[10px] text-muted">{delta !== null ? "since your first interview" : `${trend.length} of 2 scored sessions`}</p></div>
    </Card>;
}
