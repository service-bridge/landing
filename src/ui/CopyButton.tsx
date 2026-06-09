import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "flex items-center gap-1.5 text-[11px] font-mono transition-colors cursor-pointer shrink-0",
        copied ? "text-emerald-400" : "text-muted-foreground hover:text-foreground",
        className
      )}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
