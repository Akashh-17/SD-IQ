import { RefreshCw } from "lucide-react";
import { Button, Card, Skeleton } from "../ui";

export function HistoryLoading() {
    return <div role="status" aria-label="Loading interview history" className="space-y-6">
        <span className="sr-only">Loading your practice data…</span>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map(index => <Card key={index} className="space-y-5 p-6"><Skeleton className="h-3 w-24" /><Skeleton className="h-9 w-20" /><Skeleton className="h-3 w-36 max-w-full" /></Card>)}</div>
        <Card className="space-y-6 p-6"><Skeleton className="h-6 w-44" />{[0, 1, 2, 3, 4].map(index => <Skeleton key={index} className="h-12 w-full" />)}</Card>
    </div>;
}
export function HistoryError({ retry }: { retry: () => void }) {
    return <Card role="alert" className="p-6 sm:p-8"><p className="section-kicker text-danger">Connection interrupted</p><h2 className="mt-3 text-h3">Your practice history couldn’t load.</h2><p className="mb-6 mt-3 max-w-lg text-sm leading-relaxed text-muted">Check your connection and try again. Your saved interviews are still there.</p><Button variant="secondary" onClick={retry}><RefreshCw size={15} aria-hidden="true" />Try again</Button></Card>;
}
