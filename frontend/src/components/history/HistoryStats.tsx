import { CheckCircle2, Layers, Target } from "lucide-react";
import { Card, StatCard } from "../ui";
import { historyStats, type HistoryItem } from "./history.model";

export default function HistoryStats({ history }: { history: HistoryItem[] }) {
    const stats = historyStats(history);
    return <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Completed interviews" value={stats.completed} icon={CheckCircle2} /><StatCard label="Problems explored" value={stats.problems} icon={Layers} />
        {stats.average !== null ? <StatCard label="Average score" value={stats.average} suffix="/10" decimals={1} icon={Target} /> : <Card className="p-6"><p className="text-xs text-muted">Average score</p><p className="mt-5 font-mono text-3xl">—</p><p className="mt-3 text-xs text-muted">No scored interviews yet</p></Card>}
    </div>;
}
