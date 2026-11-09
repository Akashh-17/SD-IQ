import { useReducedMotion } from "./useReducedMotion";
import { motion, type HTMLMotionProps } from "framer-motion";

export function Stagger({ children, ...props }: HTMLMotionProps<"div">) {
    const reduced = useReducedMotion();
    return <motion.div initial={reduced ? false : "hidden"} animate={reduced ? "visible" : undefined} whileInView="visible" viewport={{ once: true, amount: 0.08 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : 0.075 } } }} {...props}>{children}</motion.div>;
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<"div">) {
    const reduced = useReducedMotion();
    return <motion.div variants={{ hidden: { opacity: 0, y: reduced ? 0 : 12 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: reduced ? 0 : 0.35 }} {...props}>{children}</motion.div>;
}
