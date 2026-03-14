import React from "react";
import { AnimatedSection } from "../components/animations";
import { cn } from "../lib/utils";

interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
}

export function Section({ 
  id, 
  children, 
  className,
  maxWidth = "5xl" 
}: SectionProps) {
  const maxWidthClasses = {
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    "full": "max-w-full",
  };

  return (
    <AnimatedSection
      id={id}
      className={cn(
        "border-t py-16 md:py-20 lg:py-24 border-border",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className={cn("mx-auto", maxWidthClasses[maxWidth])}>
          {children}
        </div>
      </div>
    </AnimatedSection>
  );
}
