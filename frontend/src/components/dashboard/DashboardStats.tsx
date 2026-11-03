import {
    BarChart3,
    CheckCircle2,
    Trophy,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";

interface Props {
    history: any[];
}

interface Stat {
    title: string;
    subtitle: string;
    value: string | number;
    color: string;
    icon: LucideIcon;
    iconBg: string;
}

export default function DashboardStats({

    history,

}: Props) {

    const totalInterviews = history.length;

    const completedInterviews = history.filter(

        (i) => i.status === "COMPLETED"

    ).length;

    const averageScore = totalInterviews

        ? (

            history.reduce(

                (sum, interview) =>

                    sum + (interview.overall_score ?? 0),

                0

            ) / totalInterviews

        ).toFixed(1)

        : "0.0";

    const highestScore = totalInterviews

        ? Math.max(

            ...history.map(

                (i) => i.overall_score ?? 0

            )

        )

        : 0;

    const stats: Stat[] = [

        {

            title: "Interviews",

            subtitle: "Total Interviews",

            value: totalInterviews,

            color: "text-white",

            icon: BarChart3,

            iconBg: "bg-sky-500/10 text-sky-400",

        },

        {

            title: "Completed",

            subtitle: "Finished Sessions",

            value: completedInterviews,

            color: "text-emerald-400",

            icon: CheckCircle2,

            iconBg: "bg-emerald-500/10 text-emerald-400",

        },

        {

            title: "Average Score",

            subtitle: "Overall Performance",

            value: `${averageScore}/10`,

            color: "text-[#F5B301]",

            icon: TrendingUp,

            iconBg: "bg-[#F5B301]/10 text-[#F5B301]",

        },

        {

            title: "Highest Score",

            subtitle: "Best Performance",

            value: `${highestScore}/10`,

            color: "text-indigo-400",

            icon: Trophy,

            iconBg: "bg-indigo-500/10 text-indigo-400",

        },

    ];

    return (

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            {

                stats.map((stat) => {

                    const Icon = stat.icon;

                    return (

                        <div

                            key={stat.title}

                            className="rounded-xl py-6 border border-white/10 bg-[#0F1013] p-4 transition-all duration-200 hover:border-[#F5B301]/30 hover:bg-[#F5B301]/5 hover:shadow-lg hover:shadow-white/10"

                        >

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs uppercase tracking-wider text-gray-500">

                                        {stat.title}

                                    </p>

                                    <h2 className={`mt-2 text-3xl font-bold ${stat.color}`}>

                                        {stat.value}

                                    </h2>

                                </div>

                                <div

                                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}

                                >

                                    <Icon size={20} />

                                </div>

                            </div>

                            {/* <div className="mt-5 border-t border-white/5 pt-3">

                                <p className="text-xs text-gray-500">

                                    {stat.subtitle}

                                </p>

                            </div> */}

                        </div>

                    );

                })

            }

        </div>

    );

}