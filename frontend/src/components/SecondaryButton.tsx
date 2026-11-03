import { PlayCircle } from "lucide-react";

export default function SecondaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex items-center gap-3 rounded-xl border border-zinc-700 px-7 py-4 text-white transition hover:border-yellow-400 hover:bg-white/[0.02]">
      <PlayCircle size={20} />

      {children}
    </button>
  );
}