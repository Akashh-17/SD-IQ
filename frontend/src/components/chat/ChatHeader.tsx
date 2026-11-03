import {
    Bot,
    CircleDot,
} from "lucide-react";

export default function ChatHeader() {

    return (

        <div
            className="
                flex
                items-center
                justify-between
                border-b
                border-white/10
                bg-[#101114]
                px-6
                py-4
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
                        rounded-full
                        bg-[#F5B301]/10
                    "
                >

                    <Bot
                        className="text-[#F5B301]"
                        size={20}
                    />

                </div>

                <div>

                    <h2 className="font-semibold text-white">

                        AI Interviewer

                    </h2>

                    <p className="text-sm text-gray-500">

                        System Design Expert

                    </p>

                </div>

            </div>

            <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1">

                <CircleDot
                    size={12}
                    className="fill-green-500 text-green-500"
                />

                <span className="text-sm text-green-400">

                    Live

                </span>

            </div>

        </div>

    );

}