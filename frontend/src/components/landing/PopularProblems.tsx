import { motion } from 'framer-motion'
import Reveal from './Reveal'
import { FaInstagram, FaYoutube, FaWhatsapp, FaSpotify } from "react-icons/fa";
import { Link2, HardDrive, FileText, ArrowRight } from "lucide-react";

const PROBLEMS = [
  { name: "WhatsApp", icon: FaWhatsapp, diff: "Medium", bg: "#25D366" },
  { name: "Instagram", icon: FaInstagram, diff: "Hard", bg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" },
  { name: "TinyURL", icon: Link2, diff: "Easy", bg: "#3b82f6" },
  { name: "Google Drive", icon: HardDrive, diff: "Hard", bg: "#34a853" },
  { name: "YouTube", icon: FaYoutube, diff: "Hard", bg: "#ff0000" },
  { name: "Google Docs", icon: FileText, diff: "Hard", bg: "#4285f4" },
  { name: "Spotify", icon: FaSpotify, diff: "Medium", bg: "#1db954" },
];

const diffColor: Record<string, string> = {
  Easy: 'text-emerald-400 bg-emerald-400/10',
  Medium: 'text-amber-400 bg-amber-400/10',
  Hard: 'text-rose-400 bg-rose-400/10',
}

export default function PopularProblems() {
  return (
    <section id="problems" className="mx-auto max-w-7xl px-6 pb-24">
      <Reveal className="mb-10 flex items-end justify-between">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          Popular <span className="text-amber-400">System Design</span> Problems
        </h2>
        <a href="#all-problems" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-amber-400 sm:flex">
          View all problems <ArrowRight size={14} />
        </a>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {PROBLEMS.map((p, i) => (
          <motion.a
            href="#"
            key={p.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="card flex flex-col items-center gap-3 p-5 text-center transition-colors hover:border-amber-400/30"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ background: p.bg }}
            >
              <p.icon size={20} />
            </span>
            <p className="text-sm font-medium">{p.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${diffColor[p.diff]}`}>
              {p.diff}
            </span>
          </motion.a>
        ))}
      </div>
    </section>
  )
}
