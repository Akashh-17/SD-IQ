import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

type PrimaryButtonProps = {
  children: ReactNode;
};

export default function PrimaryButton({ children }: PrimaryButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="group flex items-center gap-3 rounded-xl bg-yellow-400 px-7 py-4 font-semibold text-black transition-all duration-300 hover:bg-yellow-300"
    >
      {children}

      <ArrowRight
        className="transition-transform duration-300 group-hover:translate-x-1"
        size={18}
      />
    </motion.button>
  );
}