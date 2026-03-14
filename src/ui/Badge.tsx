import type React from "react";
import { cn } from "../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}

export function Badge({ children, tone, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-3xs font-mono font-semibold",
        tone,
        className
      )}
    >
      {children}
    </span>
  );
}
