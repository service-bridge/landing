import bcrypt from "bcryptjs";
import { Check, Copy, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { BrandMark } from "../components/BrandMark";
import { cn } from "../lib/utils";
import { Button } from "../ui/button";

const COST = 10;

export default function HashPasswordPage({ onBack }: { onBack: () => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    setHash("");
    await new Promise((r) => setTimeout(r, 10)); // let UI repaint
    const result = await bcrypt.hash(password, COST);
    setHash(result);
    setLoading(false);
  }, [password]);

  const copy = useCallback(() => {
    if (!hash) return;
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [hash]);

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") generate();
    },
    [generate]
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2.5 font-display font-semibold text-sm shrink-0 cursor-pointer"
          >
            <div className="rounded-lg bg-primary p-1.5 text-primary-foreground">
              <BrandMark className="h-4 w-4" />
            </div>
            <span>ServiceBridge</span>
          </button>
          <span className="text-border">·</span>
          <span className="text-sm text-muted-foreground">Password Hash Generator</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-2">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold">Generate password hash</h1>
            <p className="text-sm text-muted-foreground">
              For{" "}
              <code className="text-xs bg-surface border border-surface-border rounded px-1.5 py-0.5">
                SERVICEBRIDGE_ADMIN_PASSWORD_HASH
              </code>
            </p>
          </div>

          {/* Privacy notice */}
          <div className="flex items-start gap-3 rounded-xl border border-surface-border bg-surface px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your password is hashed{" "}
              <strong className="text-foreground">locally in the browser</strong> using bcrypt (cost{" "}
              {COST}). It never leaves your device.
            </p>
          </div>

          {/* Input */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKey}
                placeholder="Enter admin password"
                className={cn(
                  "w-full rounded-xl border border-surface-border bg-surface px-4 py-3 pr-12",
                  "text-sm placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                  "transition-colors"
                )}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                tabIndex={-1}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button onClick={generate} disabled={!password || loading} className="w-full gap-2">
              {loading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Hashing…
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Generate hash
                </>
              )}
            </Button>
          </div>

          {/* Result */}
          {hash && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                bcrypt hash
              </label>
              <div className="relative group">
                <div
                  className={cn(
                    "w-full rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 pr-12",
                    "font-mono text-xs text-green-400 break-all leading-relaxed"
                  )}
                >
                  {hash}
                </div>
                <button
                  type="button"
                  onClick={copy}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste this value into your{" "}
                <code className="text-xs bg-surface border border-surface-border rounded px-1 py-0.5">
                  .env
                </code>{" "}
                file or{" "}
                <code className="text-xs bg-surface border border-surface-border rounded px-1 py-0.5">
                  docker compose
                </code>{" "}
                environment.
              </p>
            </div>
          )}

          {/* Usage hint */}
          <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Usage in .env
            </p>
            <pre className="text-xs text-foreground/80 font-mono leading-relaxed overflow-x-auto">
              {`SERVICEBRIDGE_ADMIN_LOGIN=admin
SERVICEBRIDGE_ADMIN_PASSWORD_HASH=${hash || "<paste hash here>"}`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
