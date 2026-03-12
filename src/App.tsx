import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, Github, Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "./components/BrandMark";
import { RunFlowSection } from "./components/RunFlow";
import { LanguageProvider } from "./lib/language-context";
import { cn } from "./lib/utils";
import DocsPage from "./pages/DocsPage";
import HashPasswordPage from "./pages/HashPasswordPage";
import { ArchitectureSection } from "./sections/Architecture";
import { CodeSection } from "./sections/Code";
import { FeaturesSection } from "./sections/Features";
import { FooterSection } from "./sections/Footer";
import { AlertsSection } from "./sections/feature-alerts";
import { DirectRpcSection } from "./sections/feature-direct-rpc";
import { DiscoveryMapSection } from "./sections/feature-discovery-map";
import { DurableEventsSection } from "./sections/feature-durable-events";
import { HttpSection } from "./sections/feature-http";
import { JobsSection } from "./sections/feature-jobs";
import { FEATURE_MENU_ITEMS } from "./sections/feature-menu-items";
import { ObservabilitySection } from "./sections/feature-observability";
import { StreamsSection } from "./sections/feature-streams";
import { TracingSection } from "./sections/feature-tracing";
import { WorkflowsSection } from "./sections/feature-workflows";
import { GetStartedSection } from "./sections/GetStarted";
import { HeroSection } from "./sections/Hero";
import { ReplacesSection } from "./sections/Replaces";
import { UseCasesSection } from "./sections/UseCases";
import { Button } from "./ui/button";

const NAV_LINKS = [
  { label: "Why", href: "#replaces" },
  { label: "Architecture", href: "#architecture" },
  { label: "Get Started", href: "#start" },
] as const;

function FeaturesDropdown({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const openMenu  = () => { clearTimeout(closeTimer.current); setOpen(true); };
  const closeMenu = () => { closeTimer.current = setTimeout(() => setOpen(false), 120); };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 type-label transition-colors",
          open ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Features
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 pt-3"
          >
            <div className="w-[480px] rounded-2xl border border-surface-border bg-background/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-0.5">
                {FEATURE_MENU_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => { setOpen(false); onClose(); }}
                    className="rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="block text-sm font-semibold font-display text-foreground/90">
                      {item.label}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{item.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Page = "landing" | "docs" | "hash-password";

function hashToPage(hash: string): Page {
  if (hash === "#docs") return "docs";
  if (hash === "#hash-password") return "hash-password";
  return "landing";
}

function useHashPage() {
  const [page, setPage] = useState<Page>(() => hashToPage(window.location.hash));

  useEffect(() => {
    const handler = () => setPage(hashToPage(window.location.hash));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigateTo = useCallback((nextPage: Page) => {
    window.location.hash = nextPage === "landing" ? "" : `#${nextPage}`;
    setPage(nextPage);
    window.scrollTo({ top: 0 });
  }, []);

  return { page, navigateTo };
}

export default function App() {
  const { page, navigateTo } = useHashPage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFeatureMenuOpen, setMobileFeatureMenuOpen] = useState(false);

  useEffect(() => {
    if (page !== "landing") return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);

  useEffect(() => {
    const closeMenus = () => {
      setMobileMenuOpen(false);
      setMobileFeatureMenuOpen(false);
    };

    window.addEventListener("hashchange", closeMenus);
    return () => window.removeEventListener("hashchange", closeMenus);
  }, []);

  if (page === "docs") {
    return <DocsPage onBack={() => navigateTo("landing")} />;
  }
  if (page === "hash-password") {
    return <HashPasswordPage onBack={() => navigateTo("landing")} />;
  }

  return (
    <LanguageProvider>
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border/50 bg-background/80 shadow-lg shadow-black/5 backdrop-blur-xl"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigateTo("landing")}
            className="flex cursor-pointer items-center gap-2.5 type-subsection-title font-display shrink-0"
          >
            <div className="rounded-lg bg-primary p-1.5 text-primary-foreground">
              <BrandMark className="h-4 w-4" />
            </div>
            <span>ServiceBridge</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex">
            <FeaturesDropdown onClose={() => {}} />
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="type-label text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-2 md:flex">
            <a href="https://github.com/esurkov1/connectr" target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm" className="gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                <Github className="h-4 w-4" />
                GitHub
              </Button>
            </a>
            <Button size="sm" className="gap-1.5 cursor-pointer" onClick={() => navigateTo("docs")}>
              <BookOpen className="h-3.5 w-3.5" />
              Docs
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="p-2 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
            >
              <div className="container mx-auto space-y-2 px-4 py-4">
                {/* Features accordion */}
                <div className="rounded-xl border border-surface-border bg-surface overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMobileFeatureMenuOpen(!mobileFeatureMenuOpen)}
                    className="flex w-full items-center justify-between px-4 py-3 type-label text-foreground"
                  >
                    Features
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", mobileFeatureMenuOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileFeatureMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-surface-border"
                      >
                        <div className="grid grid-cols-2 gap-0.5 p-2">
                          {FEATURE_MENU_ITEMS.map((item) => (
                            <a
                              key={item.href}
                              href={item.href}
                              onClick={() => { setMobileMenuOpen(false); setMobileFeatureMenuOpen(false); }}
                              className="rounded-lg px-3 py-2 hover:bg-white/[0.04]"
                            >
                              <span className="block text-sm font-semibold font-display text-foreground/90">{item.label}</span>
                              <span className="block text-xs text-muted-foreground mt-0.5">{item.desc}</span>
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="block rounded-xl border border-surface-border bg-surface px-4 py-3 type-label text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => { setMobileMenuOpen(false); setMobileFeatureMenuOpen(false); }}
                  >
                    {link.label}
                  </a>
                ))}

                <div className="flex gap-2 pt-1">
                  <a
                    href="https://github.com/esurkov1/connectr"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="outline" size="sm" className="w-full gap-2 cursor-pointer">
                      <Github className="h-4 w-4" /> GitHub
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    className="flex-1 gap-2 cursor-pointer"
                    onClick={() => { setMobileMenuOpen(false); navigateTo("docs"); }}
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Docs
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <HeroSection onDocs={() => navigateTo("docs")} />
        <ReplacesSection />
        <FeaturesSection />
        <UseCasesSection />
        <RunFlowSection />
        <CodeSection />
        <ArchitectureSection />
        <DirectRpcSection />
        <HttpSection />
        <DurableEventsSection />
        <StreamsSection />
        <WorkflowsSection />
        <JobsSection />
        <DiscoveryMapSection />
        <TracingSection />
        <ObservabilitySection />
        <AlertsSection />
        <GetStartedSection onDocs={() => navigateTo("docs")} />
      </main>

      <FooterSection />
    </div>
    </LanguageProvider>
  );
}
