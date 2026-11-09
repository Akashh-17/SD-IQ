import { Badge } from "../ui";
import type { InterviewStatus } from "./history.model";

const labels = { completed: "Completed", active: "In progress", generating: "Report pending", failed: "Report failed", expired: "Expired", unknown: "Unknown" };
export default function StatusBadge({ status }: { status: InterviewStatus }) {
    return <Badge dot mono tone={status === "completed" ? "success" : status === "failed" ? "danger" : status === "active" || status === "generating" ? "warning" : "neutral"}>{labels[status]}</Badge>;
}
