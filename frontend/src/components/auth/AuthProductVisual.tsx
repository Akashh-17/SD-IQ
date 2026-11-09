import { Database, Laptop, Server, Workflow } from "lucide-react";
import { Badge, Card, CodeChip } from "../ui";
import { Reveal, Stagger, StaggerItem } from "../../motion";

export default function AuthProductVisual() {
    return <aside className="auth-product" aria-label="SystemIQ practice preview">
        <div className="w-full max-w-lg">
            <p className="section-kicker mb-5">A clearer way to think.</p>
            <h2 className="text-[clamp(2.5rem,4vw,4rem)] font-medium leading-[1.06] tracking-[-0.06em]">Small decisions.<br /><span className="text-accent">Stronger systems.</span></h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">A question, a whiteboard, and the space to explain your thinking. Your next iteration starts here.</p>
            <Card className="auth-preview-canvas mt-10">
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><span className="flex items-center gap-2 font-mono text-[10px] text-muted"><Workflow size={13} aria-hidden="true" />your_next_iteration</span><Badge mono dot tone="accent">Practice space</Badge></div>
                <div className="auth-preview-diagram" role="img" aria-label="A client connects to an API, which stores data in a database.">
                    <div className="auth-preview-connections" aria-hidden="true"><Reveal delay={0.5} className="auth-preview-line" /><Reveal delay={1.1} className="auth-preview-line" /></div>
                    <div className="auth-preview-nodes" aria-hidden="true">
                        {[{ label: "Client", icon: Laptop }, { label: "API", icon: Server }, { label: "Database", icon: Database }].map(({ label, icon: Icon }, index) => <Reveal key={label} delay={index * 0.55}>
                            <Card className={`auth-preview-node ${index === 1 ? "!border-accent/40 !bg-elevated" : ""}`}><Icon size={23} aria-hidden="true" className={index === 1 ? "text-accent" : "text-muted"} /><span className="font-mono text-[10px]">{label}</span></Card>
                        </Reveal>)}
                    </div>
                </div>
                <div className="border-t border-border p-5"><p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Your AI interviewer</p><p className="text-sm leading-relaxed">“What happens when this component fails?”</p><CodeChip className="mt-3">explain_the_tradeoff</CodeChip></div>
            </Card>
            <Stagger className="mt-7 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[10px] text-muted">{["A real conversation", "Your architecture", "Useful feedback"].map(label => <StaggerItem key={label}>{label}</StaggerItem>)}</Stagger>
        </div>
    </aside>;
}
