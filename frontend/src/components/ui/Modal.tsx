import { useReducedMotion } from "../../motion/useReducedMotion";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import Button from "./Button";

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
    const id = useId();
    const ref = useRef<HTMLDialogElement>(null);
    const closeRef = useRef(onClose);
    const reduced = useReducedMotion();
    useEffect(() => { closeRef.current = onClose; }, [onClose]);
    useEffect(() => {
        if (!open) return;
        const dialog = ref.current;
        const previous = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        dialog?.showModal();
        document.body.style.overflow = "hidden";
        return () => {
            dialog?.close();
            document.body.style.overflow = overflow;
            previous?.focus();
        };
    }, [open]);
    if (!open) return null;
    return createPortal(<dialog ref={ref} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
        onCancel={event => { event.preventDefault(); closeRef.current(); }}
        onKeyDown={event => {
            if (event.key !== "Tab") return;
            const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
            )).filter(control => control.getClientRects().length > 0);
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        onClick={event => { if (event.target === event.currentTarget) closeRef.current(); }}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-card border border-border bg-surface p-0 text-text shadow-floating backdrop:bg-[var(--scrim)] backdrop:backdrop-blur-sm">
        <motion.div initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduced ? 0 : 0.18 }}>
            <div className="flex items-start justify-between gap-5 border-b border-border p-6">
                <div><h2 id={`${id}-title`} className="text-h3">{title}</h2>{description && <p id={`${id}-description`} className="mt-2 text-sm text-muted">{description}</p>}</div>
                <Button variant="ghost" size="icon" aria-label="Close dialog" onClick={onClose}><X size={18} aria-hidden="true" /></Button>
            </div>
            <div className="p-6">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-border p-6">{footer}</div>}
        </motion.div>
    </dialog>, document.body);
}

export const Dialog = Modal;
export default Modal;
