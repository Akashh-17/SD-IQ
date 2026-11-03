import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Boxes, Moon, Sun, Menu, X, ArrowRight } from 'lucide-react'

const LINKS = ['Features', 'Problems', 'Pricing', 'Blog', 'Resources']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'border-b border-white/[0.06] bg-base-950/80 backdrop-blur-lg' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-base-950">
            <Boxes size={18} strokeWidth={2.5} />
          </span>
          SystemIQ
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
          {LINKS.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="transition-colors hover:text-white">
              {l}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            aria-label="Toggle theme"
            onClick={() => setDark((d) => !d)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:text-white"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a href="login" className="btn-secondary !px-4 !py-2 text-sm">
            Log in
          </a>
          <a href="login" className="btn-primary !px-4 !py-2 text-sm">
            Start Interview <ArrowRight size={15} />
          </a>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-white/10 px-6 py-4 md:hidden"
        >
          <div className="flex flex-col gap-4 text-sm text-white/70">
            {LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`}>
                {l}
              </a>
            ))}
            <a href="login" className="btn-primary mt-2 w-full">
              Start Interview <ArrowRight size={15} />
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
