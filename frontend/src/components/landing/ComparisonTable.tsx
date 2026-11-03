import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import Reveal from './Reveal'

const ROWS = [
  { feature: 'Learning Experience', old: 'Read articles / blogs', neu: 'Interactive AI Interview' },
  { feature: 'Diagramming', old: 'Static diagrams', neu: 'Live diagram canvas' },
  { feature: 'Feedback', old: 'No feedback', neu: 'AI-powered evaluation' },
  { feature: 'Follow-ups', old: 'No follow-up questions', neu: 'Adaptive probing' },
  { feature: 'Improvement', old: 'Generic advice', neu: 'Personalized improvement reports' },
]

export default function ComparisonTable() {
  const lastRow = ROWS.length - 1

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <Reveal className="mb-10 text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          Why <span className="text-amber-400">SystemIQ</span>?
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        {/*
          A single CSS grid (not stacked per-row grids) so every cell in the third
          column shares one continuous left border + tint, forming a real box
          around the "SystemIQ" column that always lines up with row height,
          instead of an absolutely-positioned guess.
        */}
        <div className="card grid grid-cols-3 overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4 text-sm font-semibold text-white/50">Feature</div>
          <div className="border-b border-white/[0.06] px-6 py-4 text-sm font-semibold text-white/50">
            Traditional Practice
          </div>
          <div className="rounded-t-xl border-b border-l-2 border-amber-400/50 bg-amber-400/[0.06] px-6 py-4 text-sm font-semibold text-amber-400">
            SystemIQ
          </div>

          {ROWS.map((r, i) => (
            <motion.div
              key={`feature-${r.feature}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center px-6 py-4 text-sm font-medium text-white/85 ${
                i !== lastRow ? 'border-b border-white/[0.05]' : ''
              }`}
            >
              {r.feature}
            </motion.div>
          ))}

          {ROWS.map((r, i) => (
            <motion.div
              key={`old-${r.feature}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 + 0.03 }}
              className={`flex items-center gap-2 px-6 py-4 text-sm text-white/45 ${
                i !== lastRow ? 'border-b border-white/[0.05]' : ''
              }`}
            >
              <X size={14} className="shrink-0 text-rose-500" />
              {r.old}
            </motion.div>
          ))}

          {ROWS.map((r, i) => (
            <motion.div
              key={`new-${r.feature}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 + 0.06 }}
              className={`flex items-center gap-2 border-l-2 border-amber-400/50 bg-amber-400/[0.06] px-6 py-4 text-sm font-medium text-white ${
                i !== lastRow ? 'border-b border-white/[0.05]' : 'rounded-b-xl'
              }`}
            >
              <Check size={14} className="shrink-0 text-emerald-400" />
              {r.neu}
            </motion.div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
