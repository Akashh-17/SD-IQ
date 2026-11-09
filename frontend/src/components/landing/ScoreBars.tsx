import { Reveal } from "../../motion";
import { useReducedMotion } from "../../motion/useReducedMotion";

// ProgressBar in T7 animates width. This local specimen uses scaleX so the
// landing preview stays on compositor-only transforms, including on mobile.
export default function ScoreBars({ compact = false }: { compact?: boolean }) {
    const reduced = useReducedMotion();
    return <div className={compact ? "space-y-4" : "space-y-5"}>
        {[{ label: "High level design", value: 8 }, { label: "Reliability", value: 6 }, { label: "Tradeoffs", value: 7 }].map((score, index) => <div key={score.label}>
            <div className="mb-2 flex justify-between gap-3 text-xs"><span className="text-muted">{score.label}</span><span className="font-mono text-text">{score.value}<span className="text-muted">/10</span></span></div>
            <div role="meter" aria-label={`${score.label} example score`} aria-valuenow={score.value} aria-valuemin={0} aria-valuemax={10} className="h-1.5 overflow-hidden rounded-full bg-border">
                <Reveal initial={reduced ? false : { scaleX: 0 }} whileInView={{ scaleX: score.value / 10 }} animate={reduced ? { scaleX: score.value / 10 } : undefined} transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : index * 0.08 }} className="h-full origin-left rounded-full bg-accent" />
            </div>
        </div>)}
    </div>;
}
