import clsx from "clsx";

export default function LogoMark({ className }: { className?: string }) {
    return <span aria-hidden="true" className={clsx("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-accent/25 bg-accent/10 text-accent", className)}>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
            <path d="M6 6h12M6 6v12m0 0h12m0 0V6M6 18 18 6" stroke="currentColor" strokeWidth="1.3" />
            <rect x="3.5" y="3.5" width="5" height="5" rx="1.5" fill="rgb(var(--color-surface))" stroke="currentColor" strokeWidth="1.3" />
            <rect x="3.5" y="15.5" width="5" height="5" rx="1.5" fill="rgb(var(--color-surface))" stroke="currentColor" strokeWidth="1.3" />
            <rect x="15.5" y="15.5" width="5" height="5" rx="1.5" fill="rgb(var(--color-surface))" stroke="currentColor" strokeWidth="1.3" />
            <rect x="15" y="3" width="6" height="6" rx="2" fill="currentColor" />
        </svg>
    </span>;
}
