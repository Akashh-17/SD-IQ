// Theme state lives on <html data-theme="light|dark">. index.html applies the
// saved choice before first paint (no flash); this module keeps it in sync.
export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "systemiq-theme";
export const THEME_COLORS: Record<Theme, string> = { dark: "#0b110e", light: "#f6f8f4" };

export function storedTheme(): Theme | null {
    try {
        const value = localStorage.getItem(THEME_STORAGE_KEY);
        return value === "light" || value === "dark" ? value : null;
    } catch { return null; }
}

export function currentTheme(): Theme {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme, { animate = false } = {}) {
    const root = document.documentElement;
    if (animate) {
        root.classList.add("theme-transition");
        window.setTimeout(() => root.classList.remove("theme-transition"), 300);
    }
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

export function saveTheme(theme: Theme) {
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* private mode: theme still applies for this visit */ }
}
