import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "./Button";
import Tooltip from "./Tooltip";
import { useTheme } from "../../theme/context";
import { useReducedMotion } from "../../motion/useReducedMotion";

export function ThemeToggle({ className = "", size = "icon" }: { className?: string; size?: "icon" | "sm" }) {
    const { theme, toggleTheme } = useTheme();
    const reduced = useReducedMotion();
    const next = theme === "dark" ? "light" : "dark";
    const Icon = theme === "dark" ? Moon : Sun;
    return <Tooltip content={`Switch to ${next} mode`} side="bottom">
        <Button variant="ghost" size={size} className={className} aria-label={`Switch to ${next} mode`} aria-pressed={theme === "light"} onClick={toggleTheme}>
            <AnimatePresence mode="wait" initial={false}>
                <motion.span key={theme} className="inline-flex" initial={reduced ? false : { rotate: -60, opacity: 0, scale: 0.7 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={reduced ? undefined : { rotate: 60, opacity: 0, scale: 0.7 }} transition={{ duration: 0.18 }}>
                    <Icon size={16} aria-hidden="true" />
                </motion.span>
            </AnimatePresence>
        </Button>
    </Tooltip>;
}

export default ThemeToggle;
