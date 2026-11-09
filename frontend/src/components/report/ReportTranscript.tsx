import { memo, useDeferredValue, useId, useMemo, useState } from "react";
import { ChevronDown, MessageSquareText, Search } from "lucide-react";
import { Badge, Button, Card, Input } from "../ui";
import { Reveal } from "../../motion";
import type { TranscriptMessage } from "./report.model";
function Highlight({ content, query }: { content: string; query: string }) {
    if (!query) return content;
    const chunks = [], haystack = content.toLocaleLowerCase(), needle = query.toLocaleLowerCase();
    let start = 0, match = haystack.indexOf(needle);
    while (match !== -1) { chunks.push(content.slice(start, match), <mark key={match} className="rounded-sm bg-accent/20 px-0.5 text-text">{content.slice(match, match + query.length)}</mark>); start = match + query.length; match = haystack.indexOf(needle, start); }
    chunks.push(content.slice(start)); return <>{chunks}</>;
}
const TranscriptLine = memo(function TranscriptLine({ message, index, query }: { message: TranscriptMessage; index: number; query: string }) {
    const match = !query || message.content.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    return <li hidden={!match} className="report-message border-t border-border py-5 first:border-0"><div className="mb-3 flex items-center gap-3 font-mono text-[9px] uppercase tracking-wider"><span className="text-muted">{String(index + 1).padStart(2, "0")}</span><span className={message.role === "assistant" ? "text-accent" : "text-muted"}>{message.role === "assistant" ? "Interviewer" : message.role === "user" ? "You" : "System"}</span></div><p className="whitespace-pre-wrap break-words text-sm leading-[1.85] text-text"><Highlight content={message.content} query={query} /></p></li>;
});
export default function ReportTranscript({ messages }: { messages: TranscriptMessage[] }) {
    const [open, setOpen] = useState(false), [search, setSearch] = useState("");
    const query = useDeferredValue(search.trim()), id = useId();
    const count = useMemo(() => messages.filter(message => !query || message.content.toLocaleLowerCase().includes(query.toLocaleLowerCase())).length, [messages, query]);
    return <Reveal className="report-reveal"><Card className="overflow-hidden"><div className="px-6 py-4 sm:px-8"><Button variant="ghost" fullWidth className="!min-h-16 !justify-between !rounded-control !p-0 text-left hover:!bg-transparent" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}><span className="flex items-center gap-3"><MessageSquareText size={18} aria-hidden="true" className="text-accent" /><span><span className="block text-base text-text">Your conversation</span><span className="mt-1 block text-xs font-normal text-muted">Revisit the reasoning behind your decisions.</span></span></span><span className="flex shrink-0 items-center gap-3"><Badge mono>{messages.length}</Badge><ChevronDown size={15} aria-hidden="true" className={`report-no-print transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} /></span></Button></div>
        <div id={id} hidden={!open} className="report-expand border-t border-border px-6 py-6 sm:px-8">
            {messages.length ? <><div className="report-no-print flex flex-wrap items-center justify-between gap-3"><div className="w-full max-w-md"><Input label="Search transcript" icon={Search} placeholder="Find an idea, component or tradeoff…" maxLength={120} value={search} onChange={event => setSearch(event.target.value)} /></div><p role="status" aria-live="polite" className="font-mono text-[10px] text-muted">{query ? `${count} of ${messages.length} messages` : `${messages.length} messages`}</p></div>
                {query && !count && <div className="report-no-print py-8 text-center"><p className="text-sm text-muted">No messages match your search.</p><Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearch("")}>Clear search</Button></div>}
                <ol className="mt-5">{messages.map((message, index) => <TranscriptLine key={index} message={message} index={index} query={query} />)}</ol></>
                : <p className="text-sm text-muted">No transcript was recorded for this report.</p>}
        </div>
    </Card></Reveal>;
}
