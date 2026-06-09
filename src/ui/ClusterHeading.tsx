import { motion } from "framer-motion";
import { fadeInUp } from "../components/animations";

interface ClusterHeadingProps {
  label: string;
  title: string;
}

export function ClusterHeading({ label, title }: ClusterHeadingProps) {
  return (
    <div className="border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeInUp}
          className="mx-auto flex max-w-5xl flex-col items-center gap-3 py-14 text-center md:py-16"
        >
          <span className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">
            <span className="h-px w-8 bg-emerald-400/40" />
            {label}
            <span className="h-px w-8 bg-emerald-400/40" />
          </span>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl">
            {title}
          </h2>
        </motion.div>
      </div>
    </div>
  );
}
