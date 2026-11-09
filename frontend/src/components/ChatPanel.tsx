import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowDown, Bot, LoaderCircle, Mic, PanelRightClose, SendHorizontal, Square } from "lucide-react";
import { streamInterviewMessage, type InterviewPhase } from "../services/chat.service";
import { initializeInterview } from "../services/initializeInterview.service";
import { getInterviewState } from "../services/interviewState.service";
import { describeApiError, errorStatus } from "../lib/apiError";
import { Badge, Button, Textarea, Tooltip } from "./ui";
import { useReducedMotion } from "../motion/useReducedMotion";
import { useRoom } from "./chat/room.context";
import MessageBubble, { type ChatMessage } from "./chat/MessageBubble";
import { useMicrophone } from "./chat/useMicrophone";
import Waveform from "./chat/Waveform";

export default function ChatPanel() {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const room = useRoom();
    const loadInitial = room?.loadInitial, refresh = room?.refresh, publishReply = room?.publishReply, flushGraph = room?.flushGraph;
    const reduced = useReducedMotion();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [thinking, setThinking] = useState(false);
    const [phase, setPhase] = useState<InterviewPhase>("thinking");
    const [streamId, setStreamId] = useState<string | null>(null);
    const [paused, setPaused] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [micError, setMicError] = useState("");
    const activeTurn = useRef<AbortController | null>(null);
    const reportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tokenFrame = useRef<number | null>(null);
    const tokenBuffer = useRef("");
    const scrolling = useRef<HTMLDivElement>(null);
    const pinned = useRef(true);
    const textarea = useRef<HTMLTextAreaElement>(null);
    const microphone = useMicrophone(setInput, setMicError);
    useEffect(() => () => { activeTurn.current?.abort(); if (reportTimer.current) clearTimeout(reportTimer.current); if (tokenFrame.current !== null) cancelAnimationFrame(tokenFrame.current); }, [interviewId]);
    useEffect(() => {
        let active = true;
        async function start() {
            if (!interviewId) return;
            setThinking(true);
            try {
                const state = await (loadInitial ? loadInitial() : getInterviewState(interviewId));
                if (!active) return;
                if (state.transcript?.length) {
                    setMessages(state.transcript.map((message: { role: string; content: string }, index: number) => ({ id: `restored-${index}`, role: message.role === "assistant" ? "ai" : "user", text: message.content })));
                    return;
                }
                const { reply } = await initializeInterview(interviewId);
                if (active) { setMessages([{ id: "greeting", role: "ai", text: reply }]); void refresh?.(); }
            } catch (error) {
                if (!active) return;
                if (errorStatus(error) === 404) { navigate(`/report/${interviewId}`, { replace: true }); return; }
                setMessages([{ id: "initial-error", role: "ai", text: describeApiError(error), error: true }]);
            } finally { if (active) setThinking(false); }
        }
        void start();
        return () => { active = false; };
    }, [interviewId, navigate, loadInitial, refresh]);
    useLayoutEffect(() => { if (pinned.current && scrolling.current) scrolling.current.scrollTop = scrolling.current.scrollHeight; }, [messages, thinking]);
    useEffect(() => {
        if (!textarea.current) return;
        textarea.current.style.height = "48px";
        textarea.current.style.height = Math.min(Math.max(textarea.current.scrollHeight, 48), 140) + "px";
    }, [input]);
    function clearTokens() { if (tokenFrame.current !== null) cancelAnimationFrame(tokenFrame.current); tokenFrame.current = null; tokenBuffer.current = ""; }
    async function send() {
        const text = input.trim();
        if (!text || thinking || completed || microphone.opening || microphone.recording || microphone.transcribing || activeTurn.current) return;
        const controller = new AbortController();
        activeTurn.current = controller;
        const id = crypto.randomUUID();
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: "user", text }, { id, role: "ai", text: "" }]);
        setInput(""); setThinking(true); setPhase("thinking"); setStreamId(id);
        const replace = (text: string, error = false) => setMessages(previous => previous.map(message => message.id === id ? { ...message, text, error } : message));
        try {
            await flushGraph?.();
            if (controller.signal.aborted) return;
            const result = await streamInterviewMessage(interviewId!, text, {
                signal: controller.signal, onStatus: setPhase,
                onToken: chunk => {
                    tokenBuffer.current += chunk;
                    if (tokenFrame.current === null) tokenFrame.current = requestAnimationFrame(() => {
                        const text = tokenBuffer.current; tokenBuffer.current = ""; tokenFrame.current = null;
                        if (!controller.signal.aborted) setMessages(previous => previous.map(message => message.id === id ? { ...message, text: message.text + text } : message));
                    });
                }
            });
            if (controller.signal.aborted) return;
            clearTokens(); replace(result.reply); publishReply?.(result.reply, result.completed);
            if (result.completed) { setCompleted(true); reportTimer.current = setTimeout(() => navigate(`/report/${interviewId}`), 3000); }
        } catch (error) {
            clearTokens();
            if (!controller.signal.aborted) replace(errorStatus(error) === 409 ? "This response was interrupted. Reload the interview before continuing." : describeApiError(error), true);
        } finally {
            if (activeTurn.current === controller) { activeTurn.current = null; setThinking(false); setStreamId(null); }
        }
    }
    function jump() { pinned.current = true; setPaused(false); scrolling.current?.scrollTo({ top: scrolling.current.scrollHeight, behavior: reduced ? "auto" : "smooth" }); }
    const status = microphone.transcribing ? "Transcribing..." : microphone.opening ? "Opening microphone..." : thinking ? phase === "evaluating" ? "Evaluating your answer..." : phase === "responding" ? "Responding..." : "Thinking..." : completed ? "Your report is ready. Opening it now…" : "";
    return <section className="flex h-full min-h-0 min-w-0 flex-col bg-bg" aria-label="Interview conversation">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3"><div className="flex items-center gap-2.5"><Bot size={16} className="text-accent" aria-hidden="true" /><div><h2 className="text-xs font-medium">The conversation</h2><p className="mt-0.5 font-mono text-[9px] text-muted">think_out_loud</p></div></div><div className="flex items-center gap-2"><Badge mono dot tone="accent">Live</Badge>{room && <Tooltip content="Collapse chat"><Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label="Collapse chat" onClick={room.toggleChat}><PanelRightClose size={15} aria-hidden="true" /></Button></Tooltip>}</div></header>
        <div className="relative min-h-0 flex-1">
            <div ref={scrolling} role="log" aria-label="Interview messages" aria-live="off" tabIndex={0} className="h-full space-y-6 overflow-y-auto px-4 py-6 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 sm:px-5" onScroll={event => { const element = event.currentTarget; const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 72; pinned.current = atBottom; setPaused(!atBottom); }}>
                {messages.map((message, index) => <MessageBubble key={message.id ?? index} message={message} streaming={message.id === streamId && Boolean(message.text) && thinking} />)}
                {status && <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5 text-xs text-muted">{!completed && <LoaderCircle size={13} className="motion-safe:animate-spin" aria-hidden="true" />}<span>{status}</span></div>}
            </div>
            {paused && <Button size="sm" variant="secondary" className="absolute bottom-3 left-1/2 -translate-x-1/2 !bg-surface shadow-floating" onClick={jump}><ArrowDown size={12} aria-hidden="true" />Jump to latest</Button>}
        </div>
        <div className="shrink-0 border-t border-border bg-surface p-3 sm:p-4">
            {microphone.recording && <div role="status" className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-control border border-danger/25 bg-danger/5 px-3 py-2"><span className="font-mono text-[10px] text-danger">Recording your answer</span><Waveform stream={microphone.stream} /></div>}
            {micError && <p role="alert" className="mb-3 text-xs leading-relaxed text-danger">{micError}</p>}
            <form aria-label="Send an answer" onSubmit={event => { event.preventDefault(); void send(); }} className="rounded-card border border-border bg-bg p-2 focus-within:border-accent/50">
                <Textarea ref={textarea} aria-label="Your answer" placeholder="Explain your design..." value={input} disabled={completed || microphone.transcribing} maxLength={4000} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} className="!min-h-12 !resize-none !border-0 !bg-transparent !px-2 !py-2 !text-[13px] !shadow-none focus-visible:!ring-0" />
                <div className="flex items-center justify-between gap-2 px-1 pb-1"><span className="font-mono text-[9px] text-muted">{input.length ? `${input.length}/4000` : "A clear thought beats a perfect answer."}</span><div className="flex shrink-0 gap-1">
                    <Tooltip content={microphone.recording ? "Stop and transcribe" : "Record your answer"}><Button variant={microphone.recording ? "danger" : "ghost"} size="icon" className="!h-9 !w-9" aria-label={microphone.recording ? "Stop recording" : "Record your answer"} aria-pressed={microphone.recording} loading={microphone.opening} disabled={thinking || completed || microphone.transcribing} onClick={() => { setMicError(""); if (microphone.recording) microphone.stop(); else void microphone.start(); }}>{microphone.recording ? <Square size={13} aria-hidden="true" /> : <Mic size={15} aria-hidden="true" />}</Button></Tooltip>
                    <Tooltip content="Send · Enter"><Button type="submit" size="icon" className="!h-9 !w-9" aria-label="Send answer" disabled={!input.trim() || thinking || completed || microphone.opening || microphone.recording || microphone.transcribing}><SendHorizontal size={15} aria-hidden="true" /></Button></Tooltip>
                </div></div>
            </form><p className="mt-2 text-center font-mono text-[8px] text-muted">Enter to send · Shift + Enter for a new line</p>
        </div>
    </section>;
}
