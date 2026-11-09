import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div aria-hidden="true" className={clsx("relative overflow-hidden rounded-control bg-elevated", className)} {...props}><div className="skeleton-sheen absolute inset-0" /></div>;
}

export default Skeleton;
