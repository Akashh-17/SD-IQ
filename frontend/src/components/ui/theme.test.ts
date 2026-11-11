/// <reference types="node" />
// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

const css = readFileSync(resolve(import.meta.dirname, "../../index.css"), "utf8");
type RGB = [number, number, number];
function tokens(block: string): Record<string, RGB> {
    return Object.fromEntries([...block.matchAll(/--color-([a-z-]+):\s*(\d+) (\d+) (\d+);/g)].map(match =>
        [match[1], match.slice(2).map(Number) as RGB]
    ));
}
// Both themes: the dark tokens in ":root { ... }" and the light overrides in
// ":root[data-theme='light'] { ... }". Every check below runs for each theme.
const block = (start: string) => { const from = css.indexOf(start); return css.slice(from, css.indexOf("}", from)); };
const dark = tokens(block(":root {"));
const lightOverrides = tokens(block(":root[data-theme='light']"));
const themes = { dark, light: { ...dark, ...lightOverrides } };

function luminance(color: RGB) {
    const linear = color.map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(foreground: RGB, background: RGB) {
    const a = luminance(foreground), b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const [theme, colors] of Object.entries(themes)) {
    it(`${theme}: keeps semantic text tokens above WCAG AA normal-text contrast on every surface`, () => {
        for (const surface of ["bg", "surface", "elevated"]) {
            for (const foreground of ["text", "muted", "accent", "success", "warning", "danger"]) {
                expect(contrast(colors[foreground], colors[surface]), `${foreground} on ${surface}`).toBeGreaterThanOrEqual(4.5);
            }
        }
        expect(contrast(colors["on-accent"], colors.accent)).toBeGreaterThanOrEqual(4.5);
        for (const tone of ["accent", "success", "warning", "danger"]) {
            const tinted = colors[tone].map((value, index) => value * 0.1 + colors.surface[index] * 0.9) as RGB;
            expect(contrast(colors[tone], tinted), `${tone} badge`).toBeGreaterThanOrEqual(4.5);
        }
    });

    it(`${theme}: keeps input boundaries and focus indicators above 3:1 non-text contrast`, () => {
        expect(contrast(colors["control-border"], colors.bg)).toBeGreaterThanOrEqual(3);
        for (const surface of ["bg", "surface", "elevated"]) {
            expect(contrast(colors.accent, colors[surface])).toBeGreaterThanOrEqual(3);
        }
    });
}

it("defines a light value for every dark colour token", () => {
    expect(Object.keys(lightOverrides).sort()).toEqual(Object.keys(dark).sort());
});
