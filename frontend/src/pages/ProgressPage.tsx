import {
    BrainCircuit,
    CheckCircle2,
    Sparkles,
    Target,
    TrendingUp,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";

export default function ProgressPage() {

    const features = [

        "AI Skill Assessment",

        "Concept Mastery Tracking",

        "Personalized Learning Roadmap",

        "Company-specific Preparation",

    ];

    return (

        <DashboardLayout>

            <div className="relative mx-auto flex min-h-[82vh] max-w-7xl items-center justify-center overflow-hidden">

                {/* Background */}

                <div className="absolute inset-0">

                    <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-[#F5B301]/10 blur-[120px]" />

                    <div className="absolute bottom-10 left-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-[120px]" />

                    <div className="absolute right-10 top-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-[120px]" />

                </div>

                {/* Blur Overlay */}

                <div className="absolute inset-0 backdrop-blur-sm" />

                {/* Card */}

                <div
                    className="
                        relative
                        w-full
                        max-w-3xl
                        rounded-3xl
                        border
                        border-white/10
                        bg-[#101114]/80
                        p-12
                        shadow-2xl
                    "
                >

                    <div className="flex justify-center">

                        <div
                            className="
                                flex
                                h-20
                                w-20
                                items-center
                                justify-center
                                rounded-2xl
                                bg-[#F5B301]/10
                            "
                        >

                            <BrainCircuit

                                size={42}

                                className="text-[#F5B301]"

                            />

                        </div>

                    </div>

                    <div className="mt-8 text-center">

                        <span
                            className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-full
                                border
                                border-[#F5B301]/30
                                bg-[#F5B301]/10
                                px-4
                                py-1.5
                                text-sm
                                font-medium
                                text-[#F5B301]
                            "
                        >

                            <Sparkles size={15} />

                            Coming Soon

                        </span>

                        <h1 className="mt-6 text-4xl font-bold text-white">

                            AI Progress Tracking

                        </h1>

                        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-400">

                            Track your interview growth, discover weak system
                            design concepts, and receive personalized learning
                            recommendations powered by AI.

                        </p>

                    </div>

                    <div className="mt-12 grid gap-4 md:grid-cols-2">

                        {

                            features.map((feature) => (

                                <div
                                    key={feature}
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                        rounded-xl
                                        border
                                        border-white/10
                                        bg-black/20
                                        p-4
                                    "
                                >

                                    <CheckCircle2

                                        size={18}

                                        className="text-[#F5B301]"

                                    />

                                    <span className="text-gray-300">

                                        {feature}

                                    </span>

                                </div>

                            ))

                        }

                    </div>

                    <div
                        className="
                            mt-10
                            flex
                            items-center
                            justify-center
                            gap-10
                            border-t
                            border-white/10
                            pt-8
                            text-gray-500
                        "
                    >

                        <div className="flex items-center gap-2">

                            <TrendingUp size={18} />

                            <span className="text-sm">

                                Performance Insights

                            </span>

                        </div>

                        <div className="flex items-center gap-2">

                            <Target size={18} />

                            <span className="text-sm">

                                Goal Tracking

                            </span>

                        </div>

                        <div className="flex items-center gap-2">

                            <BrainCircuit size={18} />

                            <span className="text-sm">

                                AI Coaching

                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </DashboardLayout>

    );

}