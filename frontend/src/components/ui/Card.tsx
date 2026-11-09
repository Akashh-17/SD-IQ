import { forwardRef, type HTMLAttributes } from "react";
import clsx from "clsx";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card({ className, children, ...props }, ref) {
    return <div ref={ref} className={clsx("card", className)} {...props}>{children}</div>;
});

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx("border-b border-border px-6 py-4", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx("p-6", className)} {...props} />;
}

export default Card;
