import { Search } from "lucide-react";

interface Props {
    search: string;
    onSearch: (value: string) => void;
}

export default function ProblemHeader({

    search,

    onSearch,

}: Props) {

    return (

        <div className="flex items-center justify-between">

            <div>

                <h1 className="text-2xl font-bold text-white">

                    Practice Problems

                </h1>

                <p className="mt-1 text-sm text-gray-500">

                    Choose a system design problem and start an AI interview.

                </p>

            </div>

            <div className="relative w-72">

                <Search

                    size={16}

                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"

                />

                <input

                    value={search}

                    onChange={(e) => onSearch(e.target.value)}

                    placeholder="Search"

                    className="
                        h-10
                        w-full
                        rounded-lg
                        border
                        border-white/10
                        bg-[#101114]
                        pl-10
                        pr-3
                        text-sm
                        text-white
                        outline-none
                        transition
                        focus:border-[#F5B301]
                    "

                />

            </div>

        </div>

    );

}