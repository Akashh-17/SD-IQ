import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProblemHeader from "../components/problems/ProblemHeader";
import ProblemCard from "../components/problems/ProblemCard";
import DifficultyModal from "../components/problems/DifficultyModal";
import CustomTopic from "../components/problems/CustomTopic";
import { ProblemLoadError, ProblemSkeletons } from "../components/problems/ProblemFeedback";
import { challengePerformance, parseChallenges, type Challenge } from "../components/problems/problem.model";
import { useHistory } from "../components/history/useHistory";
import { Badge, Button, Card, EmptyState } from "../components/ui";
import { Stagger, StaggerItem } from "../motion";
import { getProblems } from "../services/problem.service";

export default function ProblemPage() {
    const navigate = useNavigate();
    const [problems, setProblems] = useState<Challenge[]>([]);
    const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
    const [attempt, setAttempt] = useState(0);
    const [selected, setSelected] = useState<Challenge | null>(null);
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState("All");
    const [attempted, setAttempted] = useState("all");
    const history = useHistory();
    useEffect(() => {
        let active = true;
        getProblems().then(parseChallenges).then(data => {
            if (active) { setProblems(previous => [...new Map([...previous, ...data].map(problem => [problem.id, problem])).values()]); setPhase("ready"); }
        }).catch(() => { if (active) setPhase("error"); });
        return () => { active = false; };
    }, [attempt]);
    const cards = problems.map(problem => ({ problem, performance: history.phase === "ready" ? challengePerformance(problem, history.items) : null }));
    const query = search.trim().toLowerCase();
    const filtered = cards.filter(({ problem, performance }) =>
        [problem.title, problem.description, ...problem.concepts].some(value => value.toLowerCase().includes(query)) &&
        (difficulty === "All" || problem.problemDifficulty === difficulty) &&
        (history.phase !== "ready" || attempted === "all" || (attempted === "yes" ? performance?.attempted : !performance?.attempted))
    );
    function reset() { setSearch(""); setDifficulty("All"); setAttempted("all"); }
    function retry() { setPhase("loading"); setAttempt(current => current + 1); }
    function prepared(problem: Challenge) {
        setProblems(previous => [...new Map([...previous, problem].map(item => [item.id, item])).values()]);
        setPhase("ready"); reset(); setSelected(problem);
    }
    return <DashboardLayout><div className="space-y-8"><ProblemHeader search={search} onSearch={setSearch} />
        <CustomTopic onPrepared={prepared} />
        <Card className="flex flex-wrap items-center justify-between gap-5 p-4 sm:p-5"><div role="group" aria-label="Filter challenges by difficulty" className="flex flex-wrap items-center gap-1"><span className="mr-2 font-mono text-[10px] text-muted">Difficulty</span>{["All", "Easy", "Medium", "Hard"].map(value => <Button key={value} size="sm" variant={difficulty === value ? "secondary" : "ghost"} aria-pressed={difficulty === value} onClick={() => setDifficulty(value)}>{value}</Button>)}</div>
            <div role="group" aria-label="Filter challenges by attempts" className="flex flex-wrap items-center gap-1">{[{ id: "all", label: "All challenges" }, { id: "no", label: "Not attempted" }, { id: "yes", label: "Attempted" }].map(value => <Button key={value.id} size="sm" disabled={history.phase !== "ready"} variant={attempted === value.id ? "secondary" : "ghost"} aria-pressed={attempted === value.id} onClick={() => setAttempted(value.id)}>{value.label}</Button>)}</div>
        </Card>
        {history.phase === "error" && <Card role="alert" className="flex flex-wrap items-center justify-between gap-4 p-4"><p className="text-xs leading-relaxed text-muted">Past attempts couldn’t load. You can still explore and start any challenge.</p><Button variant="secondary" size="sm" onClick={history.retry}><RefreshCw size={13} aria-hidden="true" />Retry history</Button></Card>}
        {phase === "loading" ? <ProblemSkeletons /> : phase === "error" ? <ProblemLoadError onRetry={retry} /> : !problems.length ? <EmptyState title="New challenges are on their way." description="No problems are available right now. Try refreshing the collection." action={<Button variant="secondary" onClick={retry}>Refresh challenges</Button>} /> : <>
            <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" aria-live="polite" className="font-mono text-[10px] text-muted">{filtered.length} of {problems.length} challenges{history.phase === "loading" ? " · checking past attempts…" : ""}</p><Badge mono>your own pace</Badge></div>
            {filtered.length ? <Stagger key={`${difficulty}:${attempted}:${query}`} className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{filtered.map(({ problem, performance }) => <StaggerItem key={problem.id} className="min-w-0"><ProblemCard problem={problem} performance={performance} selected={selected?.id === problem.id} onSelect={() => setSelected(problem)} /></StaggerItem>)}</Stagger>
                : <EmptyState title="No challenges match just yet." description="Try another keyword or clear your filters to explore the full collection." action={<Button variant="secondary" onClick={reset}>Clear filters</Button>} />}
        </>}
    </div>{selected && <DifficultyModal key={selected.id} problem={selected} onClose={() => setSelected(null)} onStarted={id => navigate(`/interview/${encodeURIComponent(id)}`)} />}</DashboardLayout>;
}
