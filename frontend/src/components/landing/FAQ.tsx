import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'
import Reveal from './Reveal'

const FAQS = [
  { q: 'Is SystemIQ free to use?', a: 'You can start practicing for free with a limited set of problems. Paid plans unlock the full problem library, unlimited interviews, and detailed history tracking.' },
  { q: 'Does it support voice input?', a: 'Yes — you can speak your answers naturally during the interview and SystemIQ will transcribe and respond in real time.' },
  { q: 'Can I use my own diagrams?', a: 'Absolutely. You can import an existing architecture or start from a blank canvas and build it live during the session.' },
  { q: 'How is it different from ChatGPT?', a: 'SystemIQ is purpose-built for system design practice: it drives the interview, evaluates your diagram structurally, and scores you against real interview rubrics.' },
  { q: 'Free interview now?', a: 'Yes, click "Start Interview" on the homepage to begin a free session — no credit card required.' },
  { q: 'How are reports generated?', a: 'Each session is scored against a rubric covering scalability, reliability, trade-offs, and communication, then summarized into an actionable report.' },
  { q: 'Which companies use this?', a: 'Engineers preparing for interviews at companies of every size use SystemIQ, from early-stage startups to large tech companies.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <Reveal className="mb-10 flex items-end justify-between">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h2>
        <a href="#faq-all" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-amber-400 sm:flex">
          View all <ArrowRight size={14} />
        </a>
      </Reveal>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <Reveal key={f.q} delay={(i % 2) * 0.06} className="h-fit">
              <div className="card overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium"
                  aria-expanded={isOpen}
                >
                  {f.q}
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown size={16} className="text-white/50" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm leading-relaxed text-white/55">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
