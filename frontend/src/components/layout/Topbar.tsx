import { Cpu, Bell } from "lucide-react";

export default function Topbar() {

    const hour = new Date().getHours();

    const greeting =
        hour < 12
            ? "Good Morning ☀️"
            : hour < 18
            ? "Good Afternoon 🌤️"
            : "Good Evening 🌙";

    return (
        <div className="flex items-center justify-between">

            <div>

                <h1 className="text-4xl font-bold text-white">
                    {greeting}
                </h1>

                <p className="mt-2 text-gray-400">
                    Ready to think like a Senior Engineer?
                </p>

            </div>

            <div className="flex items-center gap-4">

                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3">

                    <Cpu
                        size={18}
                        className="text-emerald-400"
                    />

                    <div>

                        <p className="text-sm text-emerald-300">
                            AI Engine
                        </p>

                        <p className="text-xs text-gray-400">
                            Online
                        </p>

                    </div>

                </div>

                <button className="rounded-2xl bg-[#111827] p-4 hover:bg-[#1E293B] transition">

                    <Bell
                        size={20}
                        className="text-gray-300"
                    />

                </button>

            </div>

        </div>
    );
}