import { useReducedMotion } from "../../motion/useReducedMotion";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface Props {
    icon: LucideIcon;
    title: string;
    path: string;
    collapsed?: boolean;
    onNavigate?: () => void;
}

export default function SidebarItem({ icon: Icon, title, path, collapsed = false, onNavigate }: Props) {
    const reduced = useReducedMotion();
    return <NavLink to={path} onClick={onNavigate} title={collapsed ? title : undefined} aria-label={collapsed ? title : undefined}
        className={({ isActive }) => clsx("group relative isolate flex min-h-11 items-center gap-3 rounded-control px-3 text-[13px] transition-colors", collapsed && "justify-center", isActive ? "text-accent" : "text-muted hover:bg-elevated hover:text-text")}>
        {({ isActive }) => <>
            {isActive && <motion.span layoutId="sidebar-active" aria-hidden="true" className="absolute inset-0 -z-10 rounded-control border border-accent/15 bg-accent/[0.07]" transition={{ duration: reduced ? 0 : 0.25 }} />}
            <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
            <span className={collapsed ? "sr-only" : "flex-1"}>{title}</span>
            {isActive && !collapsed && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />}
        </>}
    </NavLink>;
}
