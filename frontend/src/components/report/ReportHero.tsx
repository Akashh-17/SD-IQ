import {
    Award,
    TrendingUp,
    Target,
    Brain,
} from "lucide-react";

interface Props {
    interview: any;
    report: any;
}

export default function ReportHero({

    interview,

    report,

}: Props) {

    const score = Number(interview.overall_score ?? 0);

    const percent = Math.min((score / 10) * 100, 100);

    function getGrade() {

        if (score >= 9)

            return {

                title: "Outstanding",

                color: "text-emerald-400",

            };

        if (score >= 8)

            return {

                title: "Excellent",

                color: "text-green-400",

            };

        if (score >= 7)

            return {

                title: "Good",

                color: "text-[#F5B301]",

            };

        if (score >= 5)

            return {

                title: "Average",

                color: "text-orange-400",

            };

        return {

            title: "Needs Improvement",

            color: "text-red-400",

        };

    }

    const grade = getGrade();

    return (

        <div
            className="
                rounded-2xl
                border
                border-white/10
                bg-[#101114]
                p-8
            "
        >

            <div className="grid gap-10 lg:grid-cols-[1.5fr_340px]">

                {/* Left */}

                <div>

                    <div className="flex items-center gap-2 text-[#F5B301]">

                        <Award size={18} />

                        <span className="font-medium">

                            Overall Evaluation

                        </span>

                    </div>

                    <h2 className="mt-5 text-4xl font-bold text-white">

                        {grade.title}

                    </h2>

                    <p className="mt-4 max-w-2xl leading-7 text-gray-400">

                        {report.summary}

                    </p>

                    <div className="mt-8 grid grid-cols-3 gap-4">

                        <div
                            className="
                                rounded-xl
                                border
                                border-white/10
                                bg-black/20
                                p-5
                            "
                        >

                            <TrendingUp

                                size={18}

                                className="text-[#F5B301]"

                            />

                            <div className="mt-4 text-2xl font-bold text-white">

                                {score}/10

                            </div>

                            <div className="mt-1 text-sm text-gray-500">

                                Final Score

                            </div>

                        </div>

                        <div
                            className="
                                rounded-xl
                                border
                                border-white/10
                                bg-black/20
                                p-5
                            "
                        >

                            <Brain

                                size={18}

                                className="text-cyan-400"

                            />

                            <div className="mt-4 text-2xl font-bold text-white">

                                {report.strengths?.length ?? 0}

                            </div>

                            <div className="mt-1 text-sm text-gray-500">

                                Strengths

                            </div>

                        </div>

                        <div
                            className="
                                rounded-xl
                                border
                                border-white/10
                                bg-black/20
                                p-5
                            "
                        >

                            <Target

                                size={18}

                                className="text-red-400"

                            />

                            <div className="mt-4 text-2xl font-bold text-white">

                                {report.weaknesses?.length ?? 0}

                            </div>

                            <div className="mt-1 text-sm text-gray-500">

                                Improvements

                            </div>

                        </div>

                    </div>

                </div>

                {/* Right */}

                <div className="flex flex-col items-center justify-center">

                    <div className="relative h-52 w-52">

                        <svg
                            className="-rotate-90"
                            viewBox="0 0 200 200"
                        >

                            <circle
                                cx="100"
                                cy="100"
                                r="82"
                                stroke="#232427"
                                strokeWidth="14"
                                fill="none"
                            />

                            <circle
                                cx="100"
                                cy="100"
                                r="82"
                                stroke="#F5B301"
                                strokeWidth="14"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={515}
                                strokeDashoffset={
                                    515 -

                                    (515 * percent) / 100
                                }
                            />

                        </svg>

                        <div
                            className="
                                absolute
                                inset-0
                                flex
                                flex-col
                                items-center
                                justify-center
                            "
                        >

                            <div className="text-5xl font-bold text-white">

                                {score}

                            </div>

                            <div className="mt-1 text-sm text-gray-500">

                                out of 10

                            </div>

                        </div>

                    </div>

                    <div
                        className={`

                            mt-6

                            text-lg

                            font-semibold

                            ${grade.color}

                        `}
                    >

                        {grade.title}

                    </div>

                </div>

            </div>

        </div>

    );

}