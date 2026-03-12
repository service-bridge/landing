import { motion } from "framer-motion";
import type React from "react";
import { fadeInUp } from "../components/animations";
import { Eyebrow } from "./Eyebrow";

interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function SectionHeader({ eyebrow, title, subtitle }: SectionHeaderProps) {
  return (
    <motion.div variants={fadeInUp} className="mb-16 text-center">
      {eyebrow && <Eyebrow variant="plain">{eyebrow}</Eyebrow>}
      <h2 className="text-gradient text-3xl font-bold tracking-tight font-display sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
