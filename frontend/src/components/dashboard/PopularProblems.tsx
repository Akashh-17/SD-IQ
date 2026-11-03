import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProblems } from "../../services/problem.service";

export default function PopularProblems() {

    const navigate = useNavigate();

    const [problems, setProblems] = useState<any[]>([]);

    useEffect(() => {

        async function load() {

            try {

                const data = await getProblems();

                setProblems(data.slice(0, 5));

            }

            catch (err) {

                console.error(err);

            }

        }

        load();

    }, []);

    return (

        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-base p-6">

            {/* Header */}

            <div className="mb-6 flex items-center justify-between">

                <div>

                    <h2 className="text-2xl font-bold text-white">

                        Practice Problems

                    </h2>

                    <p className="mt-1 text-sm text-gray-500">

                        Pick your next interview challenge.

                    </p>

                </div>

                <button

                    onClick={() => navigate("/problems")}

                    className="text-sm font-medium text-[#F5B301] hover:underline"

                >

                    Browse All →

                </button>

            </div>

            <div className="space-y-3">

                {

                    problems.map((problem) => (

                        <button

                            key={problem.id}

                            onClick={() =>

                                navigate(

                                    `/problems/${problem.id}`

                                )

                            }

                            className="group flex w-full items-center justify-between rounded-xl border border-white/5 bg-[#111214] px-4 py-4 transition-all duration-300 hover:border-[#F5B301] hover:bg-[#17181C]"

                        >

                            <div className="flex flex-col items-start">

                                <span className="font-semibold text-white">

                                    {problem.title}

                                </span>

                                <div className="mt-2 flex items-center gap-2">

                                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">

                                        {problem.difficulty}

                                    </span>

                                    <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs text-indigo-300">

                                        {

                                            problem.category ??

                                            "System Design"

                                        }

                                    </span>

                                </div>

                            </div>

                            <div className="flex items-center gap-3">

                                <span className="text-sm font-medium text-[#F5B301]">

                                    Start

                                </span>

                                <ArrowRight

                                    size={18}

                                    className="text-[#F5B301] transition-transform duration-300 group-hover:translate-x-1"

                                />

                            </div>

                        </button>

                    ))

                }

            </div>

        </div>

    );

}