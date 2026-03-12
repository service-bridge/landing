import React from "react";
import { cn } from "../lib/utils";

interface CodePanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function CodePanel({ title, children, className }: CodePanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-surface-border bg-code",
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-2 border-b border-surface-border bg-code-chrome px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
          </div>
          <span className="ml-2 text-xs font-mono text-zinc-500">{title}</span>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
