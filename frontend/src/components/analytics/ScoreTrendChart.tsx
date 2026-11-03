import {

    CartesianGrid,

    Line,

    LineChart,

    ResponsiveContainer,

    Tooltip,

    XAxis,

    YAxis,

} from "recharts";

interface Props {

    history: any[];

}

export default function ScoreTrendChart({

    history,

}: Props) {

    const data = history

        .filter(

            (i) =>

                Number(i.overall_score) > 0

        )

        .sort(

            (a, b) =>

                new Date(a.completed_at).getTime()

                -

                new Date(b.completed_at).getTime()

        )

        .map((item) => ({

            date: new Date(

                item.completed_at

            ).toLocaleDateString(

                "en-IN",

                {

                    day: "numeric",

                    month: "short",

                }

            ),

            score: Number(

                item.overall_score

            ),

            title: item.title,

        }));

    return (

        <div className="rounded-2xl border border-white/10 bg-[#101114] p-6">

            <div className="mb-8 flex items-center justify-between">

                <div>

                    <h2 className="text-2xl font-bold text-white">

                        Performance Trend

                    </h2>

                    <p className="mt-2 text-sm text-gray-500">

                        Score progression across completed interviews.

                    </p>

                </div>

                <div className="rounded-full bg-[#F5B301]/10 px-3 py-1 text-sm text-[#F5B301]">

                    {data.length} Interviews

                </div>

            </div>

            {

                data.length === 0 ? (

                    <div className="flex h-80 items-center justify-center text-gray-500">

                        Complete an interview to see your analytics.

                    </div>

                ) : (

                    <div className="h-[300px]">

                        <ResponsiveContainer

                            width="100%"

                            height="100%"

                        >

                            <LineChart

                                data={data}

                            >

                                <CartesianGrid

                                    stroke="#252525"

                                    vertical={false}

                                />

                                <XAxis

                                    dataKey="date"

                                    stroke="#777"

                                />

                                <YAxis

                                    domain={[0, 10]}

                                    stroke="#777"

                                />

                                <Tooltip

                                    formatter={(value) => [

                                        `${value}/10`,

                                        "Score",

                                    ]}

                                    labelFormatter={(_, payload) =>

                                        payload?.[0]?.payload?.title

                                    }

                                    contentStyle={{

                                        background: "#111",

                                        border: "1px solid #333",

                                        borderRadius: 12,

                                    }}

                                />

                                <Line

                                    type="monotone"

                                    dataKey="score"

                                    stroke="#F5B301"

                                    strokeWidth={3}

                                    dot={{

                                        fill: "#F5B301",

                                        r: 5,

                                    }}

                                    activeDot={{

                                        r: 7,

                                    }}

                                />

                            </LineChart>

                        </ResponsiveContainer>

                    </div>

                )

            }

        </div>

    );

}