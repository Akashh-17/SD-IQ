import { memo } from "react";
import { Bot, User } from "lucide-react";
import { Card } from "../ui";
import { Reveal } from "../../motion";
import InlineMarkdown from "./InlineMarkdown";

export interface ChatMessage { id?: string; role: "user" | "ai"; text: string; error?: boolean; }
function MessageBubble({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
    const ai = message.role === "ai";
    if (!message.text && !streaming) return null;
    return <Reveal className={ai ? "mr-5" : "ml-5"}><article aria-label={ai ? "Interviewer message" : "Your answer"} className="space-y-2">
        <div className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] ${ai ? "text-accent" : "text-muted"}`}>{ai ? <Bot size={13} aria-hidden="true" /> : <User size={12} aria-hidden="true" />}<span>{ai ? "SystemIQ interviewer" : "You"}</span>{streaming && <span className="text-muted">/ live</span>}</div>
        <Card role={message.error ? "alert" : undefined} className={`px-4 py-3.5 text-[13px] font-normal leading-[1.8] ${ai ? "!bg-surface" : "!bg-elevated"} ${message.error ? "!border-danger/30 text-danger" : "text-text"}`}><p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{ai && !message.error ? <InlineMarkdown text={message.text} /> : message.text}{streaming && <span className="room-stream-cursor" aria-hidden="true" />}</p></Card>
    </article></Reveal>;
}
export default memo(MessageBubble);
