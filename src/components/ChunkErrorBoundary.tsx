import { Component, type ReactNode } from "react";

// Matches the errors a browser throws when a code-split chunk 404s — which
// happens when a visitor holds a stale index.html across a deploy (the hashed
// chunk it references was replaced). Reloading fetches the fresh index.html
// with the correct chunk hashes, so the failure self-heals.
const CHUNK_ERR =
  /importing a module script failed|dynamically imported module|failed to fetch dynamically|loading chunk/i;

export function isChunkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return CHUNK_ERR.test(msg);
}

const RELOAD_KEY = "sb-chunk-reload-ts";

// Reload at most once per 10s window so a genuinely-broken deploy can't loop.
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable (private mode quota) — reload anyway, once.
  }
  window.location.reload();
  return true;
}

interface Props {
  children: ReactNode;
}
interface State {
  failed: boolean;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    if (isChunkError(error)) reloadOnce();
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
          <p className="text-lg font-medium">This page didn’t finish loading.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
