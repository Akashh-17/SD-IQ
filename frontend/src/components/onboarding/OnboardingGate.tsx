import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../../services/auth.service";
import OnboardingDialog from "./OnboardingDialog";
import { dismissOnboarding, hasDismissedOnboarding } from "./onboarding.storage";

export default function OnboardingGate({ enabled = true }: { enabled?: boolean }) {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    useEffect(() => {
        if (!enabled) return;
        let active = true;
        getSession().then(session => {
            const id = session?.user.id;
            if (active && id && !hasDismissedOnboarding(id)) setUserId(id);
        }).catch(() => {});
        return () => { active = false; };
    }, [enabled]);

    if (!enabled || !userId) return null;
    function dismiss() { dismissOnboarding(userId!); setUserId(null); }
    return <OnboardingDialog key={userId} onDismiss={dismiss} onStart={() => { dismiss(); navigate("/problems"); }} />;
}
