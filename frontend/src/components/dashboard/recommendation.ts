import { historyStats, type HistoryItem } from "../history/history.model";

const problems = {
    url_shortener: { title: "URL Shortener", difficulty: "Easy", match: /url|tinyurl/i },
    chat_app: { title: "Chat Application", difficulty: "Medium", match: /chat|whatsapp/i },
    rate_limiter: { title: "Rate Limiter", difficulty: "Medium", match: /rate.?limit/i },
    notification_system: { title: "Notification System", difficulty: "Medium", match: /notification/i },
    google_drive: { title: "Google Drive", difficulty: "Medium", match: /drive|file.?storage/i },
    news_feed: { title: "News Feed", difficulty: "Hard", match: /news.?feed/i }
};
type ProblemId = keyof typeof problems;
const practice: Record<string, ProblemId[]> = {
    Requirements: ["url_shortener", "notification_system"],
    "High Level Design": ["notification_system", "chat_app"],
    "Core Flow": ["rate_limiter", "url_shortener"],
    "Data Model": ["google_drive", "chat_app"],
    Reliability: ["notification_system", "rate_limiter"],
    Scaling: ["news_feed", "chat_app"],
    Tradeoffs: ["rate_limiter", "news_feed"]
};
export function recommendProblem(history: HistoryItem[]) {
    const weakest = historyStats(history).weakestStage;
    const candidates = practice[weakest?.stage ?? ""] ?? ["url_shortener", "chat_app"];
    const attempts = (id: ProblemId) => history.filter(item => problems[id].match.test(item.title)).length;
    const id = [...candidates].sort((a, b) => attempts(a) - attempts(b))[0];
    const previousLevel = history.find(item => item.status === "completed")?.level;
    const level = ["SDE1", "SDE2", "Senior"].includes(previousLevel ?? "") ? previousLevel! : "SDE1";
    return { id, ...problems[id], level, weakest };
}
