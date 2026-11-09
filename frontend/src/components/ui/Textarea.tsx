import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    hint?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, error, id, className, ...props }, ref) {
    const generated = useId();
    const fieldId = id ?? generated;
    const describedBy = [props["aria-describedby"], (error || hint) && `${fieldId}-description`].filter(Boolean).join(" ") || undefined;
    return <div className="space-y-2">
        {label && <label htmlFor={fieldId} className="block text-sm font-medium">{label}</label>}
        <textarea {...props} ref={ref} id={fieldId} rows={props.rows ?? 4}
            aria-label={props["aria-label"] ?? (label ? undefined : props.placeholder)}
            aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy}
            className={clsx("field-control min-h-28 resize-y", className)} />
        {(error || hint) && <p id={`${fieldId}-description`} className={clsx("text-xs", error ? "text-danger" : "text-muted")}>{error || hint}</p>}
    </div>;
});

export default Textarea;
