import type { CSSProperties } from "react";
import { CountUp } from "../../motion";
export default function ScoreGauge({ score }: { score: number | null }) {
    const value = score ?? 0;
    return <div className="report-gauge relative mx-auto h-52 w-52 shrink-0 sm:h-60 sm:w-60" role={score === null ? "img" : "meter"} aria-label={score === null ? "Overall score not recorded" : `Overall score: ${score} out of 10`} aria-valuemin={score === null ? undefined : 0} aria-valuemax={score === null ? undefined : 10} aria-valuenow={score ?? undefined}>
        <svg aria-hidden="true" viewBox="0 0 220 220" className="h-full w-full -rotate-90">
            <circle cx="110" cy="110" r="92" fill="none" className="stroke-elevated" strokeWidth="8" />
            {score !== null && <circle cx="110" cy="110" r="92" fill="none" className="report-score-arc stroke-accent" strokeWidth="8" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - value * 10} style={{ "--score-offset": 100 - value * 10 } as CSSProperties} />}
            <circle cx="110" cy="110" r="76" fill="none" className="stroke-border" strokeWidth="0.5" strokeDasharray="1 6" />
        </svg>
        <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center"><p className="font-mono text-[58px] leading-none tracking-[-0.08em] sm:text-[68px]">{score === null ? "—" : <CountUp value={score} decimals={Number.isInteger(score) ? 0 : 1} duration={1.05} />}</p><p className="mt-3 font-mono text-[10px] uppercase tracking-[0.13em] text-muted">out of 10</p></div>
    </div>;
}
