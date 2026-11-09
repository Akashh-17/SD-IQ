import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStats from "../components/dashboard/DashboardStats";
import InterviewHero from "../components/dashboard/InterviewHero";
import RecentInterviewList from "../components/dashboard/RecentInterviewList";
import PopularProblems from "../components/dashboard/PopularProblems";
import { HistoryError, HistoryLoading } from "../components/history/HistoryFeedback";
import { useHistory } from "../components/history/useHistory";
import { Reveal } from "../motion";

export default function Dashboard() {
    const { items, phase, retry } = useHistory();
    return <DashboardLayout><div className="space-y-8"><DashboardHeader />
        {phase === "loading" ? <HistoryLoading /> : phase === "error" ? <HistoryError retry={retry} /> : <>
            <Reveal><InterviewHero history={items} /></Reveal><DashboardStats history={items} />
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"><RecentInterviewList history={items} /><PopularProblems history={items} /></div>
        </>}
    </div></DashboardLayout>;
}
