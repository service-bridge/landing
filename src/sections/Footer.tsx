import { BrandMark } from "../components/BrandMark";

export function FooterSection() {
  return (
    <footer className="border-t border-white/[0.04] bg-white/[0.01] py-12">
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
              href="https://github.com/esurkov1/connectr"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              GitHub
            </a>
            <a
              href="#code"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Documentation
            </a>
            <a
              href="https://www.npmjs.com/package/@servicebridge/sdk"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              npm
            </a>
          </div>

          <p className="text-sm text-muted-foreground">© 2026 Eugene Surkov. Open Source.</p>
        </div>
      </div>
    </footer>
  );
}
