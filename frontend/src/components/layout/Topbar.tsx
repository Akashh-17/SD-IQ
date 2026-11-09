import { ArrowUpRight, ChevronRight, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Tooltip from "../ui/Tooltip";

interface TopbarProps {
    title?: string;
    collapsed: boolean;
    onCollapse: () => void;
    onOpenMobile: () => void;
    preview?: boolean;
}

export default function Topbar({ title, collapsed, onCollapse, onOpenMobile, preview = false }: TopbarProps) {
    const location = useLocation();
    const pageTitles: Record<string, string> = { dashboard: "Overview", problems: "Practice", history: "Interview history", progress: "Your progress", report: "Interview report", design: "Design system" };
    const pageTitle = title ?? pageTitles[location.pathname.split("/")[1]] ?? "Workspace";
    return <header className="sticky top-0 z-30 flex h-[76px] min-w-0 items-center justify-between gap-3 border-b border-border bg-bg/95 px-4 backdrop-blur-md sm:px-8 lg:px-12">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open workspace navigation" aria-haspopup="dialog" onClick={onOpenMobile}><Menu size={19} aria-hidden="true" /></Button>
            <span className="hidden md:inline-flex"><Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="bottom"><Button variant="ghost" size="icon" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} aria-controls="workspace-sidebar" onClick={onCollapse}>{collapsed ? <PanelLeftOpen size={17} aria-hidden="true" /> : <PanelLeftClose size={17} aria-hidden="true" />}</Button></Tooltip></span>
            <div className="flex min-w-0 items-center gap-2 text-xs"><span className="hidden text-muted sm:inline">Workspace</span><ChevronRight size={12} aria-hidden="true" className="hidden text-muted sm:block" /><span className="truncate text-text">{pageTitle}</span></div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
            {preview ? <Badge mono dot tone="accent">Dev preview</Badge> : <Link to="/problems" className="inline-flex min-h-11 items-center gap-2 text-xs text-muted hover:text-text">Practice a problem<ArrowUpRight size={14} aria-hidden="true" /></Link>}
        </div>
    </header>;
}
