import { BrandMark } from "../components/BrandMark";

export function FooterSection() {
  return (
    <footer className="border-t border-white/[0.07] bg-surface py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary rounded-lg text-primary-foreground">
              <BrandMark className="w-4 h-4" />
            </div>
            <span className="font-bold font-display">ServiceBridge</span>
          </div>

          <div className="flex items-center gap-8">
            <a
              href="https://github.com/service-bridge/sdk"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              GitHub
            </a>
            <a
              href="#docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              Documentation
            </a>
            <a
              href="https://www.npmjs.com/package/servicebridge"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              npm
            </a>
            <a
              href="https://github.com/service-bridge/sdk/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              MIT License
            </a>
          </div>

          <div className="flex flex-col items-center gap-2 md:items-end">
            <a
              href="https://github.com/service-bridge/sdk"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              Star on GitHub
            </a>
            <p className="text-sm text-muted-foreground">© 2026 Eugene Surkov.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
