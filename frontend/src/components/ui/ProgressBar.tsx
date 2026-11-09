import { useReducedMotion } from "../../motion/useReducedMotion";
import { useId } from "react";
import { motion } from "framer-motion";

export function ProgressBar({ value, max = 100, label, showValue = true }: { value: number; max?: number; label: string; showValue?: boolean }) {
    const id = useId();
    const reduced = useReducedMotion();
    const limit = Number.isFinite(max) && max > 0 ? max : 100;
    const current = Number.isFinite(value) ? Math.min(limit, Math.max(0, value)) : 0;
    const percentage = Math.round(current / limit * 100);
    return <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-xs"><span id={id} className="text-muted">{label}</span>{showValue && <span aria-hidden="true" className="font-mono text-text">{percentage}%</span>}</div>
        <div role="progressbar" aria-labelledby={id} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={current} className="h-1.5 overflow-hidden rounded-full bg-elevated">
            <motion.div initial={false} animate={{ width: `${percentage}%` }} transition={{ duration: reduced ? 0 : 0.4 }} className="h-full rounded-full bg-accent" />
        </div>
    </div>;
}

export default ProgressBar;
