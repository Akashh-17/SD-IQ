import { useEffect, useRef, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { getProblem } from "../../services/problem.service";
import { startInterview } from "../../services/interview.service";
import { useReducedMotion } from "../../motion/useReducedMotion";
import { Badge, Button, Card, CodeChip, Dialog, Skeleton } from "../ui";
import { LEVELS, parseChallenge, type Challenge, type InterviewLevel } from "./problem.model";
import RoomSetup from "./RoomSetup";

interface Props {
    problem: Challenge;
    onClose: () => void;
    onStarted: (interviewId: string) => void;
}
function BriefSection({ title, items }: { title: string; items: string[] }) {
    return <Card className="!bg-bg p-4"><h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{title}</h3>{items.length ? <ul className="space-y-2.5">{items.map(item => <li key={item} className="flex items-start gap-2 text-sm font-normal leading-relaxed"><span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" /><span className="min-w-0 break-words">{item}</span></li>)}</ul> : <p className="text-sm text-muted">Not specified in this brief.</p>}</Card>;
}
export default function DifficultyModal({ problem, onClose, onStarted }: Props) {
    const [detail, setDetail] = useState<Challenge | null>(null);
    const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
    const [attempt, setAttempt] = useState(0);
    const [level, setLevel] = useState<InterviewLevel>("SDE1");
    const [starting, setStarting] = useState(false);
    const [startError, setStartError] = useState(false);
    const pending = useRef(false);
    const mounted = useRef(true);
    const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const finishPause = useRef<(() => void) | null>(null);
    const reduced = useReducedMotion();
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; if (pauseTimer.current) clearTimeout(pauseTimer.current); finishPause.current?.(); };
    }, []);
    useEffect(() => {
        let active = true;
        getProblem(problem.id).then(parseChallenge).then(data => {
            if (data.id !== problem.id) throw new Error("Wrong challenge");
            if (active) { setDetail(data); setLevel(data.difficultyLevels[0] ?? "SDE1"); setPhase("ready"); }
        }).catch(() => { if (active) setPhase("error"); });
        return () => { active = false; };
    }, [problem.id, attempt]);
    async function start() {
        if (!detail || phase !== "ready" || !detail.difficultyLevels.includes(level) || pending.current) return;
        pending.current = true;
        setStarting(true); setStartError(false);
        const pause = reduced ? Promise.resolve() : new Promise<void>(resolve => { finishPause.current = resolve; pauseTimer.current = setTimeout(resolve, 650); });
        try {
            const [result] = await Promise.all([startInterview(detail.id, level), pause]);
            if (typeof result?.interviewId !== "string" || !result.interviewId) throw new Error("Interview unavailable");
            if (mounted.current) onStarted(result.interviewId);
        } catch {
            if (mounted.current) { setStarting(false); setStartError(true); }
        } finally {
            pending.current = false;
            if (pauseTimer.current) clearTimeout(pauseTimer.current);
            finishPause.current?.();
            pauseTimer.current = null;
            finishPause.current = null;
        }
    }
    const retry = () => { setPhase("loading"); setAttempt(current => current + 1); };
    return <Dialog open onClose={onClose} title={starting ? "Setting up your interview room" : problem.title} description={starting ? "Your next conversation is on its way." : "Read the brief, then choose how deep you want to go."}
        footer={starting ? <Button variant="ghost" size="sm" onClick={onClose}>Back to challenges</Button> : <div className="flex w-full flex-wrap items-center justify-between gap-3"><Button variant="ghost" onClick={onClose}>Back</Button><Button className="min-w-0" disabled={phase !== "ready" || !detail?.difficultyLevels.includes(level)} onClick={() => void start()}>Start interview</Button></div>}>
        {starting ? <RoomSetup title={problem.title} level={level} /> : phase === "loading" ? <div role="status" aria-label="Loading challenge brief" className="space-y-4"><span className="sr-only">Loading challenge brief…</span><Skeleton className="h-16 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
            : phase === "error" ? <div role="alert"><p className="mb-4 text-sm text-muted">This brief couldn’t load. Please try again.</p><Button variant="secondary" onClick={retry}><RefreshCw size={15} aria-hidden="true" />Retry brief</Button></div>
                : detail && <div className="space-y-6">
                    <div><div className="mb-4 flex flex-wrap gap-2"><Badge mono>{detail.problemDifficulty}</Badge>{detail.custom && <Badge mono tone="accent">AI-generated</Badge>}{detail.estimatedDuration !== null && <Badge mono>~{detail.estimatedDuration} min</Badge>}</div><p className="text-sm leading-relaxed text-muted">{detail.description || "No description provided."}</p></div>
                    <div className="space-y-3"><BriefSection title="01 / Functional requirements" items={detail.functionalRequirements} /><BriefSection title="02 / Non-functional requirements" items={detail.nonFunctionalRequirements} /><BriefSection title="03 / Constraints" items={detail.constraints} /></div>
                    {detail.assumption && <p className="text-xs leading-relaxed text-muted">{detail.assumption}</p>}
                    {detail.concepts.length > 0 && <div><h3 className="section-kicker mb-3">Key concepts</h3><div className="flex flex-wrap gap-2">{detail.concepts.map(concept => <CodeChip key={concept} className="max-w-full whitespace-normal break-words !text-[10px]">{concept}</CodeChip>)}</div></div>}
                    <div role="group" aria-label="Interview level"><h3 className="text-h4">How deep do you want to go?</h3><p className="mb-4 mt-2 text-xs leading-relaxed text-muted">Choose the depth of the conversation. The problem stays the same.</p><div className="space-y-2">{LEVELS.filter(option => detail.difficultyLevels.includes(option.id)).map(option => <Button key={option.id} fullWidth variant="secondary" aria-pressed={level === option.id} onClick={() => { setLevel(option.id); setStartError(false); }} className={`!h-auto !items-start !justify-start !rounded-control !p-4 text-left ${level === option.id ? "!border-accent/40 !bg-accent/10" : ""}`}><span className="min-w-0 flex-1"><span className="block font-mono text-xs">{option.title}</span><span className="mt-2 block whitespace-normal text-xs font-normal leading-relaxed text-muted">{option.description}</span></span>{level === option.id && <Check size={15} className="shrink-0 text-accent" aria-hidden="true" />}</Button>)}</div>{detail.difficultyLevels.length === 0 && <p className="text-sm text-warning">No interview levels are available for this challenge.</p>}</div>
                    {startError && <Card role="alert" className="!border-danger/30 !bg-danger/5 p-4 text-sm text-danger">We couldn’t create your interview room. Please try again.</Card>}
                </div>}
    </Dialog>;
}
