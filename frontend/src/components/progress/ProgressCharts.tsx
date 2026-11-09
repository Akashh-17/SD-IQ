import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, EmptyState } from "../ui";
import { useReducedMotion } from "../../motion/useReducedMotion";
import { scoreTrend, stageAverages, type HistoryItem } from "../history/history.model";

const accent = "rgb(var(--color-accent))";
const muted = "rgb(var(--color-muted))";
const border = "rgb(var(--color-border))";
const tooltip = { backgroundColor: "rgb(var(--color-elevated))", border: `1px solid ${border}`, borderRadius: 12, color: "rgb(var(--color-text))", fontSize: 12 };

export function ScoreTrend({ history }: { history: HistoryItem[] }) {
    const data = scoreTrend(history);
    const reduced = useReducedMotion();
    return <Card className="min-w-0 p-5 sm:p-6"><h2 className="text-h4">The shape of your progress</h2><p className="mb-6 mt-2 text-xs leading-relaxed text-muted">Overall scores, in interview order. A single session is a data point, not a verdict.</p>
        {data.length ? <><div className="h-64 w-full min-w-0" aria-label="Overall score trend"><ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={data} accessibilityLayer margin={{ top: 12, right: 14, bottom: 4, left: -24 }}>
                <CartesianGrid stroke={border} strokeDasharray="3 5" vertical={false} /><XAxis dataKey="date" stroke={muted} tickLine={false} axisLine={false} minTickGap={40} tick={{ fontSize: 10 }} /><YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke={muted} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltip} itemStyle={{ color: accent }} cursor={{ stroke: border }} formatter={value => [`${value}/10`, "Overall score"]} />
                <Line name="Overall score" type="linear" dataKey="score" stroke={accent} strokeWidth={2} dot={{ r: 3, fill: accent, stroke: "rgb(var(--color-surface))", strokeWidth: 2 }} activeDot={{ r: 5, fill: accent, strokeWidth: 0 }} isAnimationActive={!reduced} animationDuration={450} />
            </LineChart>
        </ResponsiveContainer></div><p className="mt-4 font-mono text-[10px] text-muted">{data.length} scored {data.length === 1 ? "session · your baseline is set" : "sessions · scale 0–10"}</p>
            <div className="sr-only"><table><caption>Overall scores in chronological order</caption><thead><tr><th>Problem</th><th>Date</th><th>Score out of 10</th></tr></thead><tbody>{data.map(item => <tr key={item.id}><td>{item.title}</td><td>{item.date}</td><td>{item.score}</td></tr>)}</tbody></table></div></>
            : <EmptyState title="Your baseline is ahead." description="Complete a scored interview with a recorded date to see your trend." />}
    </Card>;
}

export function StageAverages({ history }: { history: HistoryItem[] }) {
    const data = stageAverages(history);
    const reduced = useReducedMotion();
    return <Card className="min-w-0 p-5 sm:p-6"><h2 className="text-h4">Your design toolkit</h2><p className="mb-6 mt-2 text-xs leading-relaxed text-muted">Average score per evaluated stage. Unevaluated stages are left out.</p>
        {data.length ? <><div className="h-72 w-full min-w-0" aria-label="Average score by stage"><ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data} layout="vertical" accessibilityLayer margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid stroke={border} strokeDasharray="3 5" horizontal={false} /><XAxis type="number" domain={[0, 10]} ticks={[0, 5, 10]} axisLine={false} tickLine={false} stroke={muted} tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="stage" width={108} axisLine={false} tickLine={false} stroke={muted} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltip} itemStyle={{ color: accent }} cursor={{ fill: "rgb(var(--color-elevated))" }} formatter={value => [`${value}/10`, "Stage average"]} /><Bar name="Stage average" dataKey="score" fill={accent} radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={!reduced} animationDuration={450} />
            </BarChart>
        </ResponsiveContainer></div><div className="sr-only"><table><caption>Stage averages</caption><thead><tr><th>Stage</th><th>Average out of 10</th><th>Evaluated interviews</th></tr></thead><tbody>{data.map(item => <tr key={item.stage}><td>{item.stage}</td><td>{item.score}</td><td>{item.count}</td></tr>)}</tbody></table></div></>
            : <EmptyState title="More signal after your first report." description="Stage averages appear when a completed report contains evaluated stage scores." />}
    </Card>;
}
