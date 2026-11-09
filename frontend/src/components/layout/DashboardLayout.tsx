import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Modal from "../ui/Modal";
import { PageTransition } from "../../motion/PageTransition";
import OnboardingGate from "../onboarding/OnboardingGate";

interface Props { children: ReactNode; title?: string; preview?: boolean; }

export default function DashboardLayout({ children, title, preview = false }: Props) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    return <div className="min-h-dvh bg-bg text-text">
        <a className="skip-link" href="#workspace-main">Skip to content</a>
        <Sidebar collapsed={collapsed} preview={preview} />
        <div className={clsx("min-w-0 transition-[padding] duration-200 ease-out", collapsed ? "md:pl-20" : "md:pl-60")}>
            <Topbar title={title} collapsed={collapsed} onCollapse={() => setCollapsed(value => !value)} onOpenMobile={() => setMobileOpen(true)} preview={preview} />
            <main id="workspace-main" tabIndex={-1} className="min-h-[calc(100dvh-76px)] outline-none">
                <PageTransition transitionKey={location.pathname} className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</PageTransition>
            </main>
        </div>
        <OnboardingGate enabled={!preview} />
        <Modal open={mobileOpen} onClose={() => setMobileOpen(false)} title="Workspace navigation"><Sidebar mobile preview={preview} onNavigate={() => setMobileOpen(false)} /></Modal>
    </div>;
}
