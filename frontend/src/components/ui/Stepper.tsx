import { useReducedMotion } from "../../motion/useReducedMotion";
import { useId } from "react";
import { Check, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import Button from "./Button";

export interface Step { id: string; label: string; description?: string; }
export interface StepperProps {
    steps: Step[];
    activeStep: number;
    onStepChange?: (step: number) => void;
    playing?: boolean;
    onPlayingChange?: (playing: boolean) => void;
    label?: string;
}

export function Stepper({ steps, activeStep, onStepChange, playing = false, onPlayingChange, label = "Interview steps" }: StepperProps) {
    const id = useId();
    const reduced = useReducedMotion();
    return <div>
        <div className="flex items-center justify-between gap-3">
            <ol aria-label={label} className="flex min-w-0 flex-1 flex-wrap gap-x-5 gap-y-4">
                {steps.map((step, index) => {
                    const active = index === activeStep;
                    const content = <>
                        <span className={clsx("relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]", active ? "border-accent text-accent" : "border-border text-muted")}>
                            {active && <motion.span layoutId={`${id}-step`} aria-hidden="true" className="absolute inset-0 rounded-full bg-accent/10" transition={{ duration: reduced ? 0 : 0.3 }} />}
                            {index < activeStep ? <><Check size={13} aria-hidden="true" /><span className="sr-only">{String(index + 1).padStart(2, "0")}</span></> : String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-left"><span className={clsx("block text-xs font-medium", active ? "text-text" : "text-muted")}>{step.label}</span>{step.description && <span className="mt-0.5 block font-mono text-[10px] text-muted">{step.description}</span>}</span>
                    </>;
                    return <li key={step.id} aria-current={active ? "step" : undefined}>
                        {onStepChange ? <button type="button" onClick={() => onStepChange(index)} className="flex min-h-11 items-center gap-2 rounded-control"><span className="sr-only">Step </span>{content}</button> : <div className="flex min-h-11 items-center gap-2">{content}</div>}
                    </li>;
                })}
            </ol>
            {onPlayingChange && <Button variant="secondary" size="icon" aria-label={playing ? "Pause step animation" : "Play step animation"} aria-pressed={playing} onClick={() => onPlayingChange(!playing)}>
                {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            </Button>}
        </div>
    </div>;
}

export default Stepper;
