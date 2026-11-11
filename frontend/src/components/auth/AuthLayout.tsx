import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Logo from "../branding/Logo";
import AuthProductVisual from "./AuthProductVisual";
import ThemeToggle from "../ui/ThemeToggle";
import "./auth.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return <div className="auth-shell">
        <a href="#auth-main" className="skip-link">Skip to form</a>
        <section className="auth-panel" aria-label="Account access">
            <header className="auth-brand"><Link to="/" aria-label="SystemIQ home"><Logo /></Link><div className="flex items-center gap-2"><ThemeToggle /><Link to="/" className="inline-flex min-h-11 items-center text-xs text-muted hover:text-text">Back to site ↗</Link></div></header>
            <main id="auth-main" tabIndex={-1} className="auth-form-area outline-none"><div className="auth-form-content">{children}</div></main>
            <footer className="auth-panel-footer">Think in systems. Get better by building.</footer>
        </section>
        <AuthProductVisual />
    </div>;
}
