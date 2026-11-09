import { CheckCircle2, Flame, Target, Trophy } from "lucide-react";
import { Card, StatCard } from "../ui";
import { CountUp, Stagger, StaggerItem } from "../../motion";
import { historyStats, type HistoryItem } from "../history/history.model";

export default function DashboardStats({ history }: { history: HistoryItem[] }) {
    const stats = historyStats(history);
    return <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&_.card]:h-full">
        <StaggerItem><StatCard label="Interviews done" value={stats.completed} detail="Completed conversations" icon={CheckCircle2} /></StaggerItem>
        <StaggerItem>{stats.average !== null ? <StatCard label="Average score" value={stats.average} suffix="/10" decimals={1} detail={`${stats.scored} scored interview${stats.scored === 1 ? "" : "s"}`} icon={Target} /> : <Card className="h-full p-6"><p className="text-xs text-muted">Average score</p><p className="mt-5 font-mono text-3xl">—</p><p className="mt-3 text-[11px] text-muted">Your first report sets the baseline</p></Card>}</StaggerItem>
        <StaggerItem><Card className="h-full p-5 sm:p-6"><div className="flex justify-between gap-3 text-xs text-muted"><p>Best stage</p><Trophy size={16} aria-hidden="true" /></div><p className="mt-5 text-xl font-medium tracking-tight">{stats.bestStage?.stage ?? "—"}</p><p className="mt-3 font-mono text-[11px] text-muted">{stats.bestStage ? <CountUp value={stats.bestStage.score} decimals={1} suffix="/10 average" /> : "Complete a scored stage to find out"}</p></Card></StaggerItem>
        <StaggerItem><StatCard label="Current streak" value={stats.streak} suffix={stats.streak === 1 ? " day" : " days"} detail="Consecutive days with a completion" icon={Flame} /></StaggerItem>
    </Stagger>;
}
