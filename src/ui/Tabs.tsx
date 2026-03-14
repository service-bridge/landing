import { cn } from "../lib/utils";

export interface TabItem {
  id: string;
  label: string;
}

interface TabStripProps<T extends string> {
  items: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  /** sm — compact (language switcher); md — standard (feature switcher) */
  size?: "sm" | "md";
  className?: string;
}

export function TabStrip<T extends string>({
  items,
  active,
  onChange,
  size = "md",
  className,
}: TabStripProps<T>) {
  return (
    <div className={cn("flex gap-0.5 rounded-lg bg-surface p-0.5 w-fit", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-md font-medium transition-colors cursor-pointer",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
            active === item.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
