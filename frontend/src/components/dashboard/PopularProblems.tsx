import { useEffect, useRef, useState } from "react";
import { ArrowRight, Crosshair } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { startInterview } from "../../services/interview.service";
import { Badge, Button, Card, CodeChip } from "../ui";
import type { HistoryItem } from "../history/history.model";
import { recommendProblem } from "./recommendation";

export default function PopularProblems({ history }: { history: HistoryItem[] }) {
    const navigate = useNavigate();
    const choice = recommendProblem(history);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const mounted = useRef(true);
    const pending = useRef(false);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    async function practice() {
        if (pending.current) return;
        pending.current = true;
        setLoading(true);
        setError(false);
        try {
            const result = await startInterview(choice.id, choice.level);
            if (!result?.interviewId) throw new Error("Interview unavailable");
            if (mounted.current) navigate(`/interview/${encodeURIComponent(result.interviewId)}`);
        } catch { if (mounted.current) setError(true); }
        finally { pending.current = false; if (mounted.current) setLoading(false); }
    }
    return <Card className="min-w-0 p-6">
        <div className="flex items-center justify-between gap-3"><p className="section-kicker">Your next iteration</p><Crosshair size={18} className="text-accent" aria-hidden="true" /></div>
        <h2 className="mt-5 text-h3">{choice.weakest ? `Give ${choice.weakest.stage.toLowerCase()} another look.` : "Start simple. Think deeply."}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{choice.weakest ? `Your ${choice.weakest.stage} average is ${choice.weakest.score.toFixed(1)}/10. Try a different set of constraints and focus on explaining that part of the design.` : "Complete a scored interview to unlock a recommendation based on your weakest stage. Until then, here’s a useful starting point."}</p>
        <div className="my-6 rounded-control border border-border bg-bg p-4"><p className="mb-3 text-base font-medium">{choice.title}</p><div className="flex flex-wrap gap-2"><Badge mono>{choice.difficulty}</Badge><CodeChip>{choice.level}</CodeChip></div></div>
        {error && <p role="alert" className="mb-4 text-sm text-danger">We couldn’t start this session. Please try again.</p>}
        <Button fullWidth loading={loading} onClick={() => void practice()}>{loading ? "Starting interview…" : "Practice this problem"}<ArrowRight size={15} aria-hidden="true" /></Button>
        <Button fullWidth variant="ghost" className="mt-2" disabled={loading} onClick={() => navigate("/problems")}>Choose a problem or level</Button>
    </Card>;
}
