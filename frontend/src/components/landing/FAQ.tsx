import { useId, useState } from "react";
import { Button, Card } from "../ui";
import { Reveal } from "../../motion";
import Glyph from "./Glyph";
import SectionHeading from "./SectionHeading";

const questions = [
    { q: "Is this a real interview or a practice session?", a: "A practice session with an AI interviewer. You choose a system design problem, explain your decisions, and work through follow-up questions. It is a space to experiment before a real interview." },
    { q: "What can I practice?", a: "Explore the system design concepts behind chat, storage, feeds, notifications and more. The example problems are starting points for practicing different constraints and tradeoffs, from requirements to scaling." },
    { q: "Can I draw my architecture?", a: "Yes. Build your architecture on the interview whiteboard while you explain it. The interviewer can use that diagram as context, and your report includes diagram feedback." },
    { q: "How does scoring work?", a: "Answers are evaluated against the problem's stage criteria. The application combines those evaluations into stage scores and an overall report, alongside strengths, gaps and feedback for your next attempt." },
    { q: "Can I speak instead of typing?", a: "Yes. You can type your answers or use voice input with microphone access. You can also keep working on your whiteboard as the conversation progresses." },
    { q: "Do I need the perfect answer before I start?", a: "Bring a starting point and a willingness to explain it. Ask clarifying questions, make assumptions explicit, and change your mind when a tradeoff becomes clearer. That is the practice." }
];

export default function FAQ() {
    const id = useId();
    const [open, setOpen] = useState<number | null>(0);
    return <section id="faq" className="landing-container landing-section" aria-label="Frequently asked questions">
        <Reveal><SectionHeading eyebrow="06 / A FEW GOOD QUESTIONS" title={<>Before you<br /><span className="text-muted">start thinking out loud.</span></>} /></Reveal>
        <div className="landing-faq-list">{questions.map((item, index) => <Card key={item.q} className="!rounded-none !border-x-0 !border-t-0 !bg-transparent !shadow-none"><h3><Button variant="ghost" fullWidth aria-expanded={open === index} aria-controls={`${id}-answer-${index}`} id={`${id}-question-${index}`} className="landing-faq-trigger" onClick={() => setOpen(open === index ? null : index)}><span>{item.q}</span><Glyph name="plus" size={17} className={`shrink-0 transition-transform duration-200 ${open === index ? "rotate-45" : ""}`} /></Button></h3><div id={`${id}-answer-${index}`} role="region" aria-labelledby={`${id}-question-${index}`} hidden={open !== index}><p className="max-w-3xl px-1 pb-6 pr-10 text-sm leading-relaxed text-muted">{item.a}</p></div></Card>)}</div>
    </section>;
}
