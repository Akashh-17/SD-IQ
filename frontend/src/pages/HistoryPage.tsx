import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../components/layout/DashboardLayout";

import HistoryHeader from "../components/history/HistoryHeader";
import HistoryTable from "../components/history/HistoryTable";
import HistoryStats from "../components/history/HistoryStats";

import { getHistory } from "../services/history.service";

export default function HistoryPage() {

    const [history, setHistory] = useState<any[]>([]);

    const [search, setSearch] = useState("");

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

    const filteredHistory = useMemo(() => {

        return history.filter((item) =>

            item.title

                .toLowerCase()

                .includes(

                    search.toLowerCase()

                )

        );

    }, [

        history,

        search,

    ]);

    return (

        <DashboardLayout>

            <div className="mx-auto max-w-7xl">

                <HistoryHeader

                    search={search}

                    setSearch={setSearch}

                />

                <div className="mt-8 grid gap-6 lg:grid-cols-[3fr_2fr]">

                    <HistoryTable

                        history={filteredHistory}

                    />

                    <HistoryStats

                        history={history}

                    />

                </div>

            </div>

        </DashboardLayout>

    );

}