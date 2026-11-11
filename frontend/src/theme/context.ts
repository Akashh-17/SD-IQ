import { createContext, useContext } from "react";
import { currentTheme, type Theme } from "./theme";

export interface ThemeState { theme: Theme; setTheme: (theme: Theme) => void; toggleTheme: () => void; }
export const ThemeContext = createContext<ThemeState | null>(null);

// Outside a provider (isolated tests, previews) fall back to the document's theme
export function useTheme(): ThemeState {
    return useContext(ThemeContext) ?? { theme: typeof document === "undefined" ? "dark" : currentTheme(), setTheme: () => {}, toggleTheme: () => {} };
}
