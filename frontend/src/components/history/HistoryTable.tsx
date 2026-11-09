import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Card, EmptyState, Input } from "../ui";
import StatusBadge from "./StatusBadge";
import { formatDate, interviewPath, type HistoryItem } from "./history.model";

type Sort = "title" | "difficulty" | "date" | "score";
const PAGE_SIZE = 8;
const difficulties = ["All", "Easy", "Medium", "Hard"];
const statuses = [{ id: "all", label: "All sessions" }, { id: "completed", label: "Completed" }, { id: "active", label: "In progress" }, { id: "generating", label: "Report pending" }, { id: "failed", label: "Report failed" }, { id: "expired", label: "Expired" }];
const rank: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2, Unspecified: 3 };

export default function HistoryTable({ history }: { history: HistoryItem[] }) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState("All");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState<Sort>("date");
    const [ascending, setAscending] = useState(false);
    const [page, setPage] = useState(1);
    const filtered = history.filter(item => item.title.toLowerCase().includes(search.trim().toLowerCase()) && (difficulty === "All" || item.difficulty === difficulty) && (status === "all" || item.status === status));
    const sorted = [...filtered].sort((a, b) => {
        // Missing scores and dates always follow real values, in either direction.
        if (sort === "score" && (a.score === null || b.score === null)) return a.score === b.score ? 0 : a.score === null ? 1 : -1;
        if (sort === "date" && (a.timestamp === null || b.timestamp === null)) return a.timestamp === b.timestamp ? 0 : a.timestamp === null ? 1 : -1;
        const comparison = sort === "title" ? a.title.localeCompare(b.title) : sort === "difficulty" ? rank[a.difficulty] - rank[b.difficulty] : sort === "score" ? a.score! - b.score! : a.timestamp! - b.timestamp!;
        return comparison * (ascending ? 1 : -1);
    });
    const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const start = (current - 1) * PAGE_SIZE;
    const visible = sorted.slice(start, start + PAGE_SIZE);
    function order(next: Sort) {
        setAscending(next === sort ? !ascending : next === "title" || next === "difficulty");
        setSort(next); setPage(1);
    }
    function reset() { setSearch(""); setDifficulty("All"); setStatus("all"); setPage(1); }
    return <Card className="min-w-0 overflow-hidden">
        <div className="space-y-5 border-b border-border p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-h4">Your interviews</h2><div className="w-full sm:w-72"><Input id="history-search" label="Search problems" icon={Search} placeholder="Find a problem…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div></div>
            <div className="flex flex-wrap gap-x-7 gap-y-4"><div role="group" aria-label="Filter by difficulty" className="flex flex-wrap items-center gap-1"><span className="mr-2 font-mono text-[10px] text-muted">Difficulty</span>{difficulties.map(value => <Button key={value} size="sm" variant={difficulty === value ? "secondary" : "ghost"} aria-pressed={difficulty === value} onClick={() => { setDifficulty(value); setPage(1); }}>{value}</Button>)}</div>
                <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-1">{statuses.map(value => <Button key={value.id} size="sm" variant={status === value.id ? "secondary" : "ghost"} aria-pressed={status === value.id} onClick={() => { setStatus(value.id); setPage(1); }}>{value.label}</Button>)}</div></div>
        </div>
        {!history.length ? <div className="p-6"><EmptyState title="A clean slate." description="Your interviews will appear here as soon as you start practicing." action={<Button onClick={() => navigate("/problems")}>Start an interview<ArrowUpRight size={15} aria-hidden="true" /></Button>} /></div>
            : !visible.length ? <div className="p-6"><EmptyState title="No matching interviews." description="Try a different search or clear the filters to see every session." action={<Button variant="secondary" onClick={reset}>Clear filters</Button>} /></div>
                : <><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><caption className="sr-only">Interview history. Select a problem to open its report or continue an active session.</caption>
                    <thead className="border-b border-border bg-bg"><tr>{([{ id: "title", label: "Problem" }, { id: "difficulty", label: "Difficulty" }, { id: "date", label: "Date" }, { id: "score", label: "Score" }] as const).map(column => <th key={column.id} scope="col" aria-sort={sort === column.id ? ascending ? "ascending" : "descending" : "none"} className="px-3 py-2 font-normal first:pl-5 sm:first:pl-6"><Button size="sm" variant="ghost" className="!px-2" aria-label={`Sort by ${column.label.toLowerCase()}`} onClick={() => order(column.id)}>{column.label}{sort === column.id ? ascending ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" /> : <ArrowUpDown size={12} aria-hidden="true" />}</Button></th>)}<th scope="col" className="px-5 py-3 text-xs font-normal text-muted">Status</th></tr></thead>
                    <tbody className="divide-y divide-border">{visible.map(item => <tr key={item.id} onClick={event => { if (!(event.target as HTMLElement).closest("a")) navigate(interviewPath(item)); }} className="cursor-pointer transition-colors hover:bg-elevated focus-within:bg-elevated">
                        <td className="px-5 py-5 sm:pl-6"><Link to={interviewPath(item)} className="inline-flex min-h-11 items-center gap-2 rounded-sm font-medium">{item.title}<ArrowUpRight size={13} className="shrink-0 text-muted" aria-hidden="true" /></Link><p className="font-mono text-[10px] text-muted">{item.level}</p></td>
                        <td className="px-5 py-5"><Badge mono tone={item.difficulty === "Hard" ? "warning" : "neutral"}>{item.difficulty}</Badge></td>
                        <td className="whitespace-nowrap px-5 py-5 font-mono text-xs text-muted">{formatDate(item.date)}</td>
                        <td className="px-5 py-5 font-mono">{item.score !== null ? <>{item.score.toFixed(1)}<span className="text-[10px] text-muted">/10</span></> : <span aria-label="Not scored">—</span>}</td>
                        <td className="whitespace-nowrap px-5 py-5"><StatusBadge status={item.status} /></td>
                    </tr>)}</tbody>
                </table></div><div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4 sm:px-6"><p role="status" aria-live="polite" className="font-mono text-[10px] text-muted">{start + 1}–{Math.min(start + PAGE_SIZE, sorted.length)} of {sorted.length} interviews</p><nav aria-label="History pagination" className="flex items-center gap-3"><Button variant="secondary" size="icon" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={15} aria-hidden="true" /></Button><span className="font-mono text-xs">{current} / {pages}</span><Button variant="secondary" size="icon" aria-label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight size={15} aria-hidden="true" /></Button></nav></div></>}
    </Card>;
}
