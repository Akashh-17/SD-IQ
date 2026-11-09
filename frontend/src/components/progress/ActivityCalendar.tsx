import { Card } from "../ui";
import { activityCalendar, type HistoryItem } from "../history/history.model";

export default function ActivityCalendar({ history }: { history: HistoryItem[] }) {
    const days = activityCalendar(history);
    const active = days.filter(day => day.count > 0);
    const total = days.reduce((sum, day) => sum + day.count, 0);
    return <Card className="min-w-0 p-5 sm:p-6"><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-h4">Show up. Connect the dots.</h2><p className="mt-2 text-xs text-muted">Interviews practiced over the last 13 weeks.</p></div><span className="font-mono text-xs text-muted">{total} {total === 1 ? "session" : "sessions"} / {active.length} active {active.length === 1 ? "day" : "days"}</span></div>
        <div role="img" aria-label={`Practice calendar: ${total} interviews across ${active.length} active days in the last 13 weeks.`} className="overflow-x-auto pb-2">
            <div className="flex min-w-[240px] items-start gap-3" aria-hidden="true"><div className="grid h-[130px] grid-rows-7 items-center pt-0.5 font-mono text-[9px] text-muted"><span>Mon</span><span /><span>Wed</span><span /><span>Fri</span><span /><span>Sun</span></div>
                <div className="min-w-0 flex-1"><div className="grid grid-flow-col grid-rows-7 gap-1">{days.map(day => <div key={day.key} title={`${day.label}: ${day.future ? "Upcoming day" : `${day.count} ${day.count === 1 ? "interview" : "interviews"}`}`} className={`h-[15px] rounded-sm border ${day.future ? "border-border/40 bg-bg opacity-30" : day.count >= 3 ? "border-accent bg-accent" : day.count === 2 ? "border-accent/60 bg-accent/60" : day.count === 1 ? "border-accent/30 bg-accent/25" : "border-border bg-elevated"}`} />)}</div><div className="mt-3 flex justify-between font-mono text-[9px] text-muted"><span>{days[0].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span><span>This week</span></div></div>
            </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted"><p>Completed sessions use their completion date; active sessions use their start date.</p><div className="flex items-center gap-1.5" aria-hidden="true"><span>Less</span>{["bg-elevated", "bg-accent/25", "bg-accent/60", "bg-accent"].map(color => <span key={color} className={`h-2.5 w-2.5 rounded-sm border border-border ${color}`} />)}<span>More</span></div></div>
        <ul className="sr-only" aria-label="Days practiced">{active.map(day => <li key={day.key}>{day.label}: {day.count} interviews</li>)}</ul>
    </Card>;
}
