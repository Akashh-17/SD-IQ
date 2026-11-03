import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import ReportHero from "../components/report/ReportHero";
import StrengthWeakness from "../components/report/StrengthWeakness";
import StageBreakdown from "../components/report/StageBreakdown";
import Recommendations from "../components/report/Recommendations";
import ReportSummary from "../components/report/ReportSummary";
import { API_URL } from "../config";

export default function ReportPage() {

    const { interviewId } = useParams();

    const [loading, setLoading] = useState(true);

    const [data, setData] = useState<any>(null);

    useEffect(() => {

        async function load() {

            try {

                const res = await fetch(

                    `${API_URL}/api/report/${interviewId}`

                );

                const json = await res.json();

                setData(json);

            }

            catch (err) {

                console.error(err);

            }

            finally {

                setLoading(false);

            }

        }

        load();

    }, [interviewId]);

    if (loading) {

        return (

            <DashboardLayout>

                <div className="flex h-[70vh] items-center justify-center text-gray-400">

                    Loading report...

                </div>

            </DashboardLayout>

        );

    }

    if (!data) {

        return (

            <DashboardLayout>

                <div className="flex h-[70vh] items-center justify-center text-gray-400">

                    Report not found.

                </div>

            </DashboardLayout>

        );

    }

    const interview = data.interview;

    const report = data.report;

    return (

        <DashboardLayout>

            <div className="mx-auto max-w-7xl space-y-8">

                {/* Header */}

                <div className="flex items-center justify-between">

                    <div>

                        <p className="text-sm font-medium tracking-wide text-[#F5B301]">

                            INTERVIEW REPORT

                        </p>

                        <h1 className="mt-2 text-3xl font-bold text-white">

                            {interview.title}

                        </h1>

                        <div className="mt-3 flex items-center gap-5 text-sm text-gray-500">

                            <span>

                                {interview.problem_difficulty}

                            </span>

                            <span>•</span>

                            <span>

                                {interview.difficulty}

                            </span>

                            <span>•</span>

                            <span>

                                {new Date(

                                    interview.completed_at

                                ).toLocaleDateString()}

                            </span>

                        </div>

                    </div>

                    <button

                        className="

                        flex

                        items-center

                        gap-2

                        rounded-xl

                        bg-[#F5B301]

                        px-5

                        py-3

                        font-medium

                        text-black

                        transition

                        hover:brightness-110

                    "

                    >

                        <Download size={18} />

                        Download PDF

                    </button>

                </div>

                {/* Success Banner */}

                <div
                    className="
                    flex
                    items-center
                    justify-between
                    rounded-2xl
                    border
                    border-green-500/20
                    bg-green-500/10
                    px-6
                    py-5
                "
                >

                    <div>

                        <div className="text-lg font-semibold text-green-400">

                            Interview Completed Successfully

                        </div>

                        <div className="mt-1 text-sm text-gray-400">

                            AI evaluation generated from your complete interview.

                        </div>

                    </div>

                    <div className="text-5xl">

                        🎉

                    </div>

                </div>

                {/* Hero */}

                <ReportHero

                    interview={interview}

                    report={report}

                />

                <ReportSummary
                    summary={report.summary}
                />

                {/* Two Column */}

                <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">

                    <div className="space-y-8">

                        <StrengthWeakness

                            strengths={report.strengths}

                            weaknesses={report.weaknesses}

                        />

                        <StageBreakdown

                            stages={

                                report.stage_breakdown ??

                                report.stageBreakdown ??

                                []

                            }

                        />

                        <Recommendations

                            recommendations={

                                report.recommendations

                            }

                        />

                    </div>

                    <aside
                        className="
                        h-fit
                        rounded-2xl
                        border
                        border-white/10
                        bg-[#101114]
                        p-6
                    "
                    >

                        <h2 className="text-lg font-semibold text-white">

                            Interview Details

                        </h2>

                        <div className="mt-6 space-y-5">

                            <div>

                                <div className="text-xs uppercase tracking-wider text-gray-500">

                                    Difficulty

                                </div>

                                <div className="mt-1 font-medium text-white">

                                    {interview.difficulty}

                                </div>

                            </div>

                            <div>

                                <div className="text-xs uppercase tracking-wider text-gray-500">

                                    Problem Level

                                </div>

                                <div className="mt-1 font-medium text-white">

                                    {interview.problem_difficulty}

                                </div>

                            </div>

                            <div>

                                <div className="text-xs uppercase tracking-wider text-gray-500">

                                    Overall Score

                                </div>

                                <div className="mt-1 text-3xl font-bold text-[#F5B301]">

                                    {interview.overall_score}/10

                                </div>

                            </div>

                        </div>

                    </aside>

                </div>

            </div>

        </DashboardLayout>

    );

}