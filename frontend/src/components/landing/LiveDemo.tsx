import { motion } from 'framer-motion'
import { ArrowRight, Boxes, User } from 'lucide-react'
import Reveal from './Reveal'

export default function LiveDemo() {
  return (
    <section id="demo" className="mx-auto max-w-7xl px-6 pb-24">
      <Reveal className="mb-10 text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          Try a <span className="text-amber-400">Live</span> Demo
        </h2>
        <p className="mt-2 text-sm text-white/50">Experience SystemIQ in action</p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="card flex flex-col items-stretch gap-4 overflow-hidden p-6 lg:flex-row lg:items-center">
          {[
            { who: 'AI Interviewer', icon: Boxes, text: 'Design TinyURL. How would you design it?' },
            { who: 'You', icon: User, text: "I'll use a base62 encoding with a counter and store mapping in a DB." },
            {
              who: 'AI Interviewer',
              icon: Boxes,
              text: 'Great! How would you handle high availability and millions of requests per second?',
            },
          ].map((m, i, arr) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.45 }}
              className="flex flex-1 items-center gap-3"
            >
              <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/45">
                  <m.icon size={13} /> {m.who}
                </p>
                <p className="text-sm leading-snug text-white/80">{m.text}</p>
              </div>
              {i < arr.length - 1 && <ArrowRight size={18} className="hidden shrink-0 text-white/25 lg:block" />}
            </motion.div>
          ))}

          <div className="w-full shrink-0 lg:w-56">
            <div className="mb-2 flex items-center gap-1 text-xs text-amber-400">
              Diagram updated <ArrowRight size={12} />
            </div>
            <div className="relative h-28 rounded-xl border border-white/[0.06] bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:12px_12px]">
              <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded bg-amber-400 px-2 py-0.5 text-[9px] font-semibold text-base-950">
                Gateway
              </div>
              <div className="absolute bottom-3 left-3 rounded border border-white/10 bg-base-700 px-1.5 py-0.5 text-[9px] text-white/70">
                Shortener
              </div>
              <div className="absolute bottom-3 right-3 rounded border border-white/10 bg-base-700 px-1.5 py-0.5 text-[9px] text-white/70">
                Database
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
