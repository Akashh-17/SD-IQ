import { ArrowRight, ChartNoAxesCombined } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Button, EmptyState } from "../components/ui";
import { Reveal } from "../motion";
import { HistoryError, HistoryLoading } from "../components/history/HistoryFeedback";
import { useHistory } from "../components/history/useHistory";
import { ScoreTrend, StageAverages } from "../components/progress/ProgressCharts";
import ActivityCalendar from "../components/progress/ActivityCalendar";
import ImprovementCallout from "../components/progress/ImprovementCallout";

export default function ProgressPage() {
    const { items, phase, retry } = useHistory();
    const navigate = useNavigate();
    return <DashboardLayout><div className="space-y-8"><header><p className="section-kicker mb-3">The longer view</p><h1 className="text-h2">See your thinking take shape.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Look for patterns across your practice. Use the signal to choose what comes next.</p></header>
        {phase === "loading" ? <HistoryLoading /> : phase === "error" ? <HistoryError retry={retry} /> : !items.length ? <EmptyState title="Every expert starts with a first attempt." description="Complete your first interview to set a baseline. Your scores, stage strengths, and practice activity will live here." icon={ChartNoAxesCombined} action={<Button onClick={() => navigate("/problems")}>Pick your first problem<ArrowRight size={15} aria-hidden="true" /></Button>} /> : <>
            <Reveal><ImprovementCallout history={items} /></Reveal>
            <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"><ScoreTrend history={items} /><StageAverages history={items} /></div>
            <ActivityCalendar history={items} />
        </>}
    </div></DashboardLayout>;
}
