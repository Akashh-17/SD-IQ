import { useEffect, useRef, useState } from "react";
import {
    ChevronUp,
    LogOut,
    Settings,
    User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    getCurrentUser,
    signOut,
} from "../../services/auth.service";

export default function ProfileMenu() {

    const navigate = useNavigate();

    const menuRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(false);

    const [user, setUser] = useState<any>(null);

    useEffect(() => {

        async function loadUser() {

            const currentUser = await getCurrentUser();

            setUser(currentUser);

        }

        loadUser();

    }, []);

    useEffect(() => {

        function handleClickOutside(e: MouseEvent) {

            if (

                menuRef.current &&

                !menuRef.current.contains(e.target as Node)

            ) {

                setOpen(false);

            }

        }

        document.addEventListener(

            "mousedown",

            handleClickOutside

        );

        return () =>

            document.removeEventListener(

                "mousedown",

                handleClickOutside

            );

    }, []);

    async function handleLogout() {

        await signOut();

        navigate("/");

    }

    const email = user?.email ?? "Guest";

    const name = email.split("@")[0];

    const initials =

        name

            .split(".")

            .map((n: string) => n[0])

            .join("")

            .substring(0, 2)

            .toUpperCase();

    return (

        <div

            ref={menuRef}

            className="relative"

        >

            <button

                onClick={() =>

                    setOpen(

                        !open

                    )

                }

                className="flex w-full items-center gap-3 rounded-xl p-3 transition hover:bg-white/5"

            >

                <div
                    className="
        aspect-square
        h-8
        shrink-0
        flex
        items-center
        justify-center
        rounded-full
        bg-[#F5B301]
        text-xs
        font-semibold
        text-black
    "
                >
                    {initials}
                </div>

                <div className="flex-1 text-left">

                    <div className="text-sm font-semibold text-white">

                        {name}

                    </div>

                    <div className="truncate text-xs text-gray-500">

                        {email}

                    </div>

                </div>

                <ChevronUp

                    size={18}

                    className={`

                        text-gray-500

                        transition-transform

                        ${open

                            ? "rotate-180"

                            : ""

                        }

                    `}

                />

            </button>

            {

                open && (

                    <div

                        className="

                            absolute

                            bottom-16

                            left-0

                            w-full

                            overflow-hidden

                            rounded-xl

                            border

                            border-white/10

                            bg-[#111214]

                            shadow-2xl

                            animate-in

                            fade-in

                            slide-in-from-bottom-2

                        "

                    >

                        <button

                            onClick={() => {

                                navigate("/profile");

                                setOpen(false);

                            }}

                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5"

                        >

                            <User size={16} />

                            View Profile

                        </button>

                        <button

                            onClick={() => {

                                navigate("/settings");

                                setOpen(false);

                            }}

                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5"

                        >

                            <Settings size={16} />

                            Settings

                        </button>

                        <div className="border-t border-white/10" />

                        <button

                            onClick={handleLogout}

                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10"

                        >

                            <LogOut size={16} />

                            Logout

                        </button>

                    </div>

                )

            }

        </div>

    );

}