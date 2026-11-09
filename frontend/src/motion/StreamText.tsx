import { useReducedMotion } from "./useReducedMotion";
import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import clsx from "clsx";

interface StreamTextProps {
    text: string;
    charactersPerSecond?: number;
    complete?: boolean;
    caret?: boolean;
    className?: string;
}

export function StreamText({ text, charactersPerSecond = 40, complete = false, caret = true, className }: StreamTextProps) {
    const reduced = useReducedMotion();
    const previous = useRef("");
    const count = useMotionValue(0);
    const characters = Array.from(text);
    const display = useTransform(count, value => characters.slice(0, Math.floor(value)).join(""));

    useEffect(() => {
        if (!text.startsWith(previous.current)) count.set(0);
        previous.current = text;
        const control = animate(count, Array.from(text).length, {
            duration: reduced || complete ? 0 : Math.max(0, Array.from(text).length - count.get()) / Math.max(1, charactersPerSecond), ease: "linear"
        });
        return () => control.stop();
    }, [charactersPerSecond, complete, count, reduced, text]);

    return <span className={className}>
        <span className="sr-only">{text}</span>
        <motion.span aria-hidden="true" className={clsx(caret && !complete && "stream-caret")}>{display}</motion.span>
    </span>;
}

export const Typewriter = StreamText;
