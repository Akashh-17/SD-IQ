import { BrainCircuit } from "lucide-react";
import { Card } from "../ui";
import { Reveal } from "../../motion";
export default function ReportSummary({ summary }: { summary: string }) {
    return <Reveal className="report-reveal" delay={0.06}><Card className="p-6 sm:p-8"><div className="flex items-center gap-3"><BrainCircuit size={18} className="text-accent" aria-hidden="true" /><h2 className="text-h4">The big picture</h2></div><p className="mt-4 max-w-4xl whitespace-pre-wrap text-sm leading-[1.85] text-muted">{summary || "No overall feedback was saved for this interview."}</p></Card></Reveal>;
}
