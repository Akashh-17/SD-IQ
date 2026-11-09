import { forwardRef, useId, type InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: LucideIcon;
    label?: string;
    hint?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
    icon: Icon, label, hint, error, id, className, type = "text", ...props
}, ref) {
    const generated = useId();
    const fieldId = id ?? generated;
    const descriptionId = `${fieldId}-description`;
    const describedBy = [props["aria-describedby"], (error || hint) && descriptionId].filter(Boolean).join(" ") || undefined;
    return <div className="space-y-2">
        {label && <label htmlFor={fieldId} className="block text-sm font-medium text-text">{label}</label>}
        <div className="relative">
            {Icon && <Icon size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />}
            <input {...props} ref={ref} id={fieldId} type={type}
                aria-label={props["aria-label"] ?? (label ? undefined : props.placeholder)}
                aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy}
                className={clsx("field-control", Icon && "pl-11", className)} />
        </div>
        {(error || hint) && <p id={descriptionId} className={clsx("text-xs", error ? "text-danger" : "text-muted")}>{error || hint}</p>}
    </div>;
});

export { Input };
export default Input;
