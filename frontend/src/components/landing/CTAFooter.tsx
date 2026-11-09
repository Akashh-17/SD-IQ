import { useNavigate } from "react-router-dom";
import { Button, CodeChip } from "../ui";
import { Reveal } from "../../motion";
import Glyph, { LandingBrand } from "./Glyph";

export default function CTAFooter() {
    const navigate = useNavigate();
    return <>
        <section className="landing-container landing-closing" aria-label="Start practicing">
            <Reveal><p className="section-kicker mb-6">Your next great answer starts here.</p><h2 className="landing-closing-title">Make your thinking<br /><span className="text-accent">worth following.</span></h2><p className="mx-auto mb-8 mt-6 max-w-md text-sm leading-relaxed text-muted">Pick a problem. Take a breath. Build something you can explain.</p><Button size="lg" onClick={() => navigate("/login")}>Start a mock interview<Glyph name="arrow" size={17} /></Button></Reveal>
        </section>
        <footer className="landing-container landing-footer"><a href="/" aria-label="SystemIQ home"><LandingBrand /></a><p className="text-xs text-muted">A practice space for clearer thinking.</p><div className="flex items-center gap-5"><a href="#faq" className="inline-flex min-h-11 items-center text-xs text-muted hover:text-text">Questions?</a><CodeChip>think → build → repeat</CodeChip></div></footer>
    </>;
}
