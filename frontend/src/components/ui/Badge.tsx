import type { HTMLAttributes } from "react";
import clsx from "clsx";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: "neutral" | "accent" | "success" | "warning" | "danger";
    dot?: boolean;
    mono?: boolean;
}

export function Badge({ tone = "neutral", dot = false, mono = false, className, children, ...props }: BadgeProps) {
    return <span className={clsx("inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-medium leading-none", {
        "border-border bg-elevated text-muted": tone === "neutral",
        "border-accent/25 bg-accent/10 text-accent": tone === "accent",
        "border-success/25 bg-success/10 text-success": tone === "success",
        "border-warning/25 bg-warning/10 text-warning": tone === "warning",
        "border-danger/25 bg-danger/10 text-danger": tone === "danger",
        "font-mono": mono
    }, className)} {...props}>
        {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}{children}
    </span>;
}

export function CodeChip({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
    return <code className={clsx("inline-flex rounded-md border border-border bg-bg px-2 py-1 font-mono text-[11px] text-muted", className)} {...props}>{children}</code>;
}

export const Chip = Badge;
export default Badge;
