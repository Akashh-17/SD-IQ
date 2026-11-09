import { useNavigate } from "react-router-dom";
import { CircleAlert, FileSearch, LockKeyhole, RefreshCw } from "lucide-react";
import { Badge, Button, Card, Stepper } from "../ui";
import { Reveal } from "../../motion";
export type ReportPhase = "generating" | "failed" | "ready" | "missing" | "unauthorized";
export default function ReportFeedback({ phase, step, notice, retrying, onRetry }: { phase: ReportPhase; step: number; notice: string; retrying: boolean; onRetry: () => void }) {
    const navigate = useNavigate();
    const Icon = phase === "unauthorized" ? LockKeyhole : phase === "missing" ? FileSearch : phase === "failed" ? CircleAlert : RefreshCw;
    const title = phase === "failed" ? "Report generation failed" : phase === "missing" ? "Report not found." : phase === "unauthorized" ? "Sign in to view this report" : "Generating your report";
    return <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center"><Reveal className="report-reveal"><Card className="p-6 sm:p-9"><div className="mb-7 flex items-center justify-between gap-3"><span className={`flex h-12 w-12 items-center justify-center rounded-card border border-border bg-elevated ${phase === "failed" ? "text-danger" : "text-accent"}`}><Icon size={22} aria-hidden="true" className={phase === "generating" ? "motion-safe:animate-spin" : ""} /></span><Badge mono>{phase === "generating" ? "Preparing your debrief" : "Interview report"}</Badge></div>
        <h1 className="text-h2">{title}</h1>
        {phase === "generating" ? <><p className="mt-4 text-sm leading-relaxed text-muted">Your interview is saved. We’re turning your decisions into useful feedback.</p><div className="my-8" aria-live="polite"><Stepper steps={["Analyzing answers", "Scoring stages", "Writing feedback"].map(label => ({ id: label, label }))} activeStep={step} label="Report preparation steps" /></div><p className="font-mono text-[10px] leading-relaxed text-muted">Preparation steps are illustrative while the report runs.</p></> : <p className="mt-4 text-sm leading-relaxed text-muted">{phase === "failed" ? "Your interview is saved. Retry the report without repeating your answers." : phase === "unauthorized" ? "Your session can’t open this report. Sign in with the account that completed the interview." : "The link may be unavailable, or this report belongs to a different account. You can find your reports in interview history."}</p>}
        {notice && <p role={phase === "failed" ? "alert" : "status"} className={`mt-5 text-xs leading-relaxed ${phase === "failed" ? "text-danger" : "text-muted"}`}>{notice}</p>}
        <div className="mt-7 flex flex-wrap gap-3">{phase === "failed" && <Button loading={retrying} onClick={onRetry}>Retry report generation</Button>}{phase === "unauthorized" && <Button onClick={() => navigate("/login")}>Sign in</Button>}{phase !== "generating" && <Button variant="secondary" onClick={() => navigate("/history")}>Back to interview history</Button>}</div>
    </Card></Reveal></div>;
}
