import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Copy, Download, RotateCcw } from "lucide-react";
import { Button, Dialog, Input, Toast } from "../ui";
import { getProblems } from "../../services/problem.service";
import { startInterview } from "../../services/interview.service";
import { object, text, type ReportView } from "./report.model";
import { prepareReportPrint } from "./reportCanvas.loader";

export default function ReportActions({ report, interviewId }: { report: ReportView; interviewId: string }) {
    const navigate = useNavigate();
    const [starting, setStarting] = useState(false), [error, setError] = useState("");
    const [printing, setPrinting] = useState(false);
    const [copied, setCopied] = useState(false), [manual, setManual] = useState(false), [link, setLink] = useState("");
    const alive = useRef(true), busy = useRef(false), input = useRef<HTMLInputElement>(null);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    useEffect(() => { if (manual) { input.current?.focus(); input.current?.select(); } }, [manual]);
    async function again() {
        if (busy.current) return;
        busy.current = true; setStarting(true); setError("");
        try {
            let problemId = report.problemId;
            if (!problemId) {
                const problems = await getProblems();
                const matches = (Array.isArray(problems) ? problems : []).map(object).filter(problem => text(problem.title).toLowerCase() === report.title.toLowerCase());
                if (matches.length === 1) problemId = text(matches[0].id);
            }
            if (!problemId || !["SDE1", "SDE2", "Senior"].includes(report.level)) throw new Error("No replay metadata");
            if (!alive.current) return;
            const response = await startInterview(problemId, report.level);
            if (typeof response?.interviewId !== "string" || !response.interviewId) throw new Error("Invalid interview response");
            if (alive.current) navigate("/interview/" + encodeURIComponent(response.interviewId));
        } catch {
            if (alive.current) setError("We couldn’t start another interview. Try again or choose another problem.");
        } finally { busy.current = false; if (alive.current) setStarting(false); }
    }
    async function share() {
        const url = new URL(window.location.href); url.pathname = "/report/" + encodeURIComponent(interviewId); url.search = ""; url.hash = "";
        setLink(url.href);
        try { if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable"); await navigator.clipboard.writeText(url.href); if (alive.current) setCopied(true); }
        catch { if (alive.current) setManual(true); }
    }
    async function print() {
        if (printing) return;
        if (!report.graph?.nodes.length) { window.print(); return; }
        setPrinting(true); setError("");
        try { await prepareReportPrint(); if (alive.current) window.print(); }
        catch { if (alive.current) setError("The whiteboard couldn’t load for printing. Please try again."); }
        finally { if (alive.current) setPrinting(false); }
    }
    return <div className="report-no-print"><div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent">Interview debrief</p><p className="mt-2 text-xs text-muted">A little clarity. A better next attempt.</p></div><div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
        <Button size="sm" loading={starting} onClick={() => void again()}><RotateCcw size={13} aria-hidden="true" />Practice again</Button>
        <Button variant="secondary" size="sm" disabled={starting} onClick={() => navigate("/problems")}>Try another problem<ArrowRight size={13} aria-hidden="true" /></Button>
        <Button variant="ghost" size="sm" loading={printing} onClick={() => void print()}><Download size={14} aria-hidden="true" />Download PDF</Button>
        <Button variant="ghost" size="sm" onClick={() => void share()}><Copy size={13} aria-hidden="true" />Copy share link</Button>
    </div></div>{starting && <p role="status" className="mt-4 text-xs text-muted">Setting up your next interview…</p>}{error && <p role="alert" className="mt-4 text-xs text-danger">{error}</p>}
        <Toast open={copied} onClose={() => setCopied(false)} title="Report link copied">This link stays private to the account that owns the report.</Toast>
        <Dialog open={manual} onClose={() => setManual(false)} title="Copy your report link" description="This report is private. The link opens for the account that owns it." footer={<Button variant="secondary" onClick={() => setManual(false)}>Done</Button>}><Input ref={input} label="Report link" readOnly value={link} onFocus={event => event.currentTarget.select()} hint="Select the link, then copy it with your keyboard." /></Dialog>
    </div>;
}
