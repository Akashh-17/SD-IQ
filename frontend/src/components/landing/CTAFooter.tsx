import { motion } from 'framer-motion'
import { ArrowRight, Rocket, Boxes } from 'lucide-react'
import Reveal from './Reveal'

export default function CTAFooter() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <Reveal>
          <motion.div
            whileHover={{ scale: 1.005 }}
            className="relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-base-850 to-base-850 px-8 py-12 text-center sm:flex-row sm:justify-between sm:text-left"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-[100px]" />
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-base-950">
                <Rocket size={22} />
              </span>
              <div>
                <h3 className="font-display text-2xl font-bold">
                  Ready to Ace Your Next<br className="hidden sm:block" /> System Design Interview?
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  Join thousands of engineers improving every day with AI.
                </p>
              </div>
            </div>
            <a href="#start" className="btn-primary shrink-0">
              Start Interview Now <ArrowRight size={16} />
            </a>
          </motion.div>
        </Reveal>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
          <a href="#" className="flex items-center gap-2 font-display font-bold text-white/80">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-base-950">
              <Boxes size={15} strokeWidth={2.5} />
            </span>
            SystemIQ
          </a>
          <p>© {new Date().getFullYear()} SystemIQ. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
