import { useEffect, useState } from "react";
import PopularProblems from "../components/dashboard/PopularProblems";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getHistory } from "../services/history.service";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStats from "../components/dashboard/DashboardStats";
import RecentInterviewList from "../components/dashboard/RecentInterviewList";

export default function Dashboard() {

    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {

        loadHistory();

    }, []);

    async function loadHistory() {

        try {

            const data = await getHistory();

            setHistory(data);

        }

        catch (err) {

            console.error(err);

        }

    }

    return (

        <DashboardLayout>

            <div className="space-y-6">

                {/* HEADER */}

                <DashboardHeader />

                {/* STATS */}

                <DashboardStats history={history} />

                {/* CONTENT */}

                <div className="grid grid-cols-12 gap-6">

                    {/* Left - 65% */}

                    <div className="col-span-8">

                        <RecentInterviewList history={history} />

                    </div>

                    {/* Right - 35% */}

                    <div className="col-span-4">

                        <PopularProblems />

                    </div>

                </div>

            </div>

        </DashboardLayout>

    );

}