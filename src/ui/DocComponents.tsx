import { useState } from "react";
import { cn } from "../lib/utils";

// ─── Typography ───────────────────────────────────────────────────────────────

export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-lg font-bold font-display mt-10 mb-3 text-foreground scroll-mt-8 group flex items-center gap-2"
    >
      {children}
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-30 text-muted-foreground transition-opacity text-sm font-normal"
      >
        #
      </a>
    </h2>
  );
}

export function H3({ id, children }: { id: string; children?: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="text-sm font-semibold mt-7 mb-2.5 text-foreground/85 scroll-mt-8 group flex items-center gap-2"
    >
      {children}
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-30 text-muted-foreground transition-opacity text-xs font-normal"
      >
        #
      </a>
    </h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="type-body text-muted-foreground mb-3.5">{children}</p>;
}

export function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-xs font-mono bg-muted text-primary px-1.5 py-0.5 rounded border border-border/50">
      {children}
    </code>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="mb-8 pb-7 border-b border-border">
      {badge && (
        <span className="inline-flex items-center text-3xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full mb-4">
          {badge}
        </span>
      )}
      <h1 className="text-2xl font-bold font-display text-foreground mb-3 leading-tight tracking-tight">
        {title}
      </h1>
      {description && <p className="type-body text-muted-foreground">{description}</p>}
    </div>
  );
}

// ─── Callout ─────────────────────────────────────────────────────────────────

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-l-blue-500 bg-blue-500/[0.06] text-blue-300 [&_strong]:text-blue-200",
    warning: "border-l-amber-500 bg-amber-500/[0.06] text-amber-300 [&_strong]:text-amber-200",
    tip: "border-l-primary bg-primary/[0.06] text-primary/90 [&_strong]:text-primary",
  };
  const icons = { info: "ℹ", warning: "⚠", tip: "✦" };
  return (
    <div
      className={cn(
        "rounded-r-lg border-l-2 px-4 py-3 my-5 text-xs leading-relaxed flex gap-2.5",
        styles[type]
      )}
    >
      <span className="shrink-0 text-xs mt-0.5 opacity-70">{icons[type]}</span>
      <div>{children}</div>
    </div>
  );
}

// ─── ParamTable ───────────────────────────────────────────────────────────────

export function ParamTable({
  rows,
}: {
  rows: { name: string; type: string; default?: string; desc: string }[];
}) {
  return (
    <div className="my-5 overflow-x-auto rounded-lg border border-border shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-3xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 font-semibold">Parameter</th>
            <th className="px-4 py-2.5 font-semibold">Type</th>
            <th className="px-4 py-2.5 font-semibold">Default</th>
            <th className="px-4 py-2.5 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.name} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 font-mono text-xs text-primary font-medium">{r.name}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-blue-400/80">{r.type}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                {r.default ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── EnvTable ─────────────────────────────────────────────────────────────────

export function EnvTable({
  rows,
}: {
  rows: { name: string; default?: string; desc: string }[];
}) {
  return (
    <div className="my-5 overflow-x-auto rounded-lg border border-border shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-3xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 font-semibold">Variable</th>
            <th className="px-4 py-2.5 font-semibold">Default</th>
            <th className="px-4 py-2.5 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.name} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 font-mono text-xs text-amber-400/80 font-medium">
                {r.name}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                {r.default ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── DocCodeBlock — for bash/yaml/json/non-SDK snippets ──────────────────────

const LANG_LABELS: Record<string, string> = {
  ts: "TypeScript",
  bash: "Terminal",
  sh: "Shell",
  yaml: "YAML",
  json: "JSON",
};

export function DocCodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const label = LANG_LABELS[lang] ?? lang.toUpperCase();
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden my-4 text-sm shadow-sm">
      <div className="flex items-center justify-between bg-muted/60 border-b border-border px-4 py-2 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/40" />
          </div>
          <span className="text-3xs font-mono text-muted-foreground/50 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="text-2xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 px-2 py-0.5 rounded bg-background/50 border border-border/50 hover:border-border"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-xs text-foreground/80 bg-background/40">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
