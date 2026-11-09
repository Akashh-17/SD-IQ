import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog } from "../ui";
import Glyph, { LandingBrand } from "./Glyph";

const links = [{ label: "How it works", href: "#how-it-works" }, { label: "Live preview", href: "#live-interview" }, { label: "Problems", href: "#problems" }, { label: "FAQ", href: "#faq" }];

export default function Navbar() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    return <>
        <header className="landing-header">
            <div className="landing-container flex h-20 items-center justify-between gap-6">
                <a href="/" aria-label="SystemIQ home"><LandingBrand /></a>
                <nav aria-label="Main navigation" className="landing-nav hidden items-center text-xs text-muted lg:flex">{links.map(link => <a key={link.href} href={link.href} className="inline-flex items-center hover:text-text">{link.label}</a>)}</nav>
                <div className="hidden items-center gap-2 sm:flex"><Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign in</Button><Button size="sm" onClick={() => navigate("/login")}>Start practicing<Glyph name="diagonal" size={13} /></Button></div>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(true)}><Glyph name="menu" size={20} /></Button>
            </div>
        </header>
        <Dialog open={open} onClose={() => setOpen(false)} title="Explore SystemIQ">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-2">{links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-control px-3 py-3 text-sm text-muted hover:bg-elevated hover:text-text">{link.label}</a>)}</nav>
            <Button fullWidth className="mt-5" onClick={() => navigate("/login")}>Start a mock interview<Glyph name="arrow" size={15} /></Button>
        </Dialog>
    </>;
}
