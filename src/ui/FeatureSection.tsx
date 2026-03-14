import type React from "react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

interface FeatureSectionProps {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  content: React.ReactNode;
  demo: React.ReactNode;
  cards?: React.ReactNode;
  /** Which column should stick on scroll when columns differ in height.
   *  "demo" (default) — right/demo column sticks (content is taller).
   *  "content" — left/content column sticks (demo is taller). */
  stickyColumn?: "content" | "demo";
}

export function FeatureSection({
  id,
  eyebrow,
  title,
  subtitle,
  content,
  demo,
  cards,
  stickyColumn = "demo",
}: FeatureSectionProps) {
  return (
    <Section id={id}>
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mt-8 md:mt-12 grid items-start gap-6 md:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`min-w-0${stickyColumn === "content" ? " lg:sticky lg:top-24" : ""}`}>
          {content}
        </div>
        <div className={`min-w-0${stickyColumn === "demo" ? " lg:sticky lg:top-24" : ""}`}>
          {demo}
        </div>
      </div>
      {cards && <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards}</div>}
    </Section>
  );
}
