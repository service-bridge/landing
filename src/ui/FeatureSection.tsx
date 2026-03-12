import React from "react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

interface FeatureSectionProps {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  content: React.ReactNode;
  demo: React.ReactNode;
  cards?: React.ReactNode;
}

export function FeatureSection({
  id,
  eyebrow,
  title,
  subtitle,
  content,
  demo,
  cards,
}: FeatureSectionProps) {
  return (
    <Section id={id}>
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>{content}</div>
        <div>{demo}</div>
      </div>
      {cards && (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards}
        </div>
      )}
    </Section>
  );
}
