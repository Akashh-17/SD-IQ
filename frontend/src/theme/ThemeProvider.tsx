import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ThemeContext } from "./context";
import { applyTheme, currentTheme, saveTheme, type Theme } from "./theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
    // index.html already set data-theme before React loaded
    const [theme, setThemeState] = useState<Theme>(() => currentTheme());
    const setTheme = useCallback((next: Theme) => {
        applyTheme(next, { animate: true });
        saveTheme(next);
        setThemeState(next);
    }, []);
    const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);
    const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
