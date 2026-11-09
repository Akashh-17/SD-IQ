import { Check, LayoutDashboard, MessageSquare, Workflow } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "../../motion";
import { Card, CodeChip } from "../ui";

export default function RoomSetup({ title, level }: { title: string; level: string }) {
    return <div role="status" aria-live="polite" className="py-3"><span className="sr-only">Setting up your interview room.</span><Reveal className="mb-6 flex justify-center"><span className="flex h-16 w-16 items-center justify-center rounded-card border border-accent/30 bg-accent/10 text-accent"><Workflow size={30} strokeWidth={1.4} aria-hidden="true" /></span></Reveal><p className="text-center text-sm text-muted">A fresh canvas for your next idea.</p><div className="mt-5 flex justify-center"><CodeChip>room.prepare()</CodeChip></div>
        <Stagger className="mt-7 space-y-3">{[{ icon: Check, label: title }, { icon: MessageSquare, label: `${level} conversation` }, { icon: LayoutDashboard, label: "Your architecture whiteboard" }].map(({ icon: Icon, label }) => <StaggerItem key={label}><Card className="flex items-center gap-3 !bg-bg p-4"><Icon size={16} className="shrink-0 text-accent" aria-hidden="true" /><span className="min-w-0 break-words text-sm">{label}</span></Card></StaggerItem>)}</Stagger>
    </div>;
}
