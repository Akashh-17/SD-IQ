import { ArrowUpRight, Clock3, GitBranch, Trophy } from "lucide-react";
import { Badge, Button, Card, CodeChip } from "../ui";
import type { Challenge, ChallengePerformance } from "./problem.model";

interface Props {
    problem: Challenge;
    selected: boolean;
    onSelect: () => void;
    performance: ChallengePerformance | null;
}
export default function ProblemCard({ problem, selected, onSelect, performance }: Props) {
    return <Card className={`h-full overflow-hidden ${selected ? "!border-accent/50" : ""}`}><Button variant="ghost" fullWidth className="!h-full !min-w-0 !items-stretch !justify-start !rounded-card !p-0 text-left !text-text" onClick={onSelect} aria-label={`Explore ${problem.title}`} aria-haspopup="dialog" aria-expanded={selected}>
        <span className="flex w-full min-w-0 flex-col p-6"><span className="mb-6 flex flex-wrap items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-control border border-accent/20 bg-accent/10 text-accent"><GitBranch size={20} strokeWidth={1.5} aria-hidden="true" /></span><Badge mono tone={problem.problemDifficulty === "Hard" ? "warning" : problem.problemDifficulty === "Easy" ? "success" : "neutral"}>{problem.problemDifficulty}</Badge></span>
            {problem.custom && <span className="mb-3"><Badge mono tone="accent">AI-generated</Badge></span>}
            <span className="text-xl font-medium tracking-tight">{problem.title}</span><span className="mb-5 mt-3 text-sm font-normal leading-relaxed text-muted">{problem.description || "Open the challenge to review its brief."}</span>
            <span className="mb-6 flex flex-wrap gap-2">{problem.concepts.length ? problem.concepts.slice(0, 3).map(concept => <CodeChip key={concept} className="max-w-full whitespace-normal break-words !text-[10px]">{concept}</CodeChip>) : <span className="text-xs font-normal text-muted">Concepts not specified</span>}{problem.concepts.length > 3 && <Badge mono>+{problem.concepts.length - 3}</Badge>}</span>
            <span className="mt-auto flex flex-wrap items-center gap-3 border-t border-border pt-4"><span className="flex items-center gap-1.5 font-mono text-[10px] font-normal text-muted"><Clock3 size={12} aria-hidden="true" />{problem.estimatedDuration !== null ? `~${problem.estimatedDuration} min` : "Time not specified"}</span>
                {performance?.bestScore !== null && performance?.bestScore !== undefined ? <Badge mono tone="accent"><Trophy size={11} aria-hidden="true" />Best {performance.bestScore.toFixed(1)}/10</Badge> : performance?.attempted ? <Badge mono>Attempted · not scored yet</Badge> : null}
            </span><span className="mt-5 flex items-center justify-between text-xs text-accent">Explore challenge<ArrowUpRight size={16} aria-hidden="true" /></span>
        </span>
    </Button></Card>;
}
