import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
    return <kbd className={clsx("inline-flex min-w-6 items-center justify-center rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted shadow-[0_2px_0_rgb(var(--color-border))]", className)} {...props} />;
}

export default Kbd;
