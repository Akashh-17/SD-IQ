import { useReducedMotion } from "./useReducedMotion";
import { motion, type HTMLMotionProps } from "framer-motion";

interface RevealProps extends HTMLMotionProps<"div"> { delay?: number; }

export function Reveal({ children, delay = 0, ...props }: RevealProps) {
    const reduced = useReducedMotion();
    return <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={reduced ? { opacity: 1, y: 0 } : undefined}
        whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }} {...props}>{children}</motion.div>;
}
