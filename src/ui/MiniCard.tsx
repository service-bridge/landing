import type React from "react";
import { cn } from "../lib/utils";
import { Card } from "./Card";

interface MiniCardProps {
  icon: React.ElementType;
  iconClassName?: string;
  title: string;
  desc: string;
  className?: string;
}

export function MiniCard({
  icon: Icon,
  iconClassName,
  title,
  desc,
  className,
}: MiniCardProps) {
  return (
    <Card className={cn("flex items-start gap-3 p-4", className)}>
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          iconClassName ?? "text-emerald-400"
        )}
      />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="type-body-sm mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </Card>
  );
}
