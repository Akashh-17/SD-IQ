import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import ReportHero from "../components/report/ReportHero";
import ReportSummary from "../components/report/ReportSummary";
import StageBreakdown from "../components/report/StageBreakdown";
import StrengthWeakness from "../components/report/StrengthWeakness";
import Recommendations from "../components/report/Recommendations";
import ReportDiagram from "../components/report/ReportDiagram";
import ReportTranscript from "../components/report/ReportTranscript";
import ReportActions from "../components/report/ReportActions";
import ReportFeedback, { type ReportPhase } from "../components/report/ReportFeedback";
import { normalizeReport, type ReportView } from "../components/report/report.model";
import { API_URL } from "../config";
import { getSession } from "../services/auth.service";
import { endInterview, getReportStatus } from "../services/endInterview.service";
import { errorStatus } from "../lib/apiError";
import "../components/report/report.css";

function ReportRoute({ interviewId }: { interviewId: string }) {
    const [data, setData] = useState<ReportView | null>(null);
    const [phase, setPhase] = useState<ReportPhase>("generating");
    const [notice, setNotice] = useState("");
    const [step, setStep] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [retrying, setRetrying] = useState(false);
    const retryAbort = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!interviewId) return;
        const abort = new AbortController();
        let ignore = false, delay = 2000, polls = 0;
        let timer: ReturnType<typeof setTimeout>;
        async function poll() {
            try {
                const status = await getReportStatus(interviewId, abort.signal);
                if (ignore) return;
                if (status.status === "failed") {
                    setPhase("failed");
                    setNotice("Report generation failed. You can retry without repeating your interview.");
                    return;
                }
                if (status.status === "ready") {
                    const session = await getSession();
                    if (ignore) return;
                    if (!session?.access_token) { setPhase("unauthorized"); return; }
                    const response = await fetch(`${API_URL}/api/report/${encodeURIComponent(interviewId)}`, { signal: abort.signal, headers: { Authorization: `Bearer ${session.access_token}` } });
                    if (ignore) return;
                    if ([401, 403, 404].includes(response.status)) { setPhase(response.status === 404 ? "missing" : "unauthorized"); return; }
                    if (!response.ok) throw new Error("Report temporarily unavailable");
                    const report = normalizeReport(await response.json());
                    if (!ignore) { setData(report); setNotice(""); setPhase("ready"); }
                    return;
                }
                setNotice(""); setPhase("generating");
                polls++;
                // T4: two-second polls, backing off only after three intervals.
                if (polls > 3) delay = Math.min(delay * 1.5, 15000);
            } catch (error) {
                if (ignore || abort.signal.aborted) return;
                const code = errorStatus(error);
                if ([401, 403, 404].includes(code ?? 0)) { setPhase(code === 404 ? "missing" : "unauthorized"); return; }
                setPhase("generating");
                setNotice("Connection interrupted. Reconnecting to your report...");
                delay = Math.min(delay * 2, 15000);
            }
            if (!ignore) timer = setTimeout(poll, delay);
        }
        void poll();
        return () => { ignore = true; abort.abort(); clearTimeout(timer); };
    }, [interviewId, attempt]);
    useEffect(() => {
        if (phase !== "generating") return;
        const timer = setInterval(() => setStep(previous => Math.min(previous + 1, 2)), 2500);
        return () => clearInterval(timer);
    }, [phase, attempt]);
    useEffect(() => () => retryAbort.current?.abort(), []);

    async function retry() {
        if (!interviewId || retryAbort.current) return;
        const abort = new AbortController(); retryAbort.current = abort; setRetrying(true);
        try {
            await endInterview(interviewId, abort.signal);
            if (!abort.signal.aborted) { setNotice(""); setPhase("generating"); setStep(0); setAttempt(value => value + 1); }
        } catch (error) {
            if (!abort.signal.aborted) {
                if ([401, 403].includes(errorStatus(error) ?? 0)) { setNotice(""); setPhase("unauthorized"); }
                else setNotice("Couldn't restart report generation. Please try again.");
            }
        } finally {
            if (retryAbort.current === abort) { retryAbort.current = null; if (!abort.signal.aborted) setRetrying(false); }
        }
    }
    return <DashboardLayout><div className="report-page mx-auto max-w-6xl space-y-6">
        {phase === "ready" && data ? <>
            <ReportActions report={data} interviewId={interviewId} />
            <ReportHero report={data} />
            <ReportSummary summary={data.summary} />
            <StageBreakdown stages={data.stages} />
            <StrengthWeakness strengths={data.strengths} weaknesses={data.weaknesses} />
            <Recommendations recommendations={data.recommendations} />
            <ReportDiagram graph={data.graph} />
            <ReportTranscript messages={data.transcript} />
            <p className="report-footer border-t border-border pt-5 text-center font-mono text-[10px] leading-relaxed text-muted">A practice session is a snapshot of your thinking. Use the feedback to shape what comes next.</p>
        </> : <ReportFeedback phase={phase} step={step} notice={notice} retrying={retrying} onRetry={() => void retry()} />}
    </div></DashboardLayout>;
}
export default function ReportPage() {
    const { interviewId } = useParams();
    // Report-local interactions, requests and timers cannot bleed into another ID.
    return <ReportRoute key={interviewId} interviewId={interviewId ?? ""} />;
}
