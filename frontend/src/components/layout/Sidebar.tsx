import {
    BarChart3,
    Bug,
    FileText,
    LayoutDashboard,
} from "lucide-react";

import Logo from "../branding/Logo";
import SidebarItem from "./SidebarItem";
import ProfileMenu from "./ProfileMenu";

export default function Sidebar() {

    return (

        <aside
            className="
                fixed
                left-0
                top-0
                flex
                h-screen
                w-64
                flex-col
                border-r
                border-white/10
                bg-base
            "
        >

            {/* Logo */}

            <div className="border-b border-white/10 px-6 py-5">

                <Logo />

            </div>

            {/* Navigation */}

            <nav className="flex-1 px-3 py-5">

                <div className="space-y-1">

                    <SidebarItem
                        icon={LayoutDashboard}
                        title="Dashboard"
                        path="/dashboard"
                    />

                    <SidebarItem
                        icon={Bug}
                        title="Practice"
                        path="/problems"
                    />

                    <SidebarItem
                        icon={FileText}
                        title="History"
                        path="/history"
                    />

                    <SidebarItem
                        icon={BarChart3}
                        title="Progress"
                        path="/progress"
                    />

                </div>

            </nav>

            {/* Profile */}

            <div className="border-t border-white/10 p-4">

                <ProfileMenu />

            </div>

        </aside>

    );

}