import { Boxes, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action, icon: Icon = Boxes }: { title: string; description: string; action?: ReactNode; icon?: LucideIcon }) {
    return <div className="flex flex-col items-center rounded-card border border-dashed border-border px-6 py-10 text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-card border border-border bg-elevated text-muted"><Icon size={22} aria-hidden="true" /></div>
        <h3 className="text-base font-medium">{title}</h3><p className="mt-2 max-w-xs text-sm text-muted">{description}</p>
        {action && <div className="mt-5">{action}</div>}
    </div>;
}

export default EmptyState;
