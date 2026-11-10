import type { ReactNode } from "react";

// Renders the small subset of markdown the interviewer uses (**bold**,
// *italic* / _italic_, `code`) as React elements. Builds nodes instead of
// HTML, so message text can never inject markup. An unclosed marker (for
// example mid-stream) stays as plain text until its closing pair arrives.
// Italic markers only count at word edges, so snake_case names
// (url_shortener_id) and expressions like 2*3*4 stay untouched.
const TOKEN = /(\*\*[^*\n]+\*\*|`[^`\n]+`|(?<![\w*])\*[^*\n]+\*(?![\w*])|(?<!\w)_[^_\n]+_(?!\w))/g;

function renderInlineMarkdown(text: string): ReactNode[] {
    return text.split(TOKEN).filter(Boolean).map((part, index) => {
        if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
            return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
            return <code key={index} className="rounded bg-elevated px-1 py-0.5 font-mono text-[0.92em]">{part.slice(1, -1)}</code>;
        }
        if (part.length > 2 && ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_")))) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
}

export default function InlineMarkdown({ text }: { text: string }) {
    return <>{renderInlineMarkdown(text)}</>;
}
