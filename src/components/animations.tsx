import { motion, useInView, useReducedMotion } from "framer-motion";
import type React from "react";
import { useRef } from "react";

export const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

export function AnimatedSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      id={id}
      variants={stagger}
      initial={prefersReducedMotion ? "visible" : "hidden"}
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}
