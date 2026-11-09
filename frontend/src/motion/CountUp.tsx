import { useReducedMotion } from "./useReducedMotion";
import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";

export interface CountUpProps {
    value: number;
    decimals?: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
}

export function CountUp({ value, decimals = 0, duration = 0.9, suffix = "", prefix = "", className }: CountUpProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const visible = useInView(ref, { once: true });
    const reduced = useReducedMotion();
    const count = useMotionValue(0);
    const display = useTransform(count, current => `${prefix}${current.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`);
    useEffect(() => {
        if (!visible) return;
        const control = animate(count, value, { duration: reduced ? 0 : duration, ease: "easeOut" });
        return () => control.stop();
    }, [count, duration, reduced, value, visible]);
    return <span ref={ref} className={className}>
        <span className="sr-only">{prefix}{value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
        <motion.span aria-hidden="true">{display}</motion.span>
    </span>;
}
