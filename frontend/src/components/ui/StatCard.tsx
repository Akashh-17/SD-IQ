import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { CountUp } from "../../motion/CountUp";
import Card from "./Card";

export interface StatCardProps {
    label: string;
    value: number;
    suffix?: string;
    decimals?: number;
    detail?: string;
    icon?: LucideIcon;
    trend?: string;
}

export function StatCard({ label, value, suffix, decimals, detail, icon: Icon, trend }: StatCardProps) {
    return <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted">{label}</p>{Icon && <Icon size={16} aria-hidden="true" className="text-muted" />}</div>
        <p className="mt-5 font-mono text-3xl tracking-[-0.05em]"><CountUp value={value} decimals={decimals} suffix={suffix} /></p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">{trend && <span className="inline-flex items-center gap-1 text-success"><ArrowUpRight size={12} aria-hidden="true" />{trend}</span>}{detail && <span className="text-muted">{detail}</span>}</div>
    </Card>;
}

export default StatCard;
