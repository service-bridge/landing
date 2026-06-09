import type React from "react";
import { cn } from "../lib/utils";

interface CodePanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export function CodePanel({ title, children, className, headerActions }: CodePanelProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border border-border bg-card", className)}
    >
      {(title || headerActions) && (
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-foreground/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-foreground/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-foreground/10" />
            </div>
            {title && <span className="ml-2 text-xs font-mono text-muted-foreground">{title}</span>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
