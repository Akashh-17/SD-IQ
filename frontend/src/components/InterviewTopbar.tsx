import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, HelpCircle, LoaderCircle, LogOut, PanelRightClose, PanelRightOpen } from "lucide-react";
import LogoMark from "./branding/LogoMark";
import { endInterview } from "../services/endInterview.service";
import { getInterviewState } from "../services/interviewState.service";
import { Badge, Button, Dialog, Stepper, ThemeToggle, Tooltip } from "./ui";
import { ROOM_STEPS, completedStepIndexes, stageIndex, useRoom, type RoomSnapshot } from "./chat/room.context";
import ElapsedTimer from "./chat/ElapsedTimer";

export default function InterviewTopbar() {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const room = useRoom();
    const loadInitial = room?.loadInitial, flushGraph = room?.flushGraph;
    const [local, setLocal] = useState<RoomSnapshot | null>(null);
    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const requested = useRef(false);
    const autoEnded = useRef(false);
    const steps = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!interviewId) return;
        let active = true;
        (loadInitial ? loadInitial() : getInterviewState(interviewId)).then(snapshot => { if (active) setLocal(snapshot); }).catch(() => {});
        return () => { active = false; };
    }, [interviewId, loadInitial]);
    const snapshot = room?.snapshot ?? local;
    const stage = snapshot?.interview?.stage;
    const current = stageIndex(stage);
    const completedSteps = completedStepIndexes(stage, snapshot?.interview?.endedAtStage);
    useEffect(() => {
        const active = steps.current?.querySelector<HTMLElement>('[aria-current="step"]');
        if (active && steps.current) steps.current.scrollLeft = Math.max(0, active.offsetLeft - steps.current.clientWidth / 2 + active.clientWidth / 2);
    }, [current]);
    const finish = useCallback(async () => {
        if (!interviewId || requested.current) return;
        requested.current = true; setLoading(true); setError("");
        try {
            await flushGraph?.();
            await endInterview(interviewId);
            navigate(`/report/${interviewId}`);
        } catch { requested.current = false; setError("We couldn’t end the interview. Please try again."); }
        finally { setLoading(false); }
    }, [interviewId, flushGraph, navigate]);
    const deadline = useCallback(() => { if (!autoEnded.current) { autoEnded.current = true; void finish(); } }, [finish]);
    const save = room?.saveStatus ?? "loading";
    return <header className="room-topbar shrink-0 border-b border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3"><LogoMark /><div className="min-w-0"><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Your interview room</p><h1 className="mt-1 truncate text-sm font-medium">{snapshot?.interview?.title || "System design interview"}</h1></div>{snapshot?.interview?.difficulty && <span className="hidden sm:inline-flex"><Badge mono>{snapshot.interview.difficulty}</Badge></span>}</div>
            <div className="flex shrink-0 items-center gap-2"><span role="status" aria-label={save === "saved" ? "Diagram saved" : save === "saving" ? "Saving diagram" : save === "error" ? "Diagram save failed" : "Loading diagram"} className={`inline-flex items-center gap-1.5 font-mono text-[9px] ${save === "error" ? "text-danger" : "text-muted"}`}>{save === "saved" ? <Check size={12} className="text-success" aria-hidden="true" /> : save !== "error" ? <LoaderCircle size={12} className="motion-safe:animate-spin" aria-hidden="true" /> : null}<span className="hidden sm:inline">{save === "saved" ? "Saved" : save === "saving" ? "Saving…" : save === "error" ? "Save failed" : "Loading…"}</span></span>
                <ElapsedTimer startedAt={snapshot?.interview?.startedAt} onDeadline={deadline} />
                {room && <Tooltip content={room.collapsed ? "Show chat" : "Collapse chat"}><Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label={room.collapsed ? "Show chat" : "Collapse chat"} aria-expanded={!room.collapsed} onClick={room.toggleChat}>{room.collapsed ? <PanelRightOpen size={15} aria-hidden="true" /> : <PanelRightClose size={15} aria-hidden="true" />}</Button></Tooltip>}
                <ThemeToggle className="!h-8 !w-8" />
                {room && <Tooltip content="Keyboard shortcuts · ?"><Button variant="ghost" size="icon" className="hidden !h-8 !w-8 sm:inline-flex" aria-label="Keyboard shortcuts" onClick={room.showHelp}><HelpCircle size={15} aria-hidden="true" /></Button></Tooltip>}
                <Button variant="danger" size="sm" loading={loading} onClick={() => setConfirm(true)}><LogOut size={13} aria-hidden="true" />End interview</Button>
            </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-2.5 sm:px-5"><div ref={steps} tabIndex={0} aria-label="Interview stage progress" className="room-stage-scroll min-w-0 flex-1 overflow-x-auto"><div className="min-w-[570px]"><Stepper steps={ROOM_STEPS.map(label => ({ id: label, label }))} activeStep={current} completedSteps={completedSteps} label="Interview stages" /></div></div><span className="hidden max-w-36 truncate font-mono text-[9px] text-muted lg:inline">{stage || "Connecting…"}</span></div>
        {error && !confirm && <p role="alert" className="px-5 pb-3 text-xs text-danger">{error}</p>}
        <Dialog open={confirm} onClose={() => { if (!loading) setConfirm(false); }} title="End this interview?" description="We’ll save your latest diagram and prepare your report. You’ll be taken to the report page right away." footer={<><Button variant="secondary" disabled={loading} onClick={() => setConfirm(false)}>Keep practicing</Button><Button variant="danger" loading={loading} onClick={() => void finish()}>End interview</Button></>}>
            <p className="text-sm leading-relaxed text-muted">Ready to turn this conversation into your next step?</p>{error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
        </Dialog>
    </header>;
}
