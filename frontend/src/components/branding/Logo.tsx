import LogoMark from "./LogoMark";

export default function Logo({ collapsed = false }: { collapsed?: boolean }) {
    return <span className="inline-flex items-center gap-2.5" aria-label="SystemIQ">
        <LogoMark />
        <span aria-hidden="true" className={collapsed ? "sr-only" : "whitespace-nowrap text-xl font-semibold tracking-[-0.055em] text-text"}>System<span className="text-accent">IQ</span><span className="text-muted">.</span></span>
    </span>;
}
