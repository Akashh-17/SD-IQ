import {
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    CircleDot,
    Trophy,
} from "lucide-react";

interface Interview {
    id: string;
    interview_id: string;
    title: string;
    difficulty: string;
    status: string;
    overall_score: number | null;
    completed_at: string | null;
}

interface Props {
    interview: Interview;
    onClick: () => void;
}

export default function InterviewCard({
    interview,
    onClick,
}: Props) {

    const completed = interview.status === "COMPLETED";

    return (

        <button
            onClick={onClick}
            className="
            group
            flex
            w-full
            items-center
            justify-between
            border-b
            border-white/5
            px-5
            py-4
            text-left
            transition
            hover:bg-white/5
            "
        >

            {/* LEFT */}

            <div className="flex flex-col">

                <h3 className="font-semibold text-white group-hover:text-amber-300">

                    {interview.title}

                </h3>

                <div className="mt-2 flex items-center gap-2 text-xs">

                    <span className="rounded-md bg-white/5 px-2 py-1 text-gray-300">

                        {interview.difficulty}

                    </span>

                    <span
                        className={`
                        flex
                        items-center
                        gap-1
                        rounded-md
                        px-2
                        py-1

                        ${
                            completed
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-yellow-500/10 text-yellow-300"
                        }
                        `}
                    >

                        {

                            completed
                                ? <CheckCircle2 size={12}/>
                                : <CircleDot size={12}/>

                        }

                        {completed ? "Completed" : "In Progress"}

                    </span>

                </div>

            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-8">

                <div className="flex items-center gap-2 text-xs text-gray-500">

                    <CalendarDays size={14}/>

                    {

                        interview.completed_at
                            ? new Date(
                                interview.completed_at
                            ).toLocaleDateString()
                            : "--"

                    }

                </div>

                <div className="flex items-center gap-2">

                    <Trophy
                        size={15}
                        className="text-amber-400"
                    />

                    <span className="font-semibold text-white">

                        {

                            interview.overall_score ?? "--"

                        }

                    </span>

                </div>

                <ArrowUpRight
                    size={18}
                    className="
                    text-gray-500
                    transition
                    group-hover:text-amber-400
                    "
                />

            </div>

        </button>

    );

}