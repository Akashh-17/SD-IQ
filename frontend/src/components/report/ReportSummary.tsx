import { Brain } from "lucide-react";

interface Props {

    summary: string;

}

export default function ReportSummary({

    summary,

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

            <div className="flex items-center gap-3">

                <div
                    className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#F5B301]/10
                    "
                >

                    <Brain

                        size={20}

                        className="text-[#F5B301]"

                    />

                </div>

                <div>

                    <h2 className="text-xl font-semibold text-white">

                        AI Summary

                    </h2>

                    <p className="text-sm text-gray-500">

                        Overall assessment of your interview.

                    </p>

                </div>

            </div>

            <p
                className="
                    mt-6
                    leading-8
                    text-gray-300
                "
            >

                {summary}

            </p>

        </div>

    );

}