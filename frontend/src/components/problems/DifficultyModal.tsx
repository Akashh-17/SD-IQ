import { X } from "lucide-react";

const levels = [

    {
        title: "SDE1",
        description: "Entry level system design interview.",
    },

    {
        title: "SDE2",
        description: "Intermediate interview with deeper discussions.",
    },

    {
        title: "Senior",
        description: "Large-scale architecture and tradeoffs.",
    },

];

interface Props {

    open: boolean;

    problem: any;

    value: string;

    loading: boolean;

    onClose: () => void;

    onChange: (value: string) => void;

    onStart: () => void;

}

export default function DifficultyModal({

    open,

    problem,

    value,

    loading,

    onClose,

    onChange,

    onStart,

}: Props) {

    if (!open)

        return null;

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#101114] p-6">

                <div className="flex items-start justify-between">

                    <div>

                        <h2 className="text-xl font-semibold text-white">

                            {problem.title}

                        </h2>

                        <p className="mt-1 text-sm text-gray-500">

                            Select interview difficulty.

                        </p>

                    </div>

                    <button

                        onClick={onClose}

                        className="rounded-lg p-2 hover:bg-white/5"

                    >

                        <X

                            size={18}

                            className="text-gray-400"

                        />

                    </button>

                </div>

                <div className="mt-8 space-y-3">

                    {

                        levels.map((level) => (

                            <button

                                key={level.title}

                                onClick={() =>

                                    onChange(level.title)

                                }

                                className={`
                                    w-full
                                    rounded-xl
                                    border
                                    p-4
                                    text-left
                                    transition

                                    ${

                                        value === level.title

                                            ? "border-[#F5B301] bg-[#F5B301]/10"

                                            : "border-white/10 hover:border-white/20"

                                    }

                                `}

                            >

                                <div className="font-semibold text-white">

                                    {level.title}

                                </div>

                                <div className="mt-1 text-sm text-gray-500">

                                    {level.description}

                                </div>

                            </button>

                        ))

                    }

                </div>

                <button

                    onClick={onStart}

                    disabled={loading}

                    className="
                        mt-8
                        w-full
                        rounded-xl
                        bg-[#F5B301]
                        py-3
                        font-semibold
                        text-black
                        transition
                        hover:brightness-110
                        disabled:opacity-60
                    "

                >

                    {

                        loading

                            ? "Starting..."

                            : "Start Interview"

                    }

                </button>

            </div>

        </div>

    );

}