import ChatPanel from "../components/ChatPanel";
import Diagram from "../components/Diagram";
import Topbar from "../components/InterviewTopbar";

import {
    Group,
    Panel,
    Separator,
} from "react-resizable-panels";

export default function Interview() {

    return (

        <div className="flex h-screen flex-col bg-[#09090B]">

            <Topbar />

            <Group
                orientation="horizontal"
                className="flex-1"
            >

                <Panel
                    defaultSize="60%"
                    minSize="35%"
                >

                    <Diagram />

                </Panel>

                <Separator
                    className="
            w-[4px]
            cursor-col-resize
            bg-white/10
            hover:bg-[#F5B301]
            transition-colors
        "
                />

                <Panel
                    defaultSize="40%"
                    minSize="25%"
                >

                    <ChatPanel />

                </Panel>

            </Group>

        </div>

    );

}