import {
    Boxes,
    CircleDot,
} from "lucide-react";

interface Props {

    nodes: number;

}

export default function DiagramHeader({

    nodes,

}: Props) {

    return (

        <div
            className="
                flex
                h-10
                items-center
                justify-between
                border-b
                border-white/10
                bg-[#101114]
                px-4
                shrink-0
            "
        >

            {/* Left */}

            <div className="flex items-center gap-3">

                <Boxes

                    size={15}

                    className="text-[#F5B301]"

                />

                <span className="text-sm font-medium text-white">

                    Architecture Canvas

                </span>

            </div>

            {/* Right */}

            <div className="flex items-center gap-4 text-xs">

                <span className="text-gray-500">

                    {nodes} Components

                </span>

                <div className="h-4 w-px bg-white/10" />

                <div className="flex items-center gap-1.5">

                    <CircleDot

                        size={9}

                        className="fill-green-500 text-green-500"

                    />

                    <span className="text-green-400">

                        Autosaved

                    </span>

                </div>

            </div>

        </div>

    );

}