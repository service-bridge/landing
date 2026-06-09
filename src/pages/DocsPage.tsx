// keywords: servicebridge service-bridge documentation docs microservices RPC gRPC event-bus event-driven distributed-tracing workflow orchestration background-jobs cron mTLS service-mesh service-discovery Node.js TypeScript Python Go SDK npm i service-bridge pip install service-bridge distributed-systems zero-sidecar Istio-alternative RabbitMQ-alternative Temporal-alternative Jaeger-alternative PostgreSQL Docker Kubernetes DLQ dead-letter-queue saga distributed-transactions AI-agent-orchestration Express Fastify FastAPI Flask observability Prometheus tracing service-catalog async-messaging durable-events retries idempotency auto-mTLS runtime-dashboard production-ready self-hosted

import { ArrowLeft, ArrowRight, ExternalLink, Menu, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "../components/BrandMark";
import { useDocLocale } from "../lib/locale-context";
import { cn } from "../lib/utils";
import { NAV, type NavItem, type TocItem } from "./docs/nav";

// ── Page imports ───────────────────────────────────────────────────────────────

import { PageAlertsChannels } from "./docs/PageAlertsChannels";
import { PageAlertsOverview } from "./docs/PageAlertsOverview";
import { PageAlertsRules } from "./docs/PageAlertsRules";
import { PageAlertsTelegram } from "./docs/PageAlertsTelegram";
import { PageConfigPush } from "./docs/PageConfigPush";
import { PageDlqReplay } from "./docs/PageDlqReplay";
import { PageEndToEnd } from "./docs/PageEndToEnd";
import { PageEvents } from "./docs/PageEvents";
import { PageFilterExpr } from "./docs/PageFilterExpr";
import { PageHttpMiddleware } from "./docs/PageHttpMiddleware";
import { PageInstallation } from "./docs/PageInstallation";
import { PageJobs } from "./docs/PageJobs";
import { PageManualSpans } from "./docs/PageManualSpans";
import { PageMetricsLogs } from "./docs/PageMetricsLogs";
import { PageOfflineQueue } from "./docs/PageOfflineQueue";
import { PageQuickStart } from "./docs/PageQuickStart";
import { PageReconnectResume } from "./docs/PageReconnectResume";
import { PageReliability } from "./docs/PageReliability";
import { PageRpc } from "./docs/PageRpc";
import { PageSdkOptions } from "./docs/PageSdkOptions";
import { PageStart } from "./docs/PageStart";
import { PageServerConfig } from "./docs/PageServerConfig";
import { PageServiceKeys } from "./docs/PageServiceKeys";
import { PageSessionLifecycle } from "./docs/PageSessionLifecycle";
import { PageStreaming } from "./docs/PageStreaming";
import { PageTlsMtls } from "./docs/PageTlsMtls";
import { PageTracing } from "./docs/PageTracing";
import { PageTransportModes } from "./docs/PageTransportModes";
import { PageWorkflows } from "./docs/PageWorkflows";
import { PageZoneAware } from "./docs/PageZoneAware";

// ── Pages registry ────────────────────────────────────────────────────────────

const PAGES: Record<string, () => React.ReactNode> = {
  installation: PageInstallation,
  "quick-start": PageQuickStart,
  "end-to-end": PageEndToEnd,
  rpc: PageRpc,
  events: PageEvents,
  jobs: PageJobs,
  workflows: PageWorkflows,
  streaming: PageStreaming,
  start: PageStart,
  "http-middleware": PageHttpMiddleware,
  "manual-spans": PageManualSpans,
  tracing: PageTracing,
  "metrics-logs": PageMetricsLogs,
  "sdk-options": PageSdkOptions,
  "server-config": PageServerConfig,
  "service-keys": PageServiceKeys,
  "tls-mtls": PageTlsMtls,
  reliability: PageReliability,
  "offline-queue": PageOfflineQueue,
  "filter-expr": PageFilterExpr,
  "dlq-replay": PageDlqReplay,
  "alerts-overview": PageAlertsOverview,
  "alerts-rules": PageAlertsRules,
  "alerts-channels": PageAlertsChannels,
  "alerts-telegram": PageAlertsTelegram,
  "session-lifecycle": PageSessionLifecycle,
  "transport-modes": PageTransportModes,
  "reconnect-resume": PageReconnectResume,
  "config-push": PageConfigPush,
  "zone-aware": PageZoneAware,
};

const ALL_PAGES: NavItem[] = NAV.flatMap((g) => g.items);

// ── SearchModal ───────────────────────────────────────────────────────────────

function SearchModal({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { locale } = useDocLocale();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allItems = NAV.flatMap((g) =>
    g.items.map((item) => ({
      ...item,
      displayLabel: locale === "ru" ? item.ru : item.label,
      displayGroup: locale === "ru" ? g.ru : g.group,
    }))
  );

  const q = query.trim().toLowerCase();

  type EnrichedItem = (typeof allItems)[0] & { matchingToc: TocItem[] };

  const results: EnrichedItem[] = q
    ? allItems.flatMap((item) => {
        const inTitle = item.displayLabel.toLowerCase().includes(q);
        const inGroup = item.displayGroup.toLowerCase().includes(q);
        const matchingToc = item.toc.filter((t) =>
          (locale === "ru" ? (t.ru ?? t.label) : t.label).toLowerCase().includes(q)
        );
        if (inTitle || inGroup || matchingToc.length > 0) {
          return [{ ...item, matchingToc: matchingToc.slice(0, 4) }];
        }
        return [];
      })
    : allItems.map((item) => ({ ...item, matchingToc: [] }));

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (results[selectedIndex]) {
        onNavigate(results[selectedIndex].id);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKey}
            placeholder={locale === "ru" ? "Поиск по документации..." : "Search documentation..."}
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => { setQuery(""); setSelectedIndex(0); inputRef.current?.focus(); }}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:block font-mono bg-muted border border-border px-1.5 py-0.5 rounded text-xs text-muted-foreground/60">
              esc
            </kbd>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {locale === "ru" ? "Ничего не найдено по запросу" : "No results for"}{" "}
                <span className="font-medium text-foreground">"{query}"</span>
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                {locale === "ru" ? "Попробуйте другой запрос" : "Try a different search term"}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {!q && (
                <p className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">
                  {locale === "ru" ? "Все страницы" : "All pages"}
                </p>
              )}
              {results.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex flex-col gap-1.5 px-5 py-3 text-left transition-colors cursor-pointer",
                    i === selectedIndex ? "bg-primary/10" : "hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        i === selectedIndex ? "text-primary" : "text-foreground"
                      )}
                    >
                      {item.displayLabel}
                    </span>
                    <span className="text-3xs text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full shrink-0">
                      {item.displayGroup}
                    </span>
                  </div>
                  {item.matchingToc.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.matchingToc.map((t) => (
                        <span
                          key={t.id}
                          className="text-2xs text-muted-foreground bg-muted/70 px-2 py-0.5 rounded"
                        >
                          {locale === "ru" ? (t.ru ?? t.label) : t.label}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-2.5 border-t border-border flex items-center gap-4 text-2xs text-muted-foreground/50 bg-muted/30">
          <span>
            <kbd className="font-mono bg-background/50 border border-border px-1 py-0.5 rounded text-3xs">↑↓</kbd>{" "}
            {locale === "ru" ? "навигация" : "navigate"}
          </span>
          <span>
            <kbd className="font-mono bg-background/50 border border-border px-1 py-0.5 rounded text-3xs">↵</kbd>{" "}
            {locale === "ru" ? "открыть" : "open"}
          </span>
          <span>
            <kbd className="font-mono bg-background/50 border border-border px-1 py-0.5 rounded text-3xs">esc</kbd>{" "}
            {locale === "ru" ? "закрыть" : "close"}
          </span>
          <span className="ml-auto">
            {results.length}{" "}
            {locale === "ru"
              ? results.length === 1 ? "результат" : results.length < 5 ? "результата" : "результатов"
              : results.length === 1 ? "result" : "results"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── RightToc ─────────────────────────────────────────────────────────────────

function RightToc({
  toc,
  contentRoot,
}: {
  toc: TocItem[];
  contentRoot: React.RefObject<HTMLDivElement | null>;
}) {
  const [activeId, setActiveId] = useState(toc[0]?.id ?? "");

  useEffect(() => {
    setActiveId(toc[0]?.id ?? "");
  }, [toc]);

  useEffect(() => {
    const container = contentRoot.current;
    if (!container || !toc.length) return;

    const onScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      let currentId = toc[0].id;
      for (const { id } of toc) {
        const el = document.getElementById(id);
        if (!el) continue;
        const elTop = el.getBoundingClientRect().top - containerTop;
        if (elTop <= 48) currentId = id;
      }
      setActiveId(currentId);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [toc, contentRoot.current]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!toc.length) return null;

  const { locale } = useDocLocale();

  return (
    <aside className="hidden xl:block w-52 shrink-0 pr-4">
      <div className="sticky top-0 py-8 pl-8">
        <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
          {locale === "ru" ? "На этой странице" : "On this page"}
        </p>
        <nav className="space-y-px border-l border-border">
          {toc.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className={cn(
                "block w-full text-left text-xs py-1.5 pl-3.5 -ml-px transition-all cursor-pointer border-l",
                activeId === item.id
                  ? "text-primary border-primary font-medium"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              {locale === "ru" ? (item.ru ?? item.label) : item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  activePage,
  onSelect,
  onSearch,
}: {
  activePage: string;
  onSelect: (id: string) => void;
  onSearch: () => void;
}) {
  const { locale, setLocale } = useDocLocale();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 space-y-2">
        <button
          type="button"
          onClick={onSearch}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md bg-muted/60 border border-border/60 hover:border-border hover:bg-muted text-sm text-muted-foreground transition-all cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left text-xs">
            {locale === "ru" ? "Поиск по документации..." : "Search docs..."}
          </span>
          <kbd className="hidden sm:block text-3xs bg-background/60 border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
            ⌘K
          </kbd>
        </button>
        <div className="flex items-center gap-1 px-1">
          {(["en", "ru"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={cn(
                "flex-1 py-1 rounded text-3xs font-semibold uppercase tracking-wider transition-colors cursor-pointer",
                locale === l
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-4">
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="px-2 mb-1.5 text-3xs font-semibold uppercase tracking-widest text-muted-foreground/50">
              {locale === "ru" ? group.ru : group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    activePage === item.id
                      ? "bg-primary/[0.15] text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {locale === "ru" ? item.ru : item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-border/50">
        <a
          href="https://github.com/service-bridge/sdk"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          GitHub
        </a>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DocsPage({ onBack }: { onBack: () => void }) {
  const { locale } = useDocLocale();
  const [activePage, setActivePage] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#docs/")) {
      const id = hash.slice(6);
      if (id in PAGES) return id;
    }
    return "installation";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeItem = ALL_PAGES.find((p) => p.id === activePage);
  const currentIndex = ALL_PAGES.findIndex((p) => p.id === activePage);
  const prevPage = currentIndex > 0 ? ALL_PAGES[currentIndex - 1] : null;
  const nextPage = currentIndex < ALL_PAGES.length - 1 ? ALL_PAGES[currentIndex + 1] : null;
  const PageComponent = PAGES[activePage];

  const navigateTo = useCallback((id: string) => {
    setActivePage(id);
    setMobileNavOpen(false);
    contentRef.current?.scrollTo({ top: 0 });
    window.history.replaceState(null, "", `#docs/${id}`);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Cross-page navigation dispatched by inline links inside page components
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id) navigateTo(id);
    };
    document.addEventListener("sb-nav", handler);
    return () => document.removeEventListener("sb-nav", handler);
  }, [navigateTo]);

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground font-sans flex">
      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onNavigate={(id) => {
            navigateTo(id);
            setSearchOpen(false);
          }}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 border-r border-border bg-card h-full">
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <div className="p-1.5 bg-primary rounded-md text-primary-foreground">
              <BrandMark className="w-3.5 h-3.5" />
            </div>
            <span className="text-foreground">ServiceBridge</span>
            <span className="text-muted-foreground/40 font-normal text-xs">docs</span>
          </div>
          <button
            type="button"
            onClick={onBack}
            title="Back to landing"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Sidebar
            activePage={activePage}
            onSelect={navigateTo}
            onSearch={() => setSearchOpen(true)}
          />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm cursor-default"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col shadow-2xl">
            <div className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 font-bold text-sm">
                <div className="p-1 bg-primary rounded text-primary-foreground">
                  <BrandMark className="w-3.5 h-3.5" />
                </div>
                <span>ServiceBridge</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar
                activePage={activePage}
                onSelect={navigateTo}
                onSearch={() => {
                  setMobileNavOpen(false);
                  setSearchOpen(true);
                }}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden h-12 flex items-center gap-3 px-4 border-b border-border bg-card shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 font-bold text-sm flex-1">
            <div className="p-1 bg-primary rounded text-primary-foreground">
              <BrandMark className="w-3.5 h-3.5" />
            </div>
            <span>ServiceBridge</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
        </header>

        <main ref={contentRef} className="flex-1 min-w-0 overflow-y-auto">
          <div className="flex w-full">
            <div className="flex-1 min-w-0 px-6 sm:px-10 py-10 pb-28">
              {PageComponent && <PageComponent />}

              {/* Prev / Next navigation */}
              <div className="mt-14 pt-6 border-t border-border grid grid-cols-2 gap-3">
                {prevPage ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(prevPage.id)}
                    className="flex items-center gap-3 text-left p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/[0.04] transition-all cursor-pointer group"
                  >
                    <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all shrink-0" />
                    <div>
                      <p className="text-3xs text-muted-foreground/60 uppercase tracking-wider mb-0.5 font-medium">
                        {locale === "ru" ? "Назад" : "Previous"}
                      </p>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {locale === "ru" ? prevPage.ru : prevPage.label}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div />
                )}
                {nextPage ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(nextPage.id)}
                    className="flex items-center gap-3 justify-end text-right p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/[0.04] transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="text-3xs text-muted-foreground/60 uppercase tracking-wider mb-0.5 font-medium">
                        {locale === "ru" ? "Далее" : "Next"}
                      </p>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {locale === "ru" ? nextPage.ru : nextPage.label}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>

            <RightToc toc={activeItem?.toc ?? []} contentRoot={contentRef} />
          </div>
        </main>
      </div>
    </div>
  );
}
