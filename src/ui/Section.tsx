import React from "react";
import { AnimatedSection } from "../components/animations";
import { cn } from "../lib/utils";

interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ id, children, className }: SectionProps) {
  return (
    <AnimatedSection
      id={id}
      className={cn(
        "border-t py-24",
        "border-[color:hsl(var(--section-border))]",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </AnimatedSection>
  );
}
