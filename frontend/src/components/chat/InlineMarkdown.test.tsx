import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InlineMarkdown from "./InlineMarkdown";

const html = (text: string) => render(<p><InlineMarkdown text={text} /></p>).container.innerHTML;

describe("InlineMarkdown", () => {
    it("renders bold, italic and code", () => {
        expect(html("We'll be designing **Design TinyURL**.")).toBe("<p>We'll be designing <strong class=\"font-semibold\">Design TinyURL</strong>.</p>");
        expect(html("an *eventual* model")).toContain("<em>eventual</em>");
        expect(html("use _sharding_ here")).toContain("<em>sharding</em>");
        expect(html("call `GET /api`")).toContain(">GET /api</code>");
    });

    it("leaves snake_case names and arithmetic alone", () => {
        expect(html("store url_shortener_id in the table")).toBe("<p>store url_shortener_id in the table</p>");
        expect(html("that is 2*3*4 shards")).toBe("<p>that is 2*3*4 shards</p>");
    });

    it("leaves unclosed markers as plain text (mid-stream)", () => {
        expect(html("We'll be designing **Design Tin")).toBe("<p>We'll be designing **Design Tin</p>");
    });

    it("never turns message text into HTML", () => {
        const output = html("**<img src=x onerror=alert(1)>**");
        expect(output).not.toContain("<img");
        expect(output).toContain("&lt;img");
    });
});
