interface Props {
    history: any[];
}

export default function AnalyticsStats({

    history,

}: Props) {

    const completed = history.filter(

        (i) =>

            Number(i.overall_score) > 0

    );

    const average =

        completed.length

            ? (

                completed.reduce(

                    (sum, item) =>

                        sum + Number(item.overall_score),

                    0

                ) / completed.length

            ).toFixed(1)

            : "0.0";

    const highest =

        completed.length

            ? Math.max(

                ...completed.map(

                    (i) => Number(i.overall_score)

                )

            )

            : 0;

    const cards = [

        {

            title: "Total Interviews",

            value: history.length,

        },

        {

            title: "Completed",

            value: completed.length,

        },

        {

            title: "Average Score",

            value: `${average}/10`,

        },

        {

            title: "Highest Score",

            value: `${highest}/10`,

        },

    ];

    return (

        <div className="grid grid-cols-2 gap-4">

            {

                cards.map((card) => (

                    <div

                        key={card.title}

                        className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-[#101114]
                        p-5
                        transition
                        hover:border-[#F5B301]/40
                    "

                    >

                        <p className="text-xs uppercase tracking-wider text-gray-500">

                            {card.title}

                        </p>

                        <h2 className="mt-3 text-3xl font-bold text-white">

                            {card.value}

                        </h2>

                    </div>

                ))

            }

        </div>

    );

}