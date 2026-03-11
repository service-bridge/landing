import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, Github, Menu, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BrandMark } from "./components/BrandMark";
import { RunFlowSection } from "./components/RunFlow";
import { cn } from "./lib/utils";
import DocsPage from "./pages/DocsPage";
import { ArchitectureSection } from "./sections/Architecture";
import { BenchmarkSection } from "./sections/Benchmark";
import { CodeSection } from "./sections/Code";
import { FeaturesSection } from "./sections/Features";
import { FooterSection } from "./sections/Footer";
import { AlertsSection } from "./sections/feature-alerts";
import { DirectRpcSection } from "./sections/feature-direct-rpc";
import { DiscoveryMapSection } from "./sections/feature-discovery-map";
import { DurableEventsSection } from "./sections/feature-durable-events";
import { JobsSection } from "./sections/feature-jobs";
import { FEATURE_MENU_ITEMS } from "./sections/feature-menu-items";
import { StreamsSection } from "./sections/feature-streams";
import { TracingSection } from "./sections/feature-tracing";
import { WorkflowsSection } from "./sections/feature-workflows";
import { GetStartedSection } from "./sections/GetStarted";
import { HeroSection } from "./sections/Hero";
import { ReplacesSection } from "./sections/Replaces";
import { UseCasesSection } from "./sections/UseCases";
import { Button } from "./ui/button";

const PRIMARY_NAV_LINKS = [
  { label: "Why", href: "#replaces" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Live Runs", href: "#runs" },
  { label: "Benchmark", href: "#benchmarks" },
  { label: "Code", href: "#code" },
  { label: "Architecture", href: "#architecture" },
  { label: "Get Started", href: "#start" },
] as const;

function DesktopFeatureMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="group relative">
      <div className="flex items-center gap-1">
        <a
          href="#features"
          className="type-label text-muted-foreground hover:text-foreground transition-colors"
        >
          Features
        </a>
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          aria-label="Toggle features menu"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-full z-50 w-[340px] pt-3"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-background/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="space-y-1">
                {FEATURE_MENU_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-white/[0.06] hover:bg-white/[0.03]"
                  >
                    <span className="block type-label font-semibold font-display">
                      {item.label}
                    </span>
                    <span className="block type-body-sm">{item.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none invisible absolute left-0 top-full z-40 w-[340px] pt-3 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
        <div className="rounded-2xl border border-white/[0.08] bg-background/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="space-y-1">
            {FEATURE_MENU_ITEMS.map((item) => (
              <a
                key={`${item.href}-hover`}
                href={item.href}
                className="block rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-white/[0.06] hover:bg-white/[0.03]"
              >
                <span className="block type-label font-semibold font-display">{item.label}</span>
                <span className="block type-body-sm">{item.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileFeatureMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
      <div className="flex items-center justify-between gap-2">
        <a href="#features" className="flex-1 rounded-xl px-3 py-2 type-label text-foreground">
          Features
        </a>
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          aria-label="Toggle feature links"
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-1 pt-1 type-overline text-zinc-500">8 detailed blocks</div>
            <div className="space-y-1 px-1 pb-1">
              {FEATURE_MENU_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="block type-label font-semibold font-display">{item.label}</span>
                  <span className="block type-body-sm">{item.desc}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function useHashPage() {
  const [page, setPage] = useState<"landing" | "docs">(() =>
    window.location.hash === "#docs" ? "docs" : "landing"
  );

  useEffect(() => {
    const handler = () => {
      setPage(window.location.hash === "#docs" ? "docs" : "landing");
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigateTo = useCallback((nextPage: "landing" | "docs") => {
    window.location.hash = nextPage === "docs" ? "#docs" : "";
    setPage(nextPage);
    window.scrollTo({ top: 0 });
  }, []);

  return { page, navigateTo };
}

export default function App() {
  const { page, navigateTo } = useHashPage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featureMenuOpen, setFeatureMenuOpen] = useState(false);
  const [mobileFeatureMenuOpen, setMobileFeatureMenuOpen] = useState(false);

  useEffect(() => {
    if (page !== "landing") return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);

  useEffect(() => {
    const closeMenus = () => {
      setFeatureMenuOpen(false);
      setMobileMenuOpen(false);
      setMobileFeatureMenuOpen(false);
    };

    window.addEventListener("hashchange", closeMenus);
    return () => window.removeEventListener("hashchange", closeMenus);
  }, []);

  if (page === "docs") {
    return <DocsPage onBack={() => navigateTo("landing")} />;
  }

  return (
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
          <button
            type="button"
            onClick={() => navigateTo("landing")}
            className="flex cursor-pointer items-center gap-2.5 type-subsection-title font-display"
          >
            <div className="rounded-lg bg-primary p-1.5 text-primary-foreground">
              <BrandMark className="h-4 w-4" />
            </div>
            <span>ServiceBridge</span>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            <DesktopFeatureMenu open={featureMenuOpen} onOpenChange={setFeatureMenuOpen} />
            {PRIMARY_NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="type-label text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => navigateTo("docs")}
              className="type-label text-muted-foreground transition-colors hover:text-foreground"
            >
              Docs
            </button>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a href="https://github.com/esurkov1/connectr" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
                <Github className="h-4 w-4" />
                GitHub
              </Button>
            </a>
            <Button size="sm" className="gap-2 cursor-pointer" onClick={() => navigateTo("docs")}>
              <BookOpen className="h-3.5 w-3.5" />
              Docs
            </Button>
          </div>

          <button
            type="button"
            className="p-2 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
            >
              <div className="container mx-auto space-y-3 px-4 py-4">
                <MobileFeatureMenu
                  open={mobileFeatureMenuOpen}
                  onOpenChange={setMobileFeatureMenuOpen}
                />

                {PRIMARY_NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 type-label text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setMobileFeatureMenuOpen(false);
                    }}
                  >
                    {link.label}
                  </a>
                ))}

                <a
                  href="https://github.com/esurkov1/connectr"
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 type-label text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMobileFeatureMenuOpen(false);
                  }}
                >
                  GitHub
                </a>

                <button
                  type="button"
                  className="block w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left type-label text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMobileFeatureMenuOpen(false);
                    navigateTo("docs");
                  }}
                >
                  Docs
                </button>
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
        <BenchmarkSection />
        <CodeSection />
        <ArchitectureSection />
        <DirectRpcSection />
        <DurableEventsSection />
        <StreamsSection />
        <WorkflowsSection />
        <JobsSection />
        <DiscoveryMapSection />
        <TracingSection />
        <AlertsSection />
        <GetStartedSection onDocs={() => navigateTo("docs")} />
      </main>

      <FooterSection />
    </div>
  );
}
