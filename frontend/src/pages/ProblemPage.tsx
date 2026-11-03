import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import ProblemHeader from "../components/problems/ProblemHeader";
import ProblemCard from "../components/problems/ProblemCard";
import DifficultyModal from "../components/problems/DifficultyModal";

import { getProblems } from "../services/problem.service";
import { startInterview } from "../services/interview.service";

export default function ProblemPage() {

    const navigate = useNavigate();

    const [problems, setProblems] = useState<any[]>([]);

    const [selected, setSelected] = useState<any>(null);

    const [difficulty, setDifficulty] = useState("SDE1");

    const [loading, setLoading] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);

    const [search, setSearch] = useState("");

    useEffect(() => {

        loadProblems();

    }, []);

    async function loadProblems() {

        try {

            const data = await getProblems();

            setProblems(data);

        }

        catch (err) {

            console.error(err);

        }

    }

    const filteredProblems = useMemo(() => {

        return problems.filter((problem) =>

            problem.title
                .toLowerCase()
                .includes(search.toLowerCase())

        );

    }, [

        problems,

        search,

    ]);

    async function handleStart() {

        if (!selected)

            return;

        try {

            setLoading(true);

            const { interviewId } = await startInterview(

                selected.id,

                difficulty

            );

            setModalOpen(false);

            navigate(

                `/interview/${interviewId}`

            );

        }

        catch (err) {

            console.error(err);

        }

        finally {

            setLoading(false);

        }

    }

    function renderSection(

        title: string,

        color: string

    ) {

        const sectionProblems = filteredProblems.filter(

            (problem) =>

                problem.problemDifficulty === title

        );

        if (sectionProblems.length === 0)

            return null;

        return (

            <section>

                <div className="mb-4 flex items-center gap-3">

                    <div

                        className={`

                            h-2

                            w-2

                            rounded-full

                            ${color}

                        `}

                    />

                    <h2 className="text-lg font-semibold text-white">

                        {title}

                    </h2>

                </div>

                <div className="grid grid-cols-2 gap-4">

                    {

                        sectionProblems.map((problem) => (

                            <ProblemCard

                                key={problem.id}

                                problem={problem}

                                selected={

                                    selected?.id === problem.id

                                }

                                onSelect={() => {

                                    setSelected(problem);

                                    setDifficulty("SDE1");

                                    setModalOpen(true);

                                }}

                            />

                        ))

                    }

                </div>

            </section>

        );

    }

    return (

        <DashboardLayout>

            <ProblemHeader

                search={search}

                onSearch={setSearch}

            />

            <div className="mt-8 grid gap-8 lg:grid-cols-[3fr_2fr]">

                {/* LEFT */}

                <div className="space-y-10">

                    {

                        renderSection(

                            "Easy",

                            "bg-emerald-400"

                        )

                    }

                    {

                        renderSection(

                            "Medium",

                            "bg-amber-400"

                        )

                    }

                    {

                        renderSection(

                            "Hard",

                            "bg-red-400"

                        )

                    }

                </div>

                {/* RIGHT */}

                <aside

                    className="

                        sticky

                        top-8

                        h-fit

                        rounded-xl

                        border

                        border-dashed

                        border-white/10

                        bg-[#101114]

                        p-6

                    "

                >

                    <h2 className="text-lg font-semibold text-white">

                        Coming Soon

                    </h2>

                    <p className="mt-2 text-sm text-gray-500">

                        More curated interview collections and company-specific practice tracks.

                    </p>

                    <div className="mt-6 space-y-3">

                        {

                            [

                                {

                                    title: "Google Collection",

                                    desc: "Most asked Google system design interviews.",

                                },

                                {

                                    title: "Amazon Collection",

                                    desc: "Frequently asked Amazon architecture questions.",

                                },

                                {

                                    title: "Meta Collection",

                                    desc: "Social media and distributed systems.",

                                },

                                {

                                    title: "Netflix Scale",

                                    desc: "Video streaming & CDN architecture.",

                                },

                                {

                                    title: "Premium Scenarios",

                                    desc: "Large-scale production interview simulations.",

                                },

                            ].map((item) => (

                                <div

                                    key={item.title}

                                    className="rounded-lg border border-white/10 bg-black/20 p-4"

                                >

                                    <div className="font-medium text-white">

                                        {item.title}

                                    </div>

                                    <div className="mt-1 text-sm text-gray-500">

                                        {item.desc}

                                    </div>

                                </div>

                            ))

                        }

                    </div>

                </aside>

            </div>

            <DifficultyModal

                open={modalOpen}

                problem={selected}

                value={difficulty}

                loading={loading}

                onClose={() =>

                    setModalOpen(false)

                }

                onChange={setDifficulty}

                onStart={handleStart}

            />

        </DashboardLayout>

    );

}