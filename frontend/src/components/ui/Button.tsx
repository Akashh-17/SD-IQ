import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg" | "icon";
    loading?: boolean;
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
    children, loading = false, variant = "primary", size = "md", fullWidth = false,
    className, disabled, type = "button", ...props
}, ref) {
    return <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
        className={clsx("inline-flex shrink-0 items-center justify-center gap-2 rounded-pill text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60", {
            "bg-accent text-on-accent hover:bg-amber-500": variant === "primary",
            "border border-border bg-transparent text-text hover:border-muted hover:bg-elevated": variant === "secondary",
            "text-muted hover:bg-elevated hover:text-text": variant === "ghost",
            "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20": variant === "danger",
            "min-h-9 px-3.5 py-1.5 text-xs": size === "sm",
            "min-h-11 px-5 py-2.5": size === "md",
            "min-h-12 px-6 py-3": size === "lg",
            "h-11 w-11 p-0": size === "icon",
            "w-full": fullWidth
        }, className)} {...props}>
        {loading && <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />}
        {children}
    </button>;
});

export { Button };
export default Button;
