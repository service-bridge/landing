import React from "react";
import { cn } from "../lib/utils";
import { Badge } from "./Badge";
import { Card } from "./Card";

type FeatureCardVariant = "default" | "stat" | "highlight" | "compact" | "large";

interface FeatureCardProps {
  variant?: FeatureCardVariant;
  icon?: React.ElementType;
  iconClassName?: string;
  iconBg?: string;
  title: string;
  description: string;
  badge?: string;
  badgeTone?: string;
  stat?: string;
  statLabel?: string;
  className?: string;
}

export function FeatureCard({
  variant = "default",
  icon: Icon,
  iconClassName,
  iconBg,
  title,
  description,
  badge,
  badgeTone,
  stat,
  statLabel,
  className,
}: FeatureCardProps) {
  if (variant === "stat") {
    return (
      <Card className={cn("px-5 py-4 text-center", className)}>
        {stat && (
          <p className="font-display text-2xl font-bold tabular-nums">{stat}</p>
        )}
        <p className="type-body-sm mt-1 leading-snug">{description}</p>
        {statLabel && (
          <p className="text-2xs mt-1.5 font-mono opacity-50">{statLabel}</p>
        )}
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Card className={cn("flex items-start gap-3 p-4", className)}>
        {Icon && (
          <Icon
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0",
              iconClassName ?? "text-emerald-400"
            )}
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="type-body-sm mt-0.5 leading-relaxed">{description}</p>
        </div>
      </Card>
    );
  }

  if (variant === "highlight") {
    return (
      <Card className={cn("flex flex-col gap-1.5 p-3", className)}>
        <p className="type-overline-mono">{title}</p>
        <p className="type-body-sm">{description}</p>
      </Card>
    );
  }

  // Shared styles for default and large variants
  const isLarge = variant === "large";
  
  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden transition-all duration-300",
        "hover:border-white/[0.12] hover:bg-white/[0.035]",
        isLarge && "hover:shadow-lg hover:shadow-black/20",
        className
      )}
    >
      {/* Blur effect */}
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100",
          iconBg || "bg-white/[0.03]"
        )}
      />
      
      <div className="relative flex h-full flex-col">
        {Icon && (
          <div
            className={cn(
              "mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/[0.06]",
              iconBg
            )}
          >
            <Icon className={cn("h-5 w-5", iconClassName)} />
          </div>
        )}
        
        <div className="mb-2 flex flex-wrap items-start gap-2">
          <h3 className="type-subsection-title leading-snug">{title}</h3>
          {badge && <Badge tone={badgeTone}>{badge}</Badge>}
        </div>
        
        <p className="type-body-sm flex-1 leading-relaxed">{description}</p>
        
        {stat && (
          <div className="mt-5 flex items-baseline gap-1.5 border-t border-surface-border pt-4">
            <span
              className={cn(
                "font-display text-3xl font-bold tabular-nums",
                iconClassName
              )}
            >
              {stat}
            </span>
            <span className="type-body-sm">{statLabel}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
