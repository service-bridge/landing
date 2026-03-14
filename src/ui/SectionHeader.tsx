import { motion } from "framer-motion";
import type React from "react";
import { fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";
import { Eyebrow } from "./Eyebrow";

interface SectionHeaderProps {
  eyebrow?: string;
  eyebrowTone?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
}

export function SectionHeader({
  eyebrow,
  eyebrowTone,
  title,
  subtitle,
  align = "center",
}: SectionHeaderProps) {
  const titleClasses = "font-display font-bold tracking-tight text-3xl sm:text-4xl";

  const containerClasses = cn("mb-10 md:mb-16", align === "center" ? "text-center" : "text-left");

  return (
    <motion.div variants={fadeInUp} className={containerClasses}>
      {eyebrow && (
        <Eyebrow variant="plain" tone={eyebrowTone}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2 className={titleClasses}>{title}</h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-lg text-muted-foreground",
            align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"
          )}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
