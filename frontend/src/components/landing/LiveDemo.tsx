import { Badge, Button, Card, CodeChip } from "../ui";
import { Reveal, StreamText } from "../../motion";
import { usePlayback } from "./usePlayback";
import ArchitectureScene from "./ArchitectureScene";
import SectionHeading from "./SectionHeading";
import Glyph from "./Glyph";

const stages = ["Requirements", "High Level Design", "Core Flow", "Data Model", "Reliability", "Scaling", "Tradeoffs"];
const questions = [
    "Let's design a URL shortener. What should we optimize for?",
    "Good. Walk me through the redirect path, from click to destination.",
    "Your cache is fast. How do you keep a cache outage from taking down redirects?"
];
const answers = [
    "Fast redirects and durable links. Let's assume 100 million redirects a day, with creation far less frequent.",
    "The load balancer routes to an API server. Check the cache first, then read the durable mapping on a miss.",
    "Fall back with timeouts and bounded concurrency. A wave of cache misses shouldn't overwhelm the database."
];
const agents = ["classify_intent", "evaluate_answer", "classify_intent", "analyze_diagram", "analyze_diagram", "evaluate_answer", "evaluate_answer", "generate_report"];

export default function LiveDemo({ embedded = false }: { embedded?: boolean }) {
    const { attach, index, playing, reduced, setPlaying, next, replay } = usePlayback(8, 2800);
    const beat = index;
    const chapter = beat >= 5 ? 2 : beat >= 2 ? 1 : 0;
    const candidateVisible = beat === 1 || beat === 3 || beat === 4 || beat >= 6;
    const graphPhase = beat >= 4 ? 4 : beat >= 3 ? 2 : 0;
    return <section id={embedded ? undefined : "live-interview"} className="landing-container landing-section" aria-label="Live interview preview">
        <Reveal><SectionHeading eyebrow="03 / IN THE ROOM" title={<>An interview that<br /><span className="text-accent">thinks with you.</span></>}>Watch an illustrative session unfold. A question becomes a decision. A decision becomes an architecture.</SectionHeading></Reveal>
        <div ref={attach}>
            <Card className="overflow-hidden">
                <div className="landing-live-toolbar"><div className="flex flex-wrap items-center gap-3"><span className="flex items-center gap-2 text-xs font-medium"><Glyph name="chat" size={15} className="text-accent" />Design a URL shortener</span><Badge mono>Scripted preview</Badge></div><div className="flex items-center gap-1"><span className="mr-2 hidden font-mono text-[10px] text-muted sm:inline">0{beat + 1} / 08</span><Button variant="ghost" size="icon" aria-label="Replay live interview preview" onClick={replay}><Glyph name="replay" size={15} /></Button>{!reduced && <Button variant="secondary" size="icon" aria-label={playing ? "Pause live interview preview" : "Play live interview preview"} aria-pressed={playing} onClick={() => setPlaying(!playing)}><Glyph name={playing ? "pause" : "play"} size={14} /></Button>}<Button variant="ghost" size="icon" aria-label="Next preview moment" onClick={next}><Glyph name="arrow" size={16} /></Button></div></div>
                <div className="landing-live-body">
                    <div className="landing-live-conversation" aria-label="Illustrative conversation" aria-live="off">
                        <div className="mb-5 flex items-center justify-between"><span className="section-kicker">The conversation</span><span className="font-mono text-[9px] text-muted">text + voice</span></div>
                        <div className="landing-live-question"><p className="landing-speaker"><span className="landing-speaker-dot" />AI interviewer</p><p className="mt-3 text-sm leading-relaxed"><StreamText key={chapter} text={questions[chapter]} charactersPerSecond={42} complete={reduced || !playing} caret={playing && !reduced} /></p></div>
                        <Reveal initial={false} whileInView={undefined} animate={{ opacity: candidateVisible ? 1 : 0, y: candidateVisible ? 0 : 8 }} transition={{ duration: reduced ? 0 : 0.3 }} aria-hidden={!candidateVisible} className="landing-live-answer"><p className="landing-speaker !text-muted"><span className="!bg-muted landing-speaker-dot" />You</p><p className="mt-3 text-sm leading-relaxed">{answers[chapter]}</p></Reveal>
                        <div className="landing-live-feedback"><CodeChip>{agents[beat]}</CodeChip><p className="mt-3 min-h-10 text-xs leading-relaxed text-muted">{beat === 7 ? "Strong separation of latency and availability. Next, quantify the fallback capacity." : beat >= 4 ? "The diagram is part of the conversation. Now, pressure-test the failure path." : "Think out loud. The interviewer follows your reasoning."}</p></div>
                    </div>
                    <div className="landing-live-whiteboard"><div className="mb-4 flex items-center justify-between"><span className="section-kicker">The whiteboard</span><Badge mono dot tone={beat >= 4 ? "accent" : "neutral"}>{beat >= 4 ? "Diagram updated" : "Sketch in progress"}</Badge></div><div className="landing-live-canvas"><ArchitectureScene phase={graphPhase} compact /></div><div className="mt-4 flex items-center justify-between gap-3 font-mono text-[10px] text-muted"><span>{beat >= 4 ? "06" : beat >= 3 ? "03" : "01"} nodes / {beat >= 4 ? "05" : beat >= 3 ? "02" : "00"} connections</span><span className="inline-flex items-center gap-1"><Glyph name="check" size={12} />example architecture</span></div><div className="landing-live-insight"><Glyph name="cache" size={16} className="shrink-0 text-accent" /><p className="text-xs leading-relaxed text-muted">{beat >= 6 ? "A cache improves latency. It shouldn't be a single point of failure." : "Start simple. Add a component when you can explain why it belongs."}</p></div></div>
                </div>
                <div className="border-t border-border px-4 py-5 sm:px-6"><div className="mb-3 flex justify-between gap-3"><span className="section-kicker">Stage by stage</span><span className="font-mono text-[10px] text-muted">{chapter + 1} / 7</span></div><ol aria-label="Interview stages" className="landing-stage-bar">{stages.map((stage, index) => <li key={stage} aria-current={index === chapter ? "step" : undefined} className={index === chapter ? "landing-stage-active" : ""}><span className="font-mono">{String(index + 1).padStart(2, "0")}</span><span>{stage}</span></li>)}</ol></div>
            </Card>
        </div>
        <p className="mt-4 text-right font-mono text-[10px] leading-relaxed text-muted">A scripted example. Your real interview follows your decisions.</p>
    </section>;
}
