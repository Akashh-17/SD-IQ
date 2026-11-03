import {
    CheckCircle2,
    Circle,
} from "lucide-react";

interface Props {

    stages: any;

}

export default function StageBreakdown({

    stages,

}: Props) {

    const stageEntries = Array.isArray(stages)

        ? stages

        : Object.entries(stages || {}).map(

            ([name, score]) => ({

                stage: name,

                score,

            })

        );

    function normalizeScore(value: any) {

        const num = Number(value);

        if (Number.isNaN(num))

            return 0;

        return Math.min(Math.max(num, 0), 10);

    }

    function getColor(score: number) {

        if (score >= 8)

            return "bg-emerald-400";

        if (score >= 6)

            return "bg-[#F5B301]";

        if (score >= 4)

            return "bg-orange-400";

        return "bg-red-400";

    }

    return (

        <div
            className="
                rounded-2xl
                border
                border-white/10
                bg-[#101114]
                p-6
            "
        >

            <div className="mb-8">

                <h2 className="text-2xl font-semibold text-white">

                    Stage Breakdown

                </h2>

                <p className="mt-2 text-sm text-gray-500">

                    Performance across each interview stage.

                </p>

            </div>

            {

                stageEntries.length === 0

                    ? (

                        <div className="py-10 text-center text-gray-500">

                            No stage evaluation available.

                        </div>

                    )

                    : (

                        <div className="grid gap-4 md:grid-cols-2">

                            {

                                stageEntries.map(

                                    (item: any, index: number) => {

                                        const score = normalizeScore(

                                            item.score ??

                                            item.value

                                        );

                                        return (

                                            <div

                                                key={index}

                                                className="
                                                    rounded-xl
                                                    border
                                                    border-white/5
                                                    bg-black/20
                                                    p-5
                                                "

                                            >

                                                <div className="flex items-center justify-between">

                                                    <div className="flex items-center gap-3">

                                                        {

                                                            score >= 7

                                                                ? (

                                                                    <CheckCircle2

                                                                        size={18}

                                                                        className="text-emerald-400"

                                                                    />

                                                                )

                                                                : (

                                                                    <Circle

                                                                        size={18}

                                                                        className="text-gray-500"

                                                                    />

                                                                )

                                                        }

                                                        <span className="font-medium text-white">

                                                            {

                                                                item.stage ??

                                                                item.name

                                                            }

                                                        </span>

                                                    </div>

                                                    <span className="text-lg font-bold text-white">

                                                        {score}/10

                                                    </span>

                                                </div>

                                                <div
                                                    className="
                                                        mt-5
                                                        h-2
                                                        overflow-hidden
                                                        rounded-full
                                                        bg-white/5
                                                    "
                                                >

                                                    <div

                                                        className={`
                                                            h-full
                                                            rounded-full
                                                            transition-all
                                                            ${getColor(score)}
                                                        `}

                                                        style={{

                                                            width: `${score * 10}%`

                                                        }}

                                                    />

                                                </div>

                                            </div>

                                        );

                                    }

                                )

                            }

                        </div>

                    )

            }

        </div>

    );

}