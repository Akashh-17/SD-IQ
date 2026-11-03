import { motion } from 'framer-motion'
import { ListTree, MessageSquare, BarChart3, ArrowRight } from 'lucide-react'
import Reveal from './Reveal'

const STEPS = [
  {
    n: 1,
    icon: ListTree,
    title: 'Choose Problem',
    desc: 'Pick from a curated list of real-world system design problems.',
  },
  {
    n: 2,
    icon: MessageSquare,
    title: 'Interview',
    desc: 'Answer questions, draw architecture, and discuss your design with AI.',
  },
  {
    n: 3,
    icon: BarChart3,
    title: 'Get Report',
    desc: 'Receive AI feedback, score, missing concepts, and improvement tips.',
  },
]

export default function HowItWorks() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          How <span className="text-amber-400">SystemIQ</span> Works
        </h2>
      </Reveal>

      <div className="mt-12 flex flex-col items-stretch gap-6 lg:flex-row lg:items-center">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-6">
            <Reveal delay={i * 0.12} className="w-full">
              <div className="card flex h-full items-start gap-4 p-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-sm font-bold text-base-950">
                  {s.n}
                </span>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-white/70">
                    <s.icon size={18} />
                  </div>
                  <h3 className="font-display text-base font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">{s.desc}</p>
                </div>
              </div>
            </Reveal>

            {i < STEPS.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 + 0.2 }}
                className="hidden shrink-0 text-white/25 lg:block"
              >
                <ArrowRight size={22} />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
