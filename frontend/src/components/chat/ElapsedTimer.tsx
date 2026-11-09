import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { Tooltip } from "../ui";

export default function ElapsedTimer({ startedAt, onDeadline }: { startedAt?: number; onDeadline: () => void }) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
    const elapsed = typeof startedAt === "number" && Number.isFinite(startedAt) ? Math.max(0, Math.floor((now - startedAt) / 1000)) : null;
    useEffect(() => { if (elapsed !== null && elapsed >= 45 * 60) onDeadline(); }, [elapsed, onDeadline]);
    const display = elapsed === null ? "—:—" : `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
    return <Tooltip content="Elapsed time · 45-minute session"><span role="timer" aria-label={`Elapsed time ${display}`} className={`inline-flex items-center gap-1.5 rounded-pill border border-border px-3 py-2 font-mono text-[10px] ${elapsed !== null && elapsed >= 40 * 60 ? "text-warning" : "text-muted"}`}><Clock3 size={12} aria-hidden="true" />{display}</span></Tooltip>;
}
