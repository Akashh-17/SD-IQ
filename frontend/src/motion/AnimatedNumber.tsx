import { useReducedMotion } from "./useReducedMotion";
import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { CountUpProps } from "./CountUp";

export function AnimatedNumber({ value, decimals = 0, duration = 0.4, suffix = "", prefix = "", className }: CountUpProps) {
    const reduced = useReducedMotion();
    const count = useMotionValue(value);
    const display = useTransform(count, current => `${prefix}${current.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`);
    useEffect(() => {
        const control = animate(count, value, { duration: reduced ? 0 : duration, ease: "easeOut" });
        return () => control.stop();
    }, [count, duration, reduced, value]);
    return <span className={className}>
        <span className="sr-only">{prefix}{value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
        <motion.span aria-hidden="true">{display}</motion.span>
    </span>;
}
