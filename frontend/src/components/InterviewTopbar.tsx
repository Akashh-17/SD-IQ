import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    CircleDot,
    Clock3,
    LogOut,
} from "lucide-react";

import Logo from "./branding/Logo";
import { endInterview } from "../services/endInterview.service";
import { getInterviewState } from "../services/interviewState.service";
import ConfirmModal from "./ConfirmModal";

const INTERVIEW_DURATION = 45 * 60;

export default function Topbar() {

    const navigate = useNavigate();

    const { interviewId } = useParams();

    const [loading, setLoading] = useState(false);

    const [endTime, setEndTime] = useState<number | null>(null);

    const [remaining, setRemaining] = useState(INTERVIEW_DURATION);

    const [showEndModal, setShowEndModal] = useState(false);

    const autoEnded = useRef(false);

    // =====================================================
    // Load Interview
    // =====================================================

    useEffect(() => {

        if (!interviewId)

            return;

        const id = interviewId; // capture and narrow for TS

        async function loadInterview() {

            try {

                const state = await getInterviewState(id);

                setEndTime(

                    state.interview.startedAt +

                    INTERVIEW_DURATION * 1000

                );

            }

            catch (err) {

                console.error(err);

            }

        }

        loadInterview();

    }, [interviewId]);

    // =====================================================
    // Countdown
    // =====================================================

    useEffect(() => {

        if (!endTime)

            return;

        function tick() {

            const seconds = Math.max(

                Math.floor(

                    (endTime! - Date.now()) / 1000

                ),

                0

            );

            setRemaining(seconds);

        }

        tick();

        const interval = setInterval(

            tick,

            1000

        );

        return () => clearInterval(interval);

    }, [endTime]);

    // =====================================================
    // Auto End Interview
    // =====================================================

    useEffect(() => {

        if (

            remaining !== 0 ||

            autoEnded.current ||

            !interviewId

        )

            return;

        const id = interviewId; // capture and narrow for TS

        autoEnded.current = true;

        async function finishInterview() {

            try {

                setLoading(true);

                await endInterview(

                    id

                );

                navigate(

                    `/report/${id}`

                );

            }

            catch (err) {

                console.error(err);

                autoEnded.current = false;

            }

            finally {

                setLoading(false);

            }

        }

        finishInterview();

    }, [

        remaining,

        interviewId,

        navigate

    ]);

    // =====================================================
    // Format Timer
    // =====================================================

    function format(seconds: number) {

        const mins = Math.floor(

            seconds / 60

        );

        const secs = seconds % 60;

        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    }

    const urgent = remaining <= 300;

    const warning = remaining <= 900;

    // =====================================================
    // Manual End Interview
    // =====================================================

    async function handleEndInterview() {

        if (

            !interviewId ||

            loading

        )

            return;

        try {

            setLoading(true);

            await endInterview(

                interviewId

            );

            navigate(

                `/report/${interviewId}`

            );

        }

        catch (err) {

            console.error(err);

        }

        finally {

            setLoading(false);

            setShowEndModal(false);

        }

    }

    return (

        <header
            className="
                flex
                h-12
                shrink-0
                items-center
                justify-between
                border-b
                border-white/10
                bg-[#0B0C0F]
                px-5
            "
        >

            {/* Left */}

            <div className="flex items-center gap-5">

                <div className="origin-left scale-75">

                    <Logo />

                </div>

                <div className="h-5 w-px bg-white/10" />

                <div className="flex items-center gap-2 text-sm">

                    <CircleDot
                        size={10}
                        className="fill-green-500 text-green-500 animate-pulse"
                    />

                    <span className="font-medium text-white">

                        Live Interview

                    </span>

                    <span className="text-gray-600">

                        •

                    </span>

                    <span className="text-gray-400">

                        System Design

                    </span>

                </div>

            </div>
            {/* Right */}

            <div className="flex items-center gap-3">

                <div
                    className={`
                        flex
                        h-8
                        items-center
                        gap-2
                        rounded-lg
                        border
                        px-3
                        text-sm
                        font-mono
                        transition-colors

                        ${urgent
                            ? "border-red-500/40 bg-red-500/10 text-red-400"
                            : warning
                                ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                                : "border-white/10 bg-[#17181C] text-white"
                        }
                    `}
                >

                    <Clock3 size={14} />

                    {format(remaining)}

                </div>

                <button

                    onClick={() => setShowEndModal(true)}

                    disabled={loading}

                    className="
                        flex
                        h-8
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-red-500/30
                        bg-red-500/5
                        px-3
                        text-sm
                        font-medium
                        text-red-400
                        transition-all
                        hover:border-red-500
                        hover:bg-red-500
                        hover:text-white
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "

                >

                    <LogOut size={15} />

                    {

                        loading

                            ? "Ending..."

                            : "End"

                    }

                </button>

            </div>
            
            <ConfirmModal

                open={showEndModal}

                loading={loading}

                title="End Interview?"

                description="Once you end the interview your final report will be generated and you won't be able to continue the session."

                confirmText="End Interview"

                cancelText="Continue"

                onCancel={() => setShowEndModal(false)}

                onConfirm={handleEndInterview}

            />

        </header>


    );

}