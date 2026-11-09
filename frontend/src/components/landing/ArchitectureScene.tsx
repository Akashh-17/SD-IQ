import { Card } from "../ui";
import { Reveal } from "../../motion";
import { useReducedMotion } from "../../motion/useReducedMotion";
import Glyph, { type GlyphName } from "./Glyph";

const nodes: { label: string; detail: string; icon: GlyphName; x: number; y: number; phase: number }[] = [
    { label: "Client", detail: "request", icon: "client", x: 11, y: 48, phase: 0 },
    { label: "Load balancer", detail: "distribute", icon: "balance", x: 36, y: 48, phase: 1 },
    { label: "API", detail: "resolve", icon: "api", x: 61, y: 48, phase: 2 },
    { label: "Cache", detail: "fast path", icon: "cache", x: 87, y: 17, phase: 3 },
    { label: "Database", detail: "durable", icon: "database", x: 87, y: 48, phase: 3 },
    { label: "Queue", detail: "async work", icon: "queue", x: 87, y: 79, phase: 3 }
];
const lines = [
    { x: 20, y: 48, length: 7, phase: 1 }, { x: 45, y: 48, length: 7, phase: 2 },
    { x: 70, y: 48, length: 8, phase: 3 }, { x: 75, y: 17, length: 3, phase: 3 },
    { x: 75, y: 79, length: 3, phase: 3 }
];

export default function ArchitectureScene({ phase = 4, flowing = false, compact = false }: { phase?: number; flowing?: boolean; compact?: boolean }) {
    const reduced = useReducedMotion();
    return <div className={`landing-architecture ${compact ? "landing-architecture--compact" : ""}`} role="img" aria-label="Example architecture: a client sends requests through a load balancer and API to a cache, durable database and asynchronous queue.">
        <div className="absolute inset-0" aria-hidden="true">
            {lines.map((line, index) => <Reveal key={index} initial={false} whileInView={undefined}
                animate={{ opacity: phase >= line.phase ? 1 : 0, scaleX: phase >= line.phase ? 1 : 0 }}
                transition={{ duration: reduced ? 0 : 0.45 }}
                className="landing-wire" style={{ left: `${line.x}%`, top: `${line.y}%`, width: `${line.length}%`, transformOrigin: "left" }}>
                {flowing && !reduced && <span className="landing-packet" style={{ animationDelay: `${index * 0.17}s` }} />}
            </Reveal>)}
            <Reveal initial={false} whileInView={undefined} animate={{ opacity: phase >= 3 ? 1 : 0, scaleY: phase >= 3 ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.5 }} className="landing-wire-vertical" />
            {nodes.map(node => <Reveal key={node.label} initial={false} whileInView={undefined}
                animate={{ opacity: phase >= node.phase ? 1 : 0, y: phase >= node.phase ? 0 : 10, scale: phase >= node.phase ? 1 : 0.92 }}
                transition={{ duration: reduced ? 0 : 0.4 }} className="landing-diagram-node" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                <Card className={`landing-node-card ${node.label === "API" ? "!border-accent/60 !bg-elevated text-accent" : "text-muted"}`}>
                    <Glyph name={node.icon} size={compact ? 18 : 23} />
                    <span className="landing-node-label text-text">{node.label}</span>
                    <span className="landing-node-detail">{node.detail}</span>
                </Card>
            </Reveal>)}
        </div>
    </div>;
}
