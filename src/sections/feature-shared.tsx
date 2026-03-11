import { cn } from "../lib/utils";

export function FlowTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="type-overline-mono text-zinc-500">{label}</p>
      <p className={cn("mt-2 text-sm font-semibold font-display", tone)}>{value}</p>
    </div>
  );
}

export function ServicePill({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: string;
}) {
  return (
    <div className="min-w-[152px] rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
      <p className={cn("text-xs font-semibold font-display", tone)}>{title}</p>
      <p className="mt-1 type-code-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function SectionTag({ children, tone }: { children: string; tone: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-3xs font-mono font-semibold",
        tone
      )}
    >
      {children}
    </span>
  );
}
