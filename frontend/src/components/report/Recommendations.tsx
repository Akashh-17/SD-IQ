import {
    ArrowRight,
    Lightbulb,
} from "lucide-react";

interface Props {

    recommendations: string[];

}

export default function Recommendations({

    recommendations,

}: Props) {

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

                    Next Steps

                </h2>

                <p className="mt-2 text-sm text-gray-500">

                    Personalized recommendations generated from your interview.

                </p>

            </div>

            {

                recommendations?.length

                    ? (

                        <div className="grid gap-4">

                            {

                                recommendations.map(

                                    (

                                        recommendation,

                                        index

                                    ) => (

                                        <div

                                            key={index}

                                            className="
                                                group
                                                flex
                                                items-start
                                                justify-between
                                                rounded-xl
                                                border
                                                border-white/5
                                                bg-black/20
                                                p-5
                                                transition-all
                                                hover:border-[#F5B301]/40
                                                hover:bg-black/30
                                            "

                                        >

                                            <div className="flex gap-4">

                                                <div
                                                    className="
                                                        mt-1
                                                        flex
                                                        h-10
                                                        w-10
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-lg
                                                        bg-[#F5B301]/10
                                                    "
                                                >

                                                    <Lightbulb

                                                        size={18}

                                                        className="text-[#F5B301]"

                                                    />

                                                </div>

                                                <div>

                                                    <div className="font-medium text-white">

                                                        Recommendation {index + 1}

                                                    </div>

                                                    <p className="mt-2 leading-7 text-gray-400">

                                                        {recommendation}

                                                    </p>

                                                </div>

                                            </div>

                                            <ArrowRight
                                                size={18}
                                                className="
                                                    mt-1
                                                    shrink-0
                                                    text-gray-600
                                                    transition
                                                    group-hover:translate-x-1
                                                    group-hover:text-[#F5B301]
                                                "
                                            />

                                        </div>

                                    )

                                )

                            }

                        </div>

                    )

                    : (

                        <div className="py-10 text-center text-gray-500">

                            No recommendations available.

                        </div>

                    )

            }

        </div>

    );

}