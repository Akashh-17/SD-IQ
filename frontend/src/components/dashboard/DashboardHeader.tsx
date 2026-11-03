import { useEffect, useState } from "react";
import { getCurrentUser } from "../../services/auth.service";
import { useNavigate } from "react-router-dom";

export default function DashboardHeader() {

    const navigate = useNavigate();

    const [name, setName] = useState("Engineer");

    useEffect(() => {

        async function loadUser() {

            const user = await getCurrentUser();

            if (user?.email) {

                const username = user.email.split("@")[0];

                setName(

                    username.charAt(0).toUpperCase() +

                    username.slice(1)

                );

            }

        }

        loadUser();

    }, []);

    const hour = new Date().getHours();

    let greeting = "Good Evening";

    if (hour < 12)

        greeting = "Good Morning";

    else if (hour < 18)

        greeting = "Good Afternoon";

    return (

        <div className="flex items-center justify-between">

            <div>

                <h1 className="text-2xl font-bold text-white">

                    {greeting},{" "}

                    <span className="text-[#F5B301]">

                        {name}

                    </span>

                    👋

                </h1>

                <p className="mt-2 text-m text-gray-400">

                    Ready for another System Design Interview?

                </p>

            </div>

            <button

                onClick={() => navigate("/problems")}

                className="rounded-xl bg-[#F5B301] px-4 py-2 font-semibold text-sm text-black transition hover:scale-105"

            >

                + New Interview

            </button>

        </div>

    );

}