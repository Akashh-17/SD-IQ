import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Card, CodeChip } from "../ui";

export default function DeferredSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    const target = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(() => typeof IntersectionObserver === "undefined");
    useEffect(() => {
        if (ready || !target.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setReady(true); observer.disconnect(); }
        }, { rootMargin: "300px 0px" });
        observer.observe(target.current);
        return () => observer.disconnect();
    }, [ready]);
    const placeholder = <div className={`landing-container landing-deferred-placeholder landing-deferred-${id}`} role="status" aria-label={`Loading ${title}`}>
        <p className="section-kicker mb-5">{title}</p><Card className="flex min-h-72 items-center justify-center"><CodeChip>Preparing the preview…</CodeChip></Card>
    </div>;
    return <div id={id} ref={target} tabIndex={-1} onFocus={() => setReady(true)} className="landing-deferred-slot outline-none">
        {ready ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}
    </div>;
}
