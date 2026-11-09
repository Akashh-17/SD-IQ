import { Search } from "lucide-react";
import { Input } from "../ui";

export default function ProblemHeader({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
    return <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="section-kicker mb-3">Choose your next challenge</p><h1 className="max-w-2xl text-h2">A problem worth thinking through.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Start with the brief. Explore the constraints. Make the architecture your own.</p></div><div className="w-full shrink-0 lg:w-72"><Input id="problem-search" label="Search challenges" icon={Search} placeholder="Search problems or concepts…" value={search} onChange={event => onSearch(event.target.value)} /></div></header>;
}
