import { motion } from "framer-motion";
import type React from "react";
import { fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ eyebrow, title, subtitle, className }: SectionHeaderProps) {
  return (
    <motion.div variants={fadeInUp} className={cn("text-center mb-16", className)}>
      {eyebrow && (
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
      )}
    </motion.div>
  );
}
