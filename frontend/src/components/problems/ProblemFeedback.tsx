import { RefreshCw } from "lucide-react";
import { Button, Card, Skeleton } from "../ui";

export function ProblemSkeletons() {
    return <div role="status" aria-label="Loading challenges"><span className="sr-only">Loading challenges…</span><div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(index => <Card key={index} className="space-y-5 p-6"><Skeleton className="h-5 w-20" /><Skeleton className="h-7 w-4/5" /><Skeleton className="h-12 w-full" /><div className="flex gap-2"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-6 w-1/3" /></div><Skeleton className="h-4 w-28" /></Card>)}</div></div>;
}
export function ProblemLoadError({ onRetry }: { onRetry: () => void }) {
    return <Card role="alert" className="p-6 sm:p-8"><p className="section-kicker text-danger">Let’s try that again</p><h2 className="mt-3 text-h3">The challenges couldn’t load.</h2><p className="mb-6 mt-3 text-sm text-muted">Check your connection, then give it another try.</p><Button variant="secondary" onClick={onRetry}><RefreshCw size={15} aria-hidden="true" />Try again</Button></Card>;
}
