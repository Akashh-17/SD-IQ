import DashboardLayout from "../components/layout/DashboardLayout";
import HistoryHeader from "../components/history/HistoryHeader";
import HistoryTable from "../components/history/HistoryTable";
import HistoryStats from "../components/history/HistoryStats";
import { HistoryError, HistoryLoading } from "../components/history/HistoryFeedback";
import { useHistory } from "../components/history/useHistory";

export default function HistoryPage() {
    const { items, phase, retry } = useHistory();
    return <DashboardLayout><div className="space-y-8"><HistoryHeader />
        {phase === "loading" ? <HistoryLoading /> : phase === "error" ? <HistoryError retry={retry} /> : <><HistoryStats history={items} /><HistoryTable history={items} /></>}
    </div></DashboardLayout>;
}
