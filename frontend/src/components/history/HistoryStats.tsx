import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

import {
    Award,
    CheckCircle2,
    ClipboardList,
    Trophy,
} from "lucide-react";

interface Props {
    history: any[];
}

export default function HistoryStats({

    history,

}: Props) {

    const easy = history.filter(

        (i) => i.problem_difficulty === "Easy"

    ).length;

    const medium = history.filter(

        (i) => i.problem_difficulty === "Medium"

    ).length;

    const hard = history.filter(

        (i) => i.problem_difficulty === "Hard"

    ).length;

    const completed = history.filter(

        (i) => i.status === "COMPLETED"

    );

    const averageScore = completed.length

        ? (

            completed.reduce(

                (sum, item) =>

                    sum + (item.overall_score ?? 0),

                0

            ) / completed.length

        ).toFixed(1)

        : "0.0";

    const highestScore = completed.length

        ? Math.max(

            ...completed.map(

                (i) => i.overall_score ?? 0

            )

        )

        : 0;

    const chartData = [

        {

            name: "Easy",

            value: easy,

            color: "#22c55e",

        },

        {

            name: "Medium",

            value: medium,

            color: "#F5B301",

        },

        {

            name: "Hard",

            value: hard,

            color: "#ef4444",

        },

    ];

    const stats = [

        {

            title: "Completed",

            value: completed.length,

            icon: CheckCircle2,

        },

        {

            title: "Highest",

            value: `${highestScore}/10`,

            icon: Trophy,

        },

        {

            title: "Average",

            value: `${averageScore}/10`,

            icon: Award,

        },

        {

            title: "Total",

            value: history.length,

            icon: ClipboardList,

        },

    ];

    return (

        <div className="space-y-5">

            <div

                className="
                    rounded-xl
                    border
                    border-white/10
                    bg-[#101114]
                    p-5
                "

            >

                <h2 className="text-lg font-semibold text-white">

                    Problem Distribution

                </h2>

                <p className="mt-1 text-sm text-gray-500">

                    Interviews by difficulty

                </p>

                <div className="mt-4 h-52">

                    <ResponsiveContainer

                        width="100%"

                        height="100%"

                    >

                        <PieChart>

                            <Pie

                                data={chartData}

                                dataKey="value"

                                nameKey="name"

                                innerRadius={52}

                                outerRadius={74}

                                paddingAngle={3}

                            >

                                {

                                    chartData.map((entry) => (

                                        <Cell

                                            key={entry.name}

                                            fill={entry.color}

                                        />

                                    ))

                                }

                            </Pie>

                            <Tooltip />

                        </PieChart>

                    </ResponsiveContainer>

                </div>

                <div className="mt-3 space-y-3">

                    {

                        chartData.map((item) => (

                            <div

                                key={item.name}

                                className="flex items-center justify-between"

                            >

                                <div className="flex items-center gap-3">

                                    <div

                                        className="h-3 w-3 rounded-full"

                                        style={{

                                            background: item.color,

                                        }}

                                    />

                                    <span className="text-sm text-gray-400">

                                        {item.name}

                                    </span>

                                </div>

                                <span className="font-semibold text-white">

                                    {item.value}

                                </span>

                            </div>

                        ))

                    }

                </div>

            </div>

            <div

                className="
                    rounded-xl
                    border
                    border-white/10
                    bg-[#101114]
                "

            >

                {

                    stats.map((item, index) => {

                        const Icon = item.icon;

                        return (

                            <div

                                key={item.title}

                                className={`
                                    flex
                                    items-center
                                    justify-between
                                    px-5
                                    py-4
                                    ${

                                        index !== stats.length - 1

                                            ? "border-b border-white/10"

                                            : ""

                                    }
                                `}

                            >

                                <div className="flex items-center gap-3">

                                    <div

                                        className="
                                            flex
                                            h-9
                                            w-9
                                            items-center
                                            justify-center
                                            rounded-lg
                                            bg-white/5
                                        "

                                    >

                                        <Icon

                                            size={16}

                                            className="text-[#F5B301]"

                                        />

                                    </div>

                                    <span className="text-sm text-gray-400">

                                        {item.title}

                                    </span>

                                </div>

                                <span className="text-lg font-semibold text-white">

                                    {item.value}

                                </span>

                            </div>

                        );

                    })

                }

            </div>

        </div>

    );

}