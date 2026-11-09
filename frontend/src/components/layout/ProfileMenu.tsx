import type { User as AuthUser } from "@supabase/supabase-js";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronUp, LogOut, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, signOut } from "../../services/auth.service";
import clsx from "clsx";

export default function ProfileMenu({ collapsed = false }: { collapsed?: boolean }) {
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    useEffect(() => {
        let active = true;
        getCurrentUser().then(current => { if (active) setUser(current); }).catch(() => {});
        return () => { active = false; };
    }, []);
    useEffect(() => {
        function outside(event: PointerEvent) { if (!ref.current?.contains(event.target as Node)) setOpen(false); }
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, []);
    useEffect(() => { if (open) ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus(); }, [open]);
    function close() { setOpen(false); trigger.current?.focus(); }
    function keys(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Escape") { event.preventDefault(); close(); return; }
        if (event.key === "Tab") { close(); return; }
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
        const index = items.indexOf(document.activeElement as HTMLElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
        }
    }
    const email = user?.email ?? "Guest";
    const name = email.split("@")[0];
    const initials = name.split(".").map(part => part[0]).join("").slice(0, 2).toUpperCase();
    const menuClass = "flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-xs text-muted transition-colors hover:bg-elevated hover:text-text";
    return <div ref={ref} className="relative">
        <button ref={trigger} type="button" aria-label={collapsed ? `Account menu for ${name}` : undefined} aria-expanded={open} aria-haspopup="menu"
            onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); } }}
            className={clsx("flex min-h-11 w-full items-center gap-3 rounded-control transition-colors hover:bg-elevated", collapsed ? "justify-center" : "p-2")}>
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-elevated font-mono text-xs text-text">{initials}</span>
            {!collapsed && <><span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-medium">{name}</span><span className="mt-0.5 block truncate text-[10px] text-muted">{email}</span></span><ChevronUp size={14} aria-hidden="true" className={clsx("text-muted", open && "rotate-180")} /></>}
        </button>
        {open && <div role="menu" aria-label="Account" onKeyDown={keys} className="absolute bottom-full left-0 z-50 mb-3 w-52 overflow-hidden rounded-card border border-border bg-surface py-1 shadow-floating">
            <button type="button" role="menuitem" className={menuClass} onClick={() => { close(); navigate("/profile"); }}><User size={15} aria-hidden="true" />View profile</button>
            <button type="button" role="menuitem" className={menuClass} onClick={() => { close(); navigate("/settings"); }}><Settings size={15} aria-hidden="true" />Settings</button>
            <div role="separator" className="my-1 border-t border-border" />
            <button type="button" role="menuitem" className={clsx(menuClass, "!text-danger")} onClick={async () => { await signOut(); navigate("/"); }}><LogOut size={15} aria-hidden="true" />Log out</button>
        </div>}
    </div>;
}
