import { useCallback, useEffect, useState } from "react";
import { getHistory } from "../../services/history.service";
import { normalizeHistory, type HistoryItem } from "./history.model";

export function useHistory() {
    const [state, setState] = useState<{ items: HistoryItem[]; phase: "loading" | "ready" | "error" }>({ items: [], phase: "loading" });
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        getHistory().then(normalizeHistory).then(items => {
            if (active) setState({ items, phase: "ready" });
        }).catch(() => { if (active) setState({ items: [], phase: "error" }); });
        return () => { active = false; };
    }, [attempt]);
    const retry = useCallback(() => {
        setState(previous => ({ ...previous, phase: "loading" }));
        setAttempt(previous => previous + 1);
    }, []);
    return { ...state, retry };
}
