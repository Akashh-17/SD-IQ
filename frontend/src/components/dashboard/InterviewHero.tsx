import { ArrowRight, GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CodeChip } from "../ui";
import type { HistoryItem } from "../history/history.model";

export default function InterviewHero({ history }: { history: HistoryItem[] }) {
    const navigate = useNavigate();
    const active = history.find(item => item.status === "active");
    return <Card className="relative overflow-hidden !border-accent/25 p-6 sm:p-8"><div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div><Badge mono dot tone="accent">{active ? "An open conversation" : "Make room for your next idea"}</Badge><h2 className="mt-5 max-w-xl text-h2">{active ? "Pick up where you left off." : "Great systems start with good questions."}</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">{active ? `${active.title} · ${active.level}. Your conversation and whiteboard are waiting.` : "Choose a problem. Talk through the tradeoffs. Leave with a clearer picture of what to practice next."}</p>
            <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => navigate(active ? `/interview/${encodeURIComponent(active.interviewId)}` : "/problems")}>{active ? "Continue interview" : "Start an interview"}<ArrowRight size={16} aria-hidden="true" /></Button>{active && <Button variant="secondary" onClick={() => navigate("/problems")}>Start something new</Button>}</div>
        </div><div className="hidden border-l border-border pl-8 lg:block" aria-hidden="true"><GitBranch size={44} strokeWidth={1} className="mb-5 text-accent" /><CodeChip>practice → reflect → repeat</CodeChip><p className="mt-4 font-mono text-[10px] text-muted">your_next_iteration</p></div>
    </div></Card>;
}
