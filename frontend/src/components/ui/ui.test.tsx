import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createRef, useState } from "react";
import { Button, Input, Textarea, Tabs, Tooltip, Modal, Toast, ProgressBar, Stepper, StatCard, EmptyState } from "./index";

beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); this.querySelector<HTMLElement>("button")?.focus(); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
    vi.stubGlobal("IntersectionObserver", class {
        observe() {} unobserve() {} disconnect() {}
    });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("shared controls", () => {
    it("keeps the original Button export and blocks submissions while loading", () => {
        const onClick = vi.fn();
        const ref = createRef<HTMLButtonElement>();
        render(<Button loading ref={ref} onClick={onClick}>Save</Button>);
        const button = screen.getByRole("button", { name: "Save" });
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute("aria-busy", "true");
        expect(ref.current).toBe(button);
        fireEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it("gives legacy placeholder-only inputs an accessible name and forwards native attributes", () => {
        render(<Input placeholder="Email" type="email" required autoComplete="email" />);
        expect(screen.getByRole("textbox", { name: "Email" })).toBeRequired();
        expect(screen.getByRole("textbox")).toHaveAttribute("autocomplete", "email");
    });

    it("associates input and textarea labels, errors and descriptions", () => {
        render(<><Input label="Capacity" error="Use a positive number" /><Textarea label="Notes" hint="Start with constraints" /></>);
        expect(screen.getByLabelText("Capacity")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByLabelText("Capacity")).toHaveAccessibleDescription("Use a positive number");
        expect(screen.getByLabelText("Notes")).toHaveAccessibleDescription("Start with constraints");
    });

    it("supports arrow keys, Home/End and disabled tabs with roving focus", () => {
        const changed = vi.fn();
        render(<Tabs label="Results" onValueChange={changed} items={[
            { id: "a", label: "Overview", content: "First panel" },
            { id: "b", label: "Disabled", disabled: true, content: "Hidden panel" },
            { id: "c", label: "Trace", content: "Last panel" }
        ]} />);
        const first = screen.getByRole("tab", { name: "Overview" });
        const last = screen.getByRole("tab", { name: "Trace" });
        fireEvent.keyDown(first, { key: "ArrowRight" });
        expect(last).toHaveFocus();
        expect(last).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("tabpanel")).toHaveTextContent("Last panel");
        fireEvent.keyDown(last, { key: "Home" });
        expect(first).toHaveFocus();
        fireEvent.keyDown(first, { key: "End" });
        expect(last).toHaveFocus();
        fireEvent.keyDown(last, { key: "ArrowRight" });
        expect(first).toHaveFocus();
        expect(changed).toHaveBeenCalledWith("c");
    });

    it("shows a tooltip on keyboard focus and dismisses it on Escape", () => {
        render(<Tooltip content="More detail"><Button>Help</Button></Tooltip>);
        const trigger = screen.getByRole("button", { name: "Help" });
        fireEvent.focus(trigger);
        expect(screen.getByRole("tooltip")).toHaveTextContent("More detail");
        expect(trigger).toHaveAccessibleDescription("More detail");
        fireEvent.keyDown(trigger, { key: "Escape" });
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("uses a labelled native modal, handles cancellation and restores trigger focus", () => {
        function Example() {
            const [open, setOpen] = useState(false);
            return <><Button onClick={() => setOpen(true)}>Configure</Button><Modal open={open} onClose={() => setOpen(false)} title="Configuration" description="Choose a name"><Input label="Name" /></Modal></>;
        }
        render(<Example />);
        const trigger = screen.getByRole("button", { name: "Configure" });
        trigger.focus(); fireEvent.click(trigger);
        const dialog = screen.getByRole("dialog", { name: "Configuration" });
        expect(dialog).toHaveAccessibleDescription("Choose a name");
        expect(dialog).toHaveAttribute("open");
        expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
        fireEvent(dialog, new Event("cancel", { cancelable: true }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it("announces notifications and supports manual and automatic dismissal", () => {
        vi.useFakeTimers();
        const close = vi.fn();
        render(<Toast open onClose={close} title="Saved" duration={1000}>Ready to continue</Toast>);
        expect(screen.getByRole("status")).toHaveTextContent("Saved");
        fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
        expect(close).toHaveBeenCalledTimes(1);
        act(() => { vi.advanceTimersByTime(1000); });
        expect(close).toHaveBeenCalledTimes(2);
    });

    it("clamps progress values and exposes a labelled numeric state", () => {
        const { rerender } = render(<ProgressBar value={200} max={100} label="Interview progress" />);
        expect(screen.getByRole("progressbar", { name: "Interview progress" })).toHaveAttribute("aria-valuenow", "100");
        rerender(<ProgressBar value={-10} label="Interview progress" />);
        expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    });

    it("exposes the current numbered step and explicit play/pause controls", () => {
        const choose = vi.fn(), play = vi.fn();
        render(<Stepper steps={[{ id: "a", label: "Understand" }, { id: "b", label: "Design" }]} activeStep={1} onStepChange={choose} playing onPlayingChange={play} />);
        expect(screen.getByRole("button", { name: /Step\s*02\s*Design/ }).closest("li")).toHaveAttribute("aria-current", "step");
        fireEvent.click(screen.getByRole("button", { name: /Step\s*01\s*Understand/ }));
        expect(choose).toHaveBeenCalledWith(0);
        fireEvent.click(screen.getByRole("button", { name: "Pause step animation" }));
        expect(play).toHaveBeenCalledWith(false);
    });

    it("exposes the final statistic to assistive technology and a useful empty-state action", () => {
        render(<><StatCard label="Availability" value={99.9} decimals={1} suffix="%" /><EmptyState title="No sessions" description="Pick a problem" action={<Button>Start</Button>} /></>);
        expect(screen.getByText("99.9%", { selector: ".sr-only" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    });
});
