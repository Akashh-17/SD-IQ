import { Search } from "lucide-react";

interface Props {
    search: string;
    setSearch: (v: string) => void;
}

export default function HistoryHeader({

    search,

    setSearch,

}: Props) {

    return (

        <div className="flex items-center justify-between">

            <div>

                <h1 className="text-2xl font-bold text-white">

                    Interview History

                </h1>

                <p className="mt-1 text-sm text-gray-500">

                    Browse and review your previous interview sessions.

                </p>

            </div>

            <div className="relative w-72">

                <Search

                    size={16}

                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"

                />

                <input

                    value={search}

                    onChange={(e) =>

                        setSearch(e.target.value)

                    }

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