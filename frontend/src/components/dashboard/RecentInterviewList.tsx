import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
    history: any[];
}

export default function RecentInterviewList({
    history,
}: Props) {

    const navigate = useNavigate();

    return (

        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-base p-6">

            {/* Header */}

            <div className="mb-6 flex items-center justify-between">

                <div>

                    <h2 className="text-xl font-bold text-white">

                        Recent Interviews

                    </h2>

                    <p className="mt-1 text-sm text-gray-500">

                        Review your latest interview sessions.

                    </p>

                </div>

                <button

                    onClick={() => navigate("/history")}

                    className="text-sm font-medium text-[#F5B301] hover:underline"

                >

                    View All →

                </button>

            </div>

            {

                history.length === 0 ? (

                    <div className="flex h-72 flex-col items-center justify-center">

                        <div className="text-5xl">

                            🎤

                        </div>

                        <h3 className="mt-5 text-xl font-semibold text-white">

                            No Interviews Yet

                        </h3>

                        <p className="mt-2 text-center text-gray-500">

                            Start your first interview to begin tracking your progress.

                        </p>

                        <button

                            onClick={() => navigate("/problems")}

                            className="mt-6 rounded-xl bg-[#F5B301] px-5 py-3 font-semibold text-black transition hover:brightness-110"

                        >

                            Start Interview

                        </button>

                    </div>

                ) : (

                    <div className="overflow-hidden rounded-xl border border-white/10">

                        {/* Header */}

                        <div className="grid grid-cols-12 bg-[#101114] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">

                            <div className="col-span-5">

                                Problem

                            </div>

                            <div className="col-span-2">

                                Difficulty

                            </div>

                            <div className="col-span-2">

                                Status

                            </div>

                            <div className="col-span-1 text-center">

                                Score

                            </div>

                            <div className="col-span-2 text-right">

                                Date

                            </div>

                        </div>

                        {

                            history

                                .slice(0, 5)

                                .map((interview) => (

                                    <button

                                        key={interview.id}

                                        onClick={() =>

                                            navigate(

                                                `/report/${interview.interview_id}`

                                            )

                                        }

                                        className="group grid w-full text-md grid-cols-12 items-center border-t border-white/5 bg-[#0F1013] px-5 py-4 text-left transition-all duration-200 hover:bg-[#17181C]"

                                    >

                                        {/* Problem */}

                                        <div className="col-span-5">

                                            <div className="font-medium text-white">

                                                {interview.title}

                                            </div>

                                        </div>

                                        {/* Difficulty */}

                                        <div className="col-span-2">

                                            <span

                                                className={`rounded-full px-3 py-1 text-xs

                                                ${

                                                    interview.difficulty === "SDE2"

                                                        ? "bg-yellow-500/15 text-yellow-400"

                                                        : interview.difficulty === "Senior"

                                                            ? "bg-red-500/15 text-red-400"

                                                            : "bg-blue-500/15 text-blue-400"

                                                }

                                            `}

                                            >

                                                {interview.difficulty}

                                            </span>

                                        </div>

                                        {/* Status */}

                                        <div className="col-span-2">

                                            <span

                                                className={`rounded-full px-3 py-1 text-xs

                                                ${

                                                    interview.status === "COMPLETED"

                                                        ? "bg-green-500/15 text-green-400"

                                                        : "bg-yellow-500/15 text-yellow-400"

                                                }

                                            `}

                                            >

                                                {interview.status}

                                            </span>

                                        </div>

                                        {/* Score */}

                                        <div className="col-span-1 text-center">

                                            <span className="font-bold text-[#F5B301]">

                                                {

                                                    interview.overall_score ??

                                                    "--"

                                                }

                                            </span>

                                        </div>

                                        {/* Date */}

                                        <div className="col-span-2 flex items-center justify-end gap-3">

                                            <span className="text-sm text-gray-500">

                                                {

                                                    interview.completed_at

                                                        ? new Date(

                                                            interview.completed_at

                                                        ).toLocaleDateString(

                                                            "en-IN",

                                                            {

                                                                day: "2-digit",

                                                                month: "short",

                                                                year: "numeric"

                                                            }

                                                        )

                                                        : "--"

                                                }

                                            </span>

                                            <ArrowRight

                                                size={17}

                                                className="text-gray-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#F5B301]"

                                            />

                                        </div>

                                    </button>

                                ))

                        }

                    </div>

                )

            }

        </div>

    );

}