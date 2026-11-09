import { useReducedMotion } from "../../motion/useReducedMotion";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import Button from "./Button";

export interface ToastProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children?: ReactNode;
    tone?: "success" | "danger";
    duration?: number;
}

export function Toast({ open, onClose, title, children, tone = "success", duration = 6000 }: ToastProps) {
    const reduced = useReducedMotion();
    const close = useRef(onClose);
    useEffect(() => { close.current = onClose; }, [onClose]);
    useEffect(() => {
        if (!open || duration === 0) return;
        const timer = window.setTimeout(() => close.current(), duration);
        return () => window.clearTimeout(timer);
    }, [duration, open]);
    const Icon = tone === "danger" ? CircleAlert : CheckCircle2;
    return createPortal(<div className="pointer-events-none fixed bottom-6 right-4 z-[80] w-[calc(100%-2rem)] max-w-sm sm:right-6" aria-live={tone === "danger" ? "assertive" : "polite"} aria-atomic="true">
        <AnimatePresence>{open && <motion.div key="toast" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 8 }} transition={{ duration: reduced ? 0 : 0.2 }}
            className="pointer-events-auto flex gap-3 rounded-card border border-border bg-elevated p-4 shadow-floating" role={tone === "danger" ? "alert" : "status"}>
            <Icon size={18} aria-hidden="true" className={clsx("mt-1 shrink-0", tone === "danger" ? "text-danger" : "text-success")} />
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p>{children && <div className="mt-1 text-xs text-muted">{children}</div>}</div>
            <Button variant="ghost" size="icon" className="-mr-2 -mt-2" aria-label="Dismiss notification" onClick={onClose}><X size={16} aria-hidden="true" /></Button>
        </motion.div>}</AnimatePresence>
    </div>, document.body);
}

export default Toast;
