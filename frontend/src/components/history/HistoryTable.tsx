import {
    ArrowUpRight,
    CheckCircle2,
    Clock3,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

interface Props {

    history: any[];

}

export default function HistoryTable({

    history,

}: Props) {

    const navigate = useNavigate();

    return (

        <div
            className="
                h-fit
                overflow-hidden
                rounded-xl
                border
                border-white/10
                bg-[#101114]
            "
        >

            <div
                className="
                    grid
                    grid-cols-12
                    border-b
                    border-white/10
                    px-6
                    py-4
                    text-xs
                    font-medium
                    uppercase
                    tracking-wider
                    text-gray-500
                "
            >

                <div className="col-span-5">

                    Problem

                </div>

                <div className="col-span-2">

                    Difficulty

                </div>

                <div className="col-span-2">

                    Score

                </div>

                <div className="col-span-2">

                    Status

                </div>

                <div className="col-span-1" />

            </div>

            {

                history.length === 0 && (

                    <div className="py-16 text-center text-gray-500">

                        No interviews found.

                    </div>

                )

            }

            {

                history.map((item) => (

                    <button

                        key={item.id}

                        onClick={() =>

                            navigate(

                                `/report/${item.interview_id}`

                            )

                        }

                        className="
                            grid
                            w-full
                            grid-cols-12
                            items-center
                            border-b
                            border-white/5
                            px-6
                            py-4
                            text-left
                            transition
                            hover:bg-white/5
                        "

                    >

                        <div className="col-span-5">

                            <div className="font-medium text-white">

                                {item.title}

                            </div>

                            <div className="mt-1 text-xs text-gray-500">

                                {

                                    new Date(

                                        item.completed_at

                                    ).toLocaleDateString(

                                        "en-IN",

                                        {

                                            day: "numeric",

                                            month: "short",

                                            year: "numeric",

                                        }

                                    )

                                }

                            </div>

                        </div>

                        <div className="col-span-2">

                            <span

                                className={`
                                    rounded-full
                                    px-3
                                    py-1
                                    text-xs
                                    font-medium

                                    ${

                                        item.problem_difficulty === "Easy"

                                            ? "bg-green-500/10 text-green-400"

                                            : item.problem_difficulty === "Medium"

                                                ? "bg-yellow-500/10 text-yellow-400"

                                                : "bg-red-500/10 text-red-400"

                                    }
                                `}
                            >

                                {item.problem_difficulty}

                            </span>

                        </div>

                        <div className="col-span-2">

                            <span
                                className="
                                    rounded-lg
                                    bg-[#F5B301]/10
                                    px-3
                                    py-1.5
                                    text-sm
                                    font-semibold
                                    text-[#F5B301]
                                "
                            >

                                {item.overall_score}/10

                            </span>

                        </div>

                        <div className="col-span-2">

                            {

                                item.status === "COMPLETED"

                                    ? (

                                        <div className="flex items-center gap-2">

                                            <CheckCircle2

                                                size={16}

                                                className="text-green-400"

                                            />

                                            <span className="text-sm text-green-400">

                                                Completed

                                            </span>

                                        </div>

                                    )

                                    : (

                                        <div className="flex items-center gap-2">

                                            <Clock3

                                                size={16}

                                                className="text-yellow-400"

                                            />

                                            <span className="text-sm text-yellow-400">

                                                Active

                                            </span>

                                        </div>

                                    )

                            }

                        </div>

                        <div className="flex justify-end">

                            <ArrowUpRight

                                size={18}

                                className="
                                    text-gray-500
                                    transition
                                    group-hover:text-white
                                "

                            />

                        </div>

                    </button>

                ))

            }

        </div>

    );

}