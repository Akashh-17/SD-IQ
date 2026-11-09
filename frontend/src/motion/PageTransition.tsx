import { useReducedMotion } from "./useReducedMotion";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageTransition({ children, transitionKey = "page", className }: { children: ReactNode; transitionKey?: string; className?: string }) {
    const reduced = useReducedMotion();
    return <AnimatePresence mode="wait" initial={false}>
        <motion.div key={transitionKey} className={className}
            initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -4 }} transition={{ duration: reduced ? 0 : 0.2 }}>
            {children}
        </motion.div>
    </AnimatePresence>;
}
