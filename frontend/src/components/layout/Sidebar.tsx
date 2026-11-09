import { BarChart3, FileText, LayoutDashboard, Palette, Shapes } from "lucide-react";
import { LayoutGroup } from "framer-motion";
import { Link } from "react-router-dom";
import Logo from "../branding/Logo";
import SidebarItem from "./SidebarItem";
import ProfileMenu from "./ProfileMenu";
import clsx from "clsx";

export default function Sidebar({ collapsed = false, mobile = false, preview = false, onNavigate }: { collapsed?: boolean; mobile?: boolean; preview?: boolean; onNavigate?: () => void }) {
    return <aside id={mobile ? "mobile-workspace-sidebar" : "workspace-sidebar"} aria-label={mobile ? "Mobile workspace" : "Workspace sidebar"}
        className={clsx("flex-col bg-surface transition-[width] duration-200 ease-out", mobile ? "flex" : "fixed inset-y-0 left-0 z-40 hidden border-r border-border md:flex", !mobile && (collapsed ? "w-20" : "w-60"))}>
        {!mobile && <div className={clsx("flex h-[76px] items-center border-b border-border", collapsed ? "justify-center" : "px-6")}><Link to="/dashboard" aria-label="SystemIQ dashboard"><Logo collapsed={collapsed} /></Link></div>}
        <nav aria-label={mobile ? "Mobile workspace navigation" : "Workspace navigation"} className={clsx("flex-1", collapsed ? "px-3 py-7" : "px-4 py-7")}>
            {!collapsed && <p className="section-kicker mb-4 px-3">Workspace</p>}
            <LayoutGroup id={mobile ? "mobile-sidebar" : "desktop-sidebar"}>
                <div className="space-y-1.5">
                    <SidebarItem icon={LayoutDashboard} title="Overview" path="/dashboard" collapsed={collapsed} onNavigate={onNavigate} />
                    <SidebarItem icon={Shapes} title="Practice" path="/problems" collapsed={collapsed} onNavigate={onNavigate} />
                    <SidebarItem icon={FileText} title="Interview history" path="/history" collapsed={collapsed} onNavigate={onNavigate} />
                    <SidebarItem icon={BarChart3} title="Your progress" path="/progress" collapsed={collapsed} onNavigate={onNavigate} />
                    {import.meta.env.DEV && <div className="!mt-8 border-t border-border pt-5">
                        {!collapsed && <p className="section-kicker mb-3 px-3">Build with intention</p>}
                        <SidebarItem icon={Palette} title="Design system" path="/design" collapsed={collapsed} onNavigate={onNavigate} />
                    </div>}
                </div>
            </LayoutGroup>
        </nav>
        {!collapsed && !mobile && <div className="mx-6 mb-6 border-l border-border pl-3"><p className="text-xs leading-relaxed text-muted">Think in systems.<br /><span className="text-text">Get better by building.</span></p></div>}
        <div className={clsx("border-t border-border", collapsed ? "p-3" : "p-4")}>
            {preview ? <div className={clsx("flex items-center gap-3", collapsed && "justify-center")}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[10px] text-muted" aria-hidden="true">SI</span>{!collapsed && <div><p className="text-xs font-medium">Interface lab</p><p className="mt-0.5 font-mono text-[10px] text-muted">local preview / v0.1</p></div>}</div> : <ProfileMenu collapsed={collapsed} />}
        </div>
    </aside>;
}
