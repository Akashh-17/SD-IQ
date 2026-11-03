import { motion } from 'framer-motion'
import { Check, LineChart } from 'lucide-react'
import Reveal from './Reveal'

const FEATURES = [
  {
    title: 'AI Interviewer',
    color: 'text-amber-400',
    points: ['Adaptive questioning', 'Real conversation', 'No scripted flow', 'Deep follow-up probes'],
    preview: 'chat',
  },
  {
    title: 'Diagram Canvas',
    color: 'text-amber-400',
    points: ['Drag & drop components', 'Connect services', 'Auto-layout', 'Architecture evaluation'],
    preview: 'diagram',
  },
  {
    title: 'AI Evaluation',
    color: 'text-amber-400',
    points: ['Strengths & weaknesses', 'Missing concepts', 'Detailed feedback', 'Actionable suggestions'],
    preview: 'score',
  },
  {
    title: 'Progress Tracking',
    color: 'text-amber-400',
    points: ['Interview history', 'Score improvement', 'Analytics & insights', 'Coming soon'],
    preview: 'trend',
  },
]

function MiniPreview({ kind }: { kind: string }) {
  if (kind === 'chat') {
    return (
      <div className="space-y-2">
        <div className="w-2/3 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[10px] text-white/60">
          Design TinyURL. How would you generate the feed…
        </div>
        <div className="ml-auto w-1/2 rounded-lg bg-amber-400/15 px-2.5 py-1.5 text-[10px] text-amber-100">
          I'll use base62 encoding…
        </div>
      </div>
    )
  }
  if (kind === 'diagram') {
    return (
      <div className="relative h-20 rounded-lg border border-white/[0.06] bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:10px_10px]">
        <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded bg-amber-400 px-2 py-0.5 text-[8px] font-semibold text-base-950">
          Gateway
        </div>
        <div className="absolute bottom-2 left-3 rounded border border-white/10 bg-base-700 px-1.5 py-0.5 text-[8px] text-white/70">
          Service
        </div>
        <div className="absolute bottom-2 right-3 rounded border border-white/10 bg-base-700 px-1.5 py-0.5 text-[8px] text-white/70">
          Cache
        </div>
      </div>
    )
  }
  if (kind === 'score') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-emerald-400/70 text-sm font-bold text-emerald-300">
          86
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div className="h-1.5 w-4/5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div className="h-1.5 w-2/5 rounded-full bg-rose-400/70" />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-20 items-end gap-1.5 rounded-lg border border-white/[0.06] p-3">
      {[40, 55, 35, 70, 50, 85, 65].map((h, i) => (
        <motion.span
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          className="w-full rounded-t bg-amber-400/60"
        />
      ))}
      <LineChart size={0} className="hidden" />
    </div>
  )
}

export default function FeatureShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 2) * 0.1} className="h-full">
            <div className="card flex h-full flex-col gap-6 p-6 sm:flex-row sm:items-center">
              <div className="sm:w-2/5">
                <MiniPreview kind={f.preview} />
              </div>
              <div className="sm:w-3/5">
                <h3 className={`font-display text-lg font-semibold ${f.color}`}>{f.title}</h3>
                <ul className="mt-3 space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-white/65">
                      <Check size={14} className="shrink-0 text-amber-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
