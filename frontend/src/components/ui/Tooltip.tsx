import { cloneElement, useId, useState, type ReactElement, type HTMLAttributes } from "react";
import clsx from "clsx";

interface TooltipProps {
    content: string;
    children: ReactElement<HTMLAttributes<HTMLElement>>;
    side?: "top" | "bottom";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
    const id = useId();
    const [open, setOpen] = useState(false);
    return <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
        {cloneElement(children, { "aria-describedby": [children.props["aria-describedby"], open && id].filter(Boolean).join(" ") || undefined })}
        {open && <span id={id} role="tooltip" className={clsx("absolute left-1/2 z-50 w-max max-w-64 -translate-x-1/2 rounded-control border border-border bg-elevated px-3 py-2 text-xs text-text shadow-floating", side === "top" ? "bottom-full mb-2" : "top-full mt-2")}>{content}</span>}
    </span>;
}

export default Tooltip;
