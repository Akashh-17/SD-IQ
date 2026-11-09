import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChartNoAxesCombined, GitBranch, PencilRuler } from "lucide-react";
import { Badge, Button, Card, CodeChip, Dialog, Stepper } from "../ui";
import { Reveal } from "../../motion";

const cards = [
    { id: "stages", label: "Stages", icon: GitBranch, title: "Follow the thread.", text: "Seven stages guide the conversation, from requirements and architecture to reliability, scaling and tradeoffs. Ask questions and explain your assumptions as you go.", chip: "requirements → tradeoffs" },
    { id: "whiteboard", label: "Whiteboard", icon: PencilRuler, title: "Make your thinking visible.", text: "Connect components on the whiteboard while you talk. Your architecture becomes context for the interviewer's questions and your diagram feedback.", chip: "draw → connect → explain" },
    { id: "scoring", label: "Scoring", icon: ChartNoAxesCombined, title: "Leave with a next step.", text: "Your report brings together stage scores, strengths, gaps and diagram feedback. Use it to decide what to practice in your next session.", chip: "reflect → refine → repeat" }
];

export default function OnboardingDialog({ onDismiss, onStart }: { onDismiss: () => void; onStart: () => void }) {
    const [step, setStep] = useState(0);
    const heading = useRef<HTMLHeadingElement>(null);
    const card = cards[step];
    const Icon = card.icon;
    useEffect(() => { heading.current?.focus(); }, [step]);
    return <Dialog open onClose={onDismiss} title="A quick start to SystemIQ" description="Three things to know before your first interview."
        footer={<div className="flex w-full flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={onDismiss}>Skip for now</Button>
            <div className="flex max-w-full items-center gap-2">{step > 0 && <Button variant="secondary" size="icon" aria-label="Previous onboarding step" onClick={() => setStep(current => current - 1)}><ArrowLeft size={16} aria-hidden="true" /></Button>}
                <Button className="min-w-0 !px-4 !text-xs" onClick={step === cards.length - 1 ? onStart : () => setStep(current => current + 1)}>{step === cards.length - 1 ? "Pick your first problem" : "Next"}<ArrowRight size={16} aria-hidden="true" /></Button>
            </div>
        </div>}>
        <Stepper steps={cards.map(({ id, label }) => ({ id, label }))} activeStep={step} onStepChange={setStep} label="Getting started" />
        <div className="mt-5" aria-live="polite" aria-atomic="true"><Badge mono>{step + 1} of 3</Badge></div>
        <Reveal key={card.id} className="mt-4">
            <Card className="flex min-h-[280px] flex-col items-start p-6">
                <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-card border border-accent/25 bg-accent/10 text-accent"><Icon size={22} aria-hidden="true" /></span>
                <h3 ref={heading} tabIndex={-1} className="rounded-sm text-h3 outline-none">{card.title}</h3>
                <p className="mb-5 mt-3 text-sm leading-relaxed text-muted">{card.text}</p>
                <CodeChip className="mt-auto">{card.chip}</CodeChip>
            </Card>
        </Reveal>
    </Dialog>;
}
