import {
    ArrowUpRight,
    Layers3,
} from "lucide-react";

interface Props {
    problem: any;
    selected: boolean;
    onSelect: () => void;
}

export default function ProblemCard({

    problem,

    selected,

    onSelect,

}: Props) {

    return (

        <button

            onClick={onSelect}

            className={`
                group
                w-full
                rounded-xl
                border
                p-4
                text-left
                transition-all
                duration-200

                ${
                    selected

                        ? "border-[#F5B301] bg-[#161616] shadow-[0_0_0_1px_rgba(245,179,1,.15)]"

                        : "border-white/10 bg-[#101114] hover:border-white/20"
                }
            `}

        >

            <div className="flex items-start justify-between">

                <div className="flex items-start gap-3">

                    <div
                        className="
                            mt-0.5
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-lg
                            bg-[#F5B301]/10
                            text-[#F5B301]
                        "
                    >

                        <Layers3 size={18} />

                    </div>

                    <div>

                        <h2 className="text-base font-semibold text-white">

                            {problem.title}

                        </h2>

                        <p className="mt-1 text-sm text-gray-500">

                            {problem.category ?? "System Design"}

                        </p>

                        <span
                            className="
                                mt-3
                                inline-flex
                                rounded-md
                                bg-white/5
                                px-2.5
                                py-1
                                text-xs
                                text-gray-400
                            "
                        >

                            AI Interview

                        </span>

                    </div>

                </div>

                <ArrowUpRight
                    size={18}
                    className={`
                        transition

                        ${
                            selected

                                ? "text-[#F5B301]"

                                : "text-gray-600 group-hover:text-white"
                        }
                    `}
                />

            </div>

        </button>

    );

}