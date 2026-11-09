import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";

beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("collapses the sidebar while retaining labelled navigation and an active route", () => {
    render(<MemoryRouter initialEntries={["/dashboard"]}><DashboardLayout preview><h1>Dashboard content</h1></DashboardLayout></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "Practice" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "workspace-main");
});

it("opens mobile navigation in a labelled dialog and closes after a route is selected", () => {
    render(<MemoryRouter><DashboardLayout preview><h1>Content</h1></DashboardLayout></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Open workspace navigation" }));
    const dialog = screen.getByRole("dialog", { name: "Workspace navigation" });
    const link = dialog.querySelector<HTMLAnchorElement>('a[href="/problems"]');
    expect(link).not.toBeNull();
    fireEvent.click(link!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
