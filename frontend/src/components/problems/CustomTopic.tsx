import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCheck, GitBranch, Sparkles } from "lucide-react";
import { createCustomProblem, ProblemApiError } from "../../services/problem.service";
import { Badge, Button, Card, CodeChip, Input } from "../ui";
import { Reveal, Stagger, StaggerItem } from "../../motion";
import { parseChallenge, type Challenge } from "./problem.model";

const examples = ["Design LeetCode", "Design a payment system", "Design Google Docs"];

export default function CustomTopic({ onPrepared }: { onPrepared: (problem: Challenge, matched: boolean) => void }) {
    const [topic, setTopic] = useState("");
    const [touched, setTouched] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<{ message: string; suggestion?: string } | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const active = useRef<AbortController | null>(null);
    useEffect(() => () => { active.current?.abort(); }, []);
    const invalid = topic.trim().length < 3 || topic.trim().length > 120;
    function choose(value: string) { setTopic(value); setTouched(false); setError(null); input.current?.focus(); }
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (active.current) return;
        setTouched(true);
        if (invalid) { input.current?.focus(); return; }
        const controller = new AbortController();
        active.current = controller;
        setPending(true); setError(null);
        try {
            const result = await createCustomProblem(topic.trim(), controller.signal);
            if (controller.signal.aborted) return;
            onPrepared(parseChallenge(result.problem), result.matched);
        } catch (failure) {
            if (!controller.signal.aborted) setError(failure instanceof ProblemApiError
                ? { message: failure.message, suggestion: failure.suggestion }
                : { message: "We couldn’t prepare that interview. Please try again." });
        } finally {
            if (active.current === controller) { active.current = null; if (!controller.signal.aborted) setPending(false); }
        }
    }
    return <Card className="!border-accent/25 p-5 sm:p-7" aria-busy={pending}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><Badge mono tone="accent"><Sparkles size={12} aria-hidden="true" />Beyond the collection</Badge><h2 className="mt-4 text-h3">Practice any topic.</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Bring a system you’re curious about. We’ll prepare a brief, interview stages and feedback guide for your challenge.</p></div><CodeChip>design_your_next_challenge</CodeChip></div>
        <form aria-label="Practice any topic" noValidate onSubmit={event => void submit(event)}>
            <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <Input ref={input} id="custom-topic" label="What would you like to design?" placeholder="e.g. Design LeetCode" value={topic} maxLength={120} required disabled={pending} error={touched && invalid ? "Use 3–120 characters for your system design topic." : undefined} onBlur={() => setTouched(true)} onChange={event => { setTopic(event.target.value); setError(null); }} />
                <Button type="submit" loading={pending} disabled={pending} className="min-w-0 lg:mt-7">{pending ? "Preparing…" : "Prepare interview"}<ArrowRight size={15} aria-hidden="true" /></Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-[10px] text-muted">High-level system design · 5 requests per hour</p><span aria-hidden="true" className="font-mono text-[10px] text-muted">{topic.length}/120</span></div>
            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Example topics">{examples.map(example => <Button key={example} size="sm" variant="secondary" disabled={pending} className="!text-[11px]" onClick={() => choose(example)}>{example}</Button>)}</div>
        </form>
        {pending && <Reveal className="mt-6"><div role="status" aria-live="polite" aria-label="Preparing your interview" className="rounded-control border border-border bg-bg p-5"><h3 className="text-sm font-medium">Preparing your interview…</h3><p className="mt-2 text-xs leading-relaxed text-muted">Creating a brief and checking that the stages and scoring guide fit together. You can review the challenge before starting.</p><Stagger className="mt-4 flex flex-wrap gap-3">{[{ icon: Sparkles, label: "Your topic" }, { icon: GitBranch, label: "Interview stages" }, { icon: CheckCheck, label: "Consistent brief" }].map(({ icon: Icon, label }) => <StaggerItem key={label}><CodeChip><Icon size={11} className="mr-1.5 text-accent" aria-hidden="true" />{label}</CodeChip></StaggerItem>)}</Stagger></div></Reveal>}
        {error && <Card role="alert" className="mt-5 !border-danger/25 !bg-danger/5 p-4"><p className="text-sm leading-relaxed text-danger">{error.message}</p>{error.suggestion && <div className="mt-4"><p className="mb-3 break-words text-sm text-text">{error.suggestion}</p><Button variant="secondary" size="sm" onClick={() => choose(error.suggestion!)}>Use suggested topic</Button></div>}</Card>}
    </Card>;
}
