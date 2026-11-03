import { motion } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";
import Logo from "../branding/Logo";
import Reveal from "../landing/Reveal";

interface Props {
    children: React.ReactNode;
}

const FEATURES = [
    "Real interview simulation",
    "AI architecture evaluation",
    "Detailed feedback reports",
    "Interview history",
];

const AVATARS = [
    "https://i.pravatar.cc/64?img=12",
    "https://i.pravatar.cc/64?img=32",
    "https://i.pravatar.cc/64?img=5",
];

export default function AuthLayout({ children }: Props) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-base-950">
            {/* Ambient grid, matching the landing hero */}
            <div
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                    maskImage:
                        "radial-gradient(ellipse 70% 55% at 50% 0%, black 40%, transparent 100%)",
                }}
            />

            {/* Slow-drifting ambient gradient orbs */}
            <motion.div
                animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute left-[-120px] top-[-120px] -z-10 h-[420px] w-[420px] rounded-full bg-amber-400/10 blur-[120px]"
            />
            <motion.div
                animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="pointer-events-none absolute bottom-[-140px] right-[-100px] -z-10 h-[380px] w-[380px] rounded-full bg-violet-500/10 blur-[120px]"
            />

            <div className="mx-auto flex min-h-screen max-w-7xl">
                {/* Left */}
                <div className="relative hidden w-3/5 flex-col justify-between p-14 px-10 lg:flex">
                    <Logo />

                    <div>
                        <Reveal delay={0.08}>
                            <h1 className="mb-5 font-display text-5xl font-bold leading-[1.08] tracking-tight text-white">
                                Master

                                System Design

                                Interviews.
                            </h1>
                        </Reveal>

                        <Reveal delay={0.16}>
                            <p className="mb-6 max-w-lg text leading-relaxed text-white/60">
                                Practice with an AI interviewer that asks follow-up
                                questions, evaluates architecture, and delivers
                                professional feedback.
                            </p>
                        </Reveal>

                        <Reveal delay={0.24}>
                            <div className="grid max-w-lg grid-cols-2 gap-3">
                                {FEATURES.map((item, i) => (
                                    <motion.div
                                        key={item}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                                        className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3"
                                    >
                                        <CheckCircle2
                                            className="shrink-0 text-emerald-400"
                                            size={16}
                                        />
                                        <span className="text-sm text-white/70">{item}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </Reveal>
                    </div>

                    {/* Signature element: a floating testimonial, gently animating */}
                    <Reveal delay={0.32}>
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex -space-x-2.5">
                                    {AVATARS.map((src, i) => (
                                        <img
                                            key={i}
                                            src={src}
                                            alt=""
                                            className="h-7 w-7 rounded-full border-2 border-base-950 object-cover"
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-0.5 text-amber-400">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed text-white/80">
                                "The follow-up questions felt like a real bar-raiser
                                interview. I walked into my onsite calm and ready."
                            </p>
                            <p className="mt-3 text-xs text-white/40">
                                Senior Backend Engineer, hired after 6 sessions
                            </p>
                        </motion.div>
                    </Reveal>
                </div>

                {/* Right */}
                <div className="flex flex-1 items-center justify-center p-8 px-0">
                    {children}
                </div>
            </div>
        </div>
    );
}