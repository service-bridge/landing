import type React from "react";
import { cn } from "../lib/utils";

interface MiniCardProps {
  icon: React.ElementType;
  iconClassName?: string;
  title: string;
  desc: string;
  className?: string;
}

export function MiniCard({ icon: Icon, iconClassName, title, desc, className }: MiniCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4",
        className
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", iconClassName ?? "text-primary")} />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
