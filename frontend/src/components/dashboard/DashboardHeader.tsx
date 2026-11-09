import { useEffect, useState } from "react";
import { getSession } from "../../services/auth.service";

export default function DashboardHeader() {
    const [name, setName] = useState("engineer");
    useEffect(() => {
        let active = true;
        getSession().then(session => {
            const user = session?.user;
            const display = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim().split(" ")[0] : user?.email?.split("@")[0];
            if (active && display) setName(display.slice(0, 40));
        }).catch(() => {});
        return () => { active = false; };
    }, []);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    return <header><p className="section-kicker mb-3">Your practice workspace</p><h1 className="text-h2">{greeting}, <span className="text-accent">{name}.</span></h1><p className="mt-3 text-sm leading-relaxed text-muted">One conversation closer to a clearer way of thinking.</p></header>;
}
