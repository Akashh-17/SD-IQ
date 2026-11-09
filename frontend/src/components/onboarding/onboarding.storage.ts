const dismissedThisSession = new Set<string>();

export function onboardingKey(userId: string) {
    return `systemiq:onboarding:v1:${userId}`;
}

export function hasDismissedOnboarding(userId: string) {
    if (dismissedThisSession.has(userId)) return true;
    try { return localStorage.getItem(onboardingKey(userId)) === "done"; }
    catch { return false; }
}

export function dismissOnboarding(userId: string) {
    dismissedThisSession.add(userId);
    try { localStorage.setItem(onboardingKey(userId), "done"); }
    catch { /* Keep dismissal in memory when browser storage is unavailable. */ }
}
