import type { ReactNode } from "react";

export default function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
    return <div className="mb-9 flex flex-col justify-between gap-5 sm:mb-12 md:flex-row md:items-end">
        <div><p className="section-kicker mb-4">{eyebrow}</p><h2 className="landing-section-title">{title}</h2></div>
        {children && <p className="max-w-sm text-sm leading-relaxed text-muted">{children}</p>}
    </div>;
}
