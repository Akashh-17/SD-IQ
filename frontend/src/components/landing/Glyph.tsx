import type { SVGProps } from "react";

export type GlyphName = "arrow" | "diagonal" | "down" | "play" | "pause" | "replay" | "menu" | "close" | "client" | "balance" | "api" | "cache" | "database" | "queue" | "check" | "draw" | "chat" | "chart" | "layers" | "plus";

const paths: Record<GlyphName, string> = {
    arrow: "M4 12h15m-6-6 6 6-6 6", diagonal: "M6 18 18 6M6 6h12v12", down: "M12 4v15m-6-6 6 6 6-6",
    play: "m9 5 11 7-11 7Z", pause: "M8 5v14M16 5v14", replay: "M4 10a8 8 0 1 1 1 7M4 4v6h6",
    menu: "M4 7h16M4 12h16M4 17h16", close: "m6 6 12 12M6 18 18 6",
    client: "M4 4h16v12H4ZM8 20h8m-4-4v4", balance: "M12 3v6M5 13V9h14v4M3 15h4v5H3Zm7 0h4v5h-4Zm7 0h4v5h-4Z",
    api: "M4 4h16v6H4Zm0 10h16v6H4ZM7 7h.01M7 17h.01M11 7h6m-6 10h6",
    cache: "m13 2-8 12h6l-1 8 9-13h-7Z", database: "M4 6c0-5 16-5 16 0s-16 5-16 0Zm0 0v12c0 5 16 5 16 0V6M4 12c0 5 16 5 16 0",
    queue: "M4 5h16M4 12h16M4 19h16M7 3v4m6 3v4m4 3v4", check: "m5 12 4 4L19 6",
    draw: "m4 20 4-1L20 7l-3-3L5 16Zm10-13 3 3", chat: "M4 4h16v12H9l-5 4Zm4 5h8m-8 3h5",
    chart: "M4 4v16h16M8 15v-3m4 3V7m4 8v-5", layers: "m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5", plus: "M12 5v14M5 12h14"
};

export default function Glyph({ name, size = 18, ...props }: SVGProps<SVGSVGElement> & { name: GlyphName; size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}

export function LandingBrand() {
    return <span className="inline-flex items-center gap-2.5" aria-label="SystemIQ">
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-accent/25 bg-accent/10 text-accent"><svg width="23" height="23" viewBox="0 0 24 24" fill="none"><path d="M6 6h12M6 6v12m0 0h12m0 0V6M6 18 18 6" stroke="currentColor" strokeWidth="1.3" /><path d="M4 4h4v4H4Zm0 12h4v4H4Zm12 0h4v4h-4Z" fill="rgb(var(--color-surface))" stroke="currentColor" strokeWidth="1.3" /><rect x="15" y="3" width="6" height="6" rx="2" fill="currentColor" /></svg></span>
        <span aria-hidden="true" className="text-xl font-semibold tracking-[-0.055em]">System<span className="text-accent">IQ</span><span className="text-muted">.</span></span>
    </span>;
}
