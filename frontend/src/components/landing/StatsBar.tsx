import { Boxes, Zap, BrainCircuit, FileText } from 'lucide-react'
import Reveal from './Reveal'

const STATS = [
  { icon: Boxes, value: '25+', label: 'System Design Problems' },
  { icon: Zap, value: 'Real-Time', label: 'AI-Powered Interviewer' },
  { icon: BrainCircuit, value: 'Adaptive', label: 'Follow-up Questions' },
  { icon: FileText, value: 'Detailed', label: 'Evaluation Reports' },
]

export default function StatsBar() {
  return (
    <section className="mx-auto max-w-7xl px-6">
      <Reveal>
        <div className="grid grid-cols-2 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07] bg-base-850/60 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3 px-6 py-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                <Icon size={19} />
              </span>
              <div>
                <p className="font-display text-lg font-bold leading-tight">{value}</p>
                <p className="text-xs leading-tight text-white/50">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
