// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
const root = resolve(import.meta.dirname, "../..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const asset = (path: string) => resolve(root, "public", path.replace(/^\//, ""));
function meta(key: string) { return html.match(new RegExp('<meta (?:name|property)="' + key + '" content="([^"]+)"'))?.[1]; }
it("ships a real, correctly sized social image and complete sharing metadata", () => {
    expect(meta("description")?.length).toBeGreaterThan(30);
    expect(meta("theme-color")).toBe("#0b110e");
    expect(meta("og:title")).toContain("SystemIQ");
    expect(meta("og:type")).toBe("website");
    expect(meta("twitter:card")).toBe("summary_large_image");
    const path = meta("og:image")!.replace("__PUBLIC_ORIGIN__", "");
    const png = readFileSync(asset(path));
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(Number(meta("og:image:width")));
    expect(png.readUInt32BE(20)).toBe(Number(meta("og:image:height")));
    expect(meta("og:image:alt")).toBeTruthy();
});
it("preloads self-hosted WOFF2 fonts without changing families or weight ranges", () => {
    const fonts = [...html.matchAll(/<link rel="preload" href="([^"]+)" as="font"/g)].map(match => match[1]);
    expect(fonts).toHaveLength(2);
    for (const path of fonts) expect(readFileSync(asset(path)).subarray(0, 4).toString()).toBe("wOF2");
    const css = readFileSync(asset("/fonts/geist.css"), "utf8");
    expect(css).toContain("font-family: 'Geist'");
    expect(css).toContain("font-family: 'Geist Mono'");
    expect(css).toContain("font-weight: 400 700");
    expect(css).toContain("font-weight: 400 600");
    expect(css).toContain("font-display: swap");
    expect(html).not.toContain("fonts.googleapis.com");
    expect(css).not.toContain("fonts.gstatic.com");
});
it("ships favicon, touch and manifest icons at their declared sizes", () => {
    const links = [...html.matchAll(/<link rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g)];
    for (const [, path] of links) expect(existsSync(asset(path)), path).toBe(true);
    const manifest = JSON.parse(readFileSync(asset("/site.webmanifest"), "utf8"));
    expect(manifest.name).toBe("SystemIQ");
    for (const icon of manifest.icons) {
        const png = readFileSync(asset(icon.src));
        expect(png.readUInt32BE(16) + "x" + png.readUInt32BE(20)).toBe(icon.sizes);
    }
    expect(existsSync(asset("/fonts/geist-OFL.txt"))).toBe(true);
    expect(existsSync(asset("/fonts/geistmono-OFL.txt"))).toBe(true);
});
