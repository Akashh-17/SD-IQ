import { useReducedMotion } from "../../motion/useReducedMotion";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export interface TabItem { id: string; label: string; content: ReactNode; disabled?: boolean; }
export interface TabsProps {
    items: TabItem[];
    label: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    className?: string;
}

export function Tabs({ items, label, value, defaultValue, onValueChange, className }: TabsProps) {
    const id = useId();
    const reduced = useReducedMotion();
    const [selected, setSelected] = useState(defaultValue ?? items.find(item => !item.disabled)?.id);
    const current = value ?? selected;
    const tabId = (item: string) => `${id}-tab-${item}`;
    function choose(item: string) { setSelected(item); onValueChange?.(item); }
    function navigate(event: KeyboardEvent<HTMLButtonElement>, item: string) {
        const enabled = items.filter(tab => !tab.disabled);
        const index = enabled.findIndex(tab => tab.id === item);
        let next: number;
        if (event.key === "ArrowRight") next = (index + 1) % enabled.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + enabled.length) % enabled.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = enabled.length - 1;
        else return;
        event.preventDefault();
        choose(enabled[next].id);
        document.getElementById(tabId(enabled[next].id))?.focus();
    }
    return <div className={className}>
        <div role="tablist" aria-label={label} className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-pill border border-border bg-bg p-1">
            {items.map(item => <button key={item.id} id={tabId(item.id)} role="tab" type="button"
                aria-controls={`${id}-panel-${item.id}`} aria-selected={current === item.id} tabIndex={current === item.id ? 0 : -1}
                disabled={item.disabled} onClick={() => choose(item.id)} onKeyDown={event => navigate(event, item.id)}
                className={clsx("relative isolate min-h-9 whitespace-nowrap rounded-pill px-4 text-xs font-medium transition-colors disabled:opacity-50", current === item.id ? "text-text" : "text-muted hover:text-text")}>
                {current === item.id && <motion.span layoutId={`${id}-active`} aria-hidden="true" className="absolute inset-0 -z-10 rounded-pill bg-elevated" transition={{ duration: reduced ? 0 : 0.2 }} />}
                {item.label}
            </button>)}
        </div>
        {items.map(item => <div key={item.id} role="tabpanel" id={`${id}-panel-${item.id}`} aria-labelledby={tabId(item.id)}
            hidden={current !== item.id} tabIndex={0} className="mt-5 rounded-control">{item.content}</div>)}
    </div>;
}

export default Tabs;
