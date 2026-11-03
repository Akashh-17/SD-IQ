import {
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";

interface Props {

    strengths: string[];

    weaknesses: string[];

}

export default function StrengthWeakness({

    strengths,

    weaknesses,

}: Props) {

    return (

        <div className="grid gap-6 lg:grid-cols-2">

            {/* Strengths */}

            <div
                className="
                    rounded-2xl
                    border
                    border-emerald-500/20
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
                            bg-emerald-500/10
                        "
                    >

                        <CheckCircle2

                            size={20}

                            className="text-emerald-400"

                        />

                    </div>

                    <div>

                        <h2 className="text-xl font-semibold text-white">

                            Strengths

                        </h2>

                        <p className="text-sm text-gray-500">

                            Areas where you performed well.

                        </p>

                    </div>

                </div>

                <div className="mt-6 space-y-3">

                    {

                        strengths.length > 0

                            ? strengths.map((item, index) => (

                                <div

                                    key={index}

                                    className="
                                        flex
                                        items-start
                                        gap-3
                                        rounded-xl
                                        border
                                        border-white/5
                                        bg-black/20
                                        p-4
                                    "

                                >

                                    <CheckCircle2

                                        size={18}

                                        className="
                                            mt-0.5
                                            shrink-0
                                            text-emerald-400
                                        "

                                    />

                                    <span className="leading-6 text-gray-300">

                                        {item}

                                    </span>

                                </div>

                            ))

                            : (

                                <div className="text-gray-500">

                                    No strengths detected.

                                </div>

                            )

                    }

                </div>

            </div>

            {/* Weaknesses */}

            <div
                className="
                    rounded-2xl
                    border
                    border-red-500/20
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
                            bg-red-500/10
                        "
                    >

                        <AlertTriangle

                            size={20}

                            className="text-red-400"

                        />

                    </div>

                    <div>

                        <h2 className="text-xl font-semibold text-white">

                            Needs Improvement

                        </h2>

                        <p className="text-sm text-gray-500">

                            Topics to work on before your next interview.

                        </p>

                    </div>

                </div>

                <div className="mt-6 space-y-3">

                    {

                        weaknesses.length > 0

                            ? weaknesses.map((item, index) => (

                                <div

                                    key={index}

                                    className="
                                        flex
                                        items-start
                                        gap-3
                                        rounded-xl
                                        border
                                        border-white/5
                                        bg-black/20
                                        p-4
                                    "

                                >

                                    <AlertTriangle

                                        size={18}

                                        className="
                                            mt-0.5
                                            shrink-0
                                            text-red-400
                                        "

                                    />

                                    <span className="leading-6 text-gray-300">

                                        {item}

                                    </span>

                                </div>

                            ))

                            : (

                                <div className="text-gray-500">

                                    No weaknesses detected.

                                </div>

                            )

                    }

                </div>

            </div>

        </div>

    );

}