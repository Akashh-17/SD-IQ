import { motion } from 'framer-motion'
import { ArrowRight, Play, Sparkles, Star, Clock, MousePointer2, Square, Type, Circle, Plus } from 'lucide-react'
import Reveal from './Reveal'
import { Typewriter } from 'react-simple-typewriter'

const AVATARS = [
  'https://i.pravatar.cc/64?img=12',
  'https://i.pravatar.cc/64?img=32',
  'https://i.pravatar.cc/64?img=5',
  'https://i.pravatar.cc/64?img=48',
]

const CHAT = [
  { who: 'ai', text: "Let's design Instagram. How would you generate the feed?" },
  { who: 'user', text: "I'll use a combination of fanout-on-write and fanout-on-read." },
]

const NODES = [
  { id: 'mobile', label: 'Mobile App', x: 50, y: 4, tone: 'plain' },
  { id: 'gateway', label: 'API Gateway', x: 50, y: 22, tone: 'amber' },
  { id: 'user', label: 'User Service', x: 14, y: 46, tone: 'plain' },
  { id: 'feed', label: 'Feed Service', x: 50, y: 46, tone: 'plain' },
  { id: 'media', label: 'Media Service', x: 84, y: 46, tone: 'plain' },
  { id: 'cache', label: 'Redis Cache', x: 30, y: 70, tone: 'green' },
  { id: 'db', label: 'Database', x: 68, y: 70, tone: 'violet' },
] as const

const EDGES: [string, string][] = [
  ['mobile', 'gateway'],
  ['gateway', 'user'],
  ['gateway', 'feed'],
  ['gateway', 'media'],
  ['feed', 'cache'],
  ['feed', 'db'],
]

const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]))

const toneClasses: Record<string, string> = {
  plain: 'bg-base-700/80 border-white/10 text-white/90',
  amber: 'bg-amber-400 border-amber-300 text-base-950 font-semibold',
  green: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
  violet: 'bg-violet-500/15 border-violet-400/40 text-violet-300',
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, black 40%, transparent 100%)',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-[-140px] -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-[120px]" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 pb-20 pt-8 lg:grid-cols-[1.05fr_1.15fr] lg:items-center lg:pt-10">
        {/* Left column */}
        <div>
          <Reveal>
            <span className="eyebrow">
              <Sparkles size={13} className="text-amber-400" />
              AI-Powered System Design Interviewer
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
              <span className="block">
                Master
              </span>

              <span className="mt-2 block min-h-[1.2em] text-amber-400">
                <Typewriter
                  words={[
                    'System Design',
                    'Machine Coding',
                    'Low Level Design',
                    'Design Interviews',
                    'Cloud Architecture',
                  ]}
                  loop={0}
                  cursor
                  cursorStyle="|"
                  typeSpeed={70}
                  deleteSpeed={40}
                  delaySpeed={1800}
                />
              </span>

              <span className="mt-2 block text-white">
                with <span className="text-amber-400">AI</span>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 max-w-lg text-balance text-lg leading-relaxed text-white/60">
              Practice realistic interviews. Get adaptive follow-up questions, diagram your
              architecture, and receive AI-powered feedback to improve faster.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#start" className="btn-primary">
                Start Interview <ArrowRight size={16} />
              </a>
              <a href="#demo" className="btn-secondary">
                <Play size={15} /> Watch Demo
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-3">
                {AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-9 w-9 rounded-full border-2 border-base-950 object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <p className="text-xs text-white/50">Loved by 2,000+ engineers</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right column: interactive demo panel */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="card overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-400/90 text-base-950">
                <Square size={11} />
              </span>
              Design Instagram
              <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
                Hard
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Clock size={13} /> 24:36
              </span>
              <span className="text-rose-400">End Interview</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[34%_66%]">
            {/* Chat column */}
            <div className="flex flex-col justify-between border-b border-white/[0.06] p-4 sm:border-b-0 sm:border-r">
              <div className="space-y-3">
                {CHAT.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.35, duration: 0.4 }}
                    className={m.who === 'ai' ? '' : 'flex justify-end'}
                  >
                    <div className="max-w-[85%]">
                      <p className="mb-1 text-[11px] font-medium text-white/40">
                        {m.who === 'ai' ? 'AI Interviewer' : 'You'}
                      </p>
                      <div
                        className={`rounded-xl px-3 py-2 text-[13px] leading-snug ${m.who === 'ai'
                          ? 'bg-white/[0.05] text-white/85'
                          : 'bg-amber-400/15 text-amber-100'
                          }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`h-1 w-1 rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-white/20'}`} />
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[13px] text-white/40">
                Type your answer...
                <ArrowRight size={13} className="ml-auto" />
              </div>
            </div>

            {/* Diagram column */}
            <div className="p-4">
              <div className="mb-3 flex items-center gap-4 text-xs font-medium text-white/45">
                <span>Architecture</span>
                <span className="border-b-2 border-amber-400 pb-1 text-amber-400">Diagram</span>
                <span>Notes</span>
              </div>

              <div className="relative flex gap-2">
                <div className="flex flex-col gap-2 pt-1 text-white/35">
                  <MousePointer2 size={13} />
                  <Square size={13} />
                  <Type size={13} />
                  <Circle size={13} />
                  <Plus size={13} />
                </div>

                <div className="relative h-[260px] flex-1 overflow-hidden rounded-lg border border-white/[0.06] bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:14px_14px] px-1">
                  <svg
                    className="absolute inset-0 h-full w-full"
                    style={{ transform: "translateX(-10px)" }}
                  >
                    {EDGES.map(([a, b], i) => {
                      const from = nodeMap[a as keyof typeof nodeMap]
                      const to = nodeMap[b as keyof typeof nodeMap]
                      return (
                        <motion.line
                          key={i}
                          x1={`${from.x}%`}
                          y1={`${from.y + 6}%`}
                          x2={`${to.x}%`}
                          y2={`${to.y}%`}
                          stroke="rgba(255,255,255,0.18)"
                          strokeWidth={1.5}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ delay: 0.9 + i * 0.15, duration: 0.5 }}
                        />
                      )
                    })}
                  </svg>

                  <div
                    className="absolute inset-0"
                    style={{ transform: "translateX(-38px)" }}
                  >
                    {NODES.map((n, i) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + i * 0.12, duration: 0.35 }}
                        className={`absolute -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] leading-none shadow-md ${toneClasses[n.tone]}`}
                        style={{ left: `${n.x}%`, top: `${n.y}%` }}
                      >
                        {n.label}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="flex items-center gap-4 border-t border-white/[0.06] px-4 py-2"
          >
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-emerald-400/70 text-[11px] font-bold text-emerald-300">
              84
              <span className="absolute -bottom-1 text-[7px] font-medium text-emerald-300/70">/100</span>
            </div>
            <div className="flex-1 text-xs text-white/60">
              <p className="text-white/85">Good start! You covered core components.</p>
              <p className="text-emerald-400/80">Strengths</p>
              <p className="text-rose-400/80">Missing Concepts</p>
            </div>
            <a href="#report" className="btn-secondary !px-3 !py-1.5 text-xs">
              View Report <ArrowRight size={12} />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
