import { useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface Props {
    icon: LucideIcon;
    title: string;
    path: string;
}

export default function SidebarItem({

    icon: Icon,

    title,

    path,

}: Props) {

    const navigate = useNavigate();

    const location = useLocation();

    const active = location.pathname === path;

    return (

        <button

            onClick={() => navigate(path)}

            className={`
                group
                relative
                flex
                w-full
                items-center
                gap-3
                rounded-lg
                px-4
                py-2.5
                transition-all

                ${active
                    ? "bg-white/5 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }
            `}
        >

            {active && (

                <div
                    className={`
        absolute
        left-0
        h-8
        w-1
        rounded-r-full
        bg-[#F5B301]
        transition-all
        duration-300

        ${active ? "opacity-100" : "opacity-0"}
    `}
                />

            )}

            <Icon

                size={18}

                className={

                    active

                        ? "text-[#F5B301]"

                        : "text-gray-500 group-hover:text-white"

                }

            />

            <span className="text-sm font-medium">

                {title}

            </span>

        </button>

    );

}