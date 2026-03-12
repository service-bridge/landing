import React from "react";
import { cn } from "../lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  variant?: "plain" | "pill";
  tone?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function Eyebrow({
  children,
  variant = "plain",
  tone,
  icon,
  className,
}: EyebrowProps) {
  const textClasses = "text-sm font-semibold uppercase tracking-widest";

  if (variant === "plain") {
    return (
      <p className={cn(textClasses, "text-emerald-400 mb-4", className)}>
        {children}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5",
        tone,
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className={textClasses}>{children}</span>
    </div>
  );
}
