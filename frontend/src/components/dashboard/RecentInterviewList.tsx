import { ArrowUpRight, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, EmptyState } from "../ui";
import StatusBadge from "../history/StatusBadge";
import { formatDate, interviewPath, type HistoryItem } from "../history/history.model";

export default function RecentInterviewList({ history }: { history: HistoryItem[] }) {
    const navigate = useNavigate();
    return <Card className="min-w-0 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 sm:px-6"><div><h2 className="text-h4">Recent interviews</h2><p className="mt-1 text-xs text-muted">Your thinking, one iteration at a time.</p></div><Button variant="ghost" size="sm" onClick={() => navigate("/history")}>View history<ArrowUpRight size={14} aria-hidden="true" /></Button></div>
        {history.length ? <ul className="divide-y divide-border">{history.slice(0, 5).map(item => <li key={item.id}><Link to={interviewPath(item)} className="flex flex-wrap items-center gap-4 px-5 py-5 transition-colors hover:bg-elevated sm:px-6"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border bg-bg text-accent"><MessageSquare size={16} aria-hidden="true" /></span><span className="min-w-0 flex-1 basis-32"><span className="block text-sm font-medium">{item.title}</span><span className="mt-1 block font-mono text-[10px] text-muted">{formatDate(item.date)} · {item.difficulty}</span></span><StatusBadge status={item.status} /><span className="w-14 text-right font-mono text-sm">{item.score !== null ? item.score.toFixed(1) : "—"}<span className="text-[10px] text-muted">{item.score !== null ? "/10" : ""}</span></span><ArrowUpRight size={14} className="text-muted" aria-hidden="true" /></Link></li>)}</ul>
            : <div className="p-5 sm:p-6"><EmptyState title="Your first interview starts here." description="Pick a problem, explain your choices, and turn the feedback into your next step." icon={MessageSquare} action={<Button onClick={() => navigate("/problems")}>Pick your first problem<ArrowUpRight size={15} aria-hidden="true" /></Button>} /></div>}
    </Card>;
}
