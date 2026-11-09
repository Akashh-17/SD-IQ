import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
    const media = window.matchMedia?.(query);
    media?.addEventListener("change", callback);
    return () => media?.removeEventListener("change", callback);
}

function snapshot() {
    return typeof window !== "undefined" && Boolean(window.matchMedia?.(query).matches);
}

// The installed Motion version snapshots this preference at mount. Subscribe
// here as well so switching the OS setting also stops animations already open.
export function useReducedMotion() {
    return useSyncExternalStore(subscribe, snapshot, () => true);
}
