import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card } from "../ui";
import { Reveal } from "../../motion";
import { useReducedMotion } from "../../motion/useReducedMotion";
import Glyph, { type GlyphName } from "./Glyph";
import SectionHeading from "./SectionHeading";

const problems: { id: string; name: string; question: string; difficulty: string; icon: GlyphName }[] = [
    { id: "url_shortener", name: "URL shortener", question: "A short link. A very long read path.", difficulty: "Easy", icon: "diagonal" },
    { id: "chat_app", name: "Chat application", question: "Keep conversations in sync.", difficulty: "Medium", icon: "chat" },
    { id: "rate_limiter", name: "Rate limiter", question: "Decide who gets through. Fairly.", difficulty: "Medium", icon: "balance" },
    { id: "notification_system", name: "Notifications", question: "The right message, at the right moment.", difficulty: "Medium", icon: "queue" },
    { id: "google_drive", name: "File storage", question: "Store it. Sync it. Find it again.", difficulty: "Medium", icon: "database" },
    { id: "instagram", name: "Photo sharing", question: "From one upload to a million views.", difficulty: "Medium", icon: "layers" },
    { id: "news_feed", name: "News feed", question: "Whose updates make the front page?", difficulty: "Hard", icon: "chart" },
    { id: "uber", name: "Ride matching", question: "Match moving people in real time.", difficulty: "Hard", icon: "client" }
];

export default function PopularProblems() {
    const navigate = useNavigate();
    const reduced = useReducedMotion();
    const strip = useRef<HTMLUListElement>(null);
    return <section id="problems" className="landing-container landing-section" aria-label="Practice problems">
        <Reveal><SectionHeading eyebrow="04 / THE PROBLEM SPACE" title={<>Choose a system.<br /><span className="text-muted">Explore the tradeoffs.</span></>}>Different problems. Different constraints. Practice the decisions that turn an idea into a working system.</SectionHeading></Reveal>
        <div className="mb-5 flex items-center justify-between gap-3"><span className="font-mono text-[10px] text-muted">Example problems / your own pace</span><div className="flex gap-2"><Button variant="secondary" size="icon" aria-label="Previous problems" onClick={() => strip.current?.scrollBy({ left: -300, behavior: reduced ? "instant" : "smooth" })}><Glyph name="arrow" className="rotate-180" size={15} /></Button><Button variant="secondary" size="icon" aria-label="More problems" onClick={() => strip.current?.scrollBy({ left: 300, behavior: reduced ? "instant" : "smooth" })}><Glyph name="arrow" size={15} /></Button></div></div>
        <ul ref={strip} aria-label="Available problem examples" className="landing-problem-strip">{problems.map((problem, index) => <li key={problem.id}>
            <Card className="h-full"><Button variant="ghost" className="landing-problem-button" onClick={() => navigate("/login")}><span className="sr-only">Practice </span><span className="mb-8 flex w-full items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-control border border-border bg-bg text-accent"><Glyph name={problem.icon} size={20} /></span><span className="font-mono text-[10px] text-muted">0{index + 1}</span></span><span className="text-base font-medium text-text">{problem.name}</span><span className="mb-5 mt-2 min-h-10 text-xs leading-relaxed text-muted">{problem.question}</span><span className="flex w-full items-center justify-between"><Badge mono tone={problem.difficulty === "Hard" ? "warning" : "neutral"}>{problem.difficulty}</Badge><Glyph name="diagonal" size={16} /></span></Button></Card>
        </li>)}</ul>
    </section>;
}
