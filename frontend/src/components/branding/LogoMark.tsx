import { Network } from "lucide-react";

export default function LogoMark() {
    return (
        <div
            className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-xl
                bg-[#F5B301]
            "
        >
            <Network
                size={18}
                strokeWidth={2}
                className="text-black"
            />
        </div>
    );
}