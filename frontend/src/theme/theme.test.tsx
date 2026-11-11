import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { THEME_STORAGE_KEY } from "./theme";

beforeEach(() => {
    document.documentElement.dataset.theme = "dark";
    document.head.innerHTML = '<meta name="theme-color" content="#0b110e">';
    localStorage.clear();
});
afterEach(() => { cleanup(); delete document.documentElement.dataset.theme; });

it("starts from the theme index.html applied and toggles light/dark, remembering the choice", async () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    const toggle = screen.getByRole("button", { name: "Switch to light mode" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    await act(async () => { fireEvent.click(toggle); });
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#f6f8f4");

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" })); });
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#0b110e");
});

it("respects a light theme already applied before React loaded", () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(screen.getByRole("button", { name: "Switch to dark mode" }).getAttribute("aria-pressed")).toBe("true");
});
