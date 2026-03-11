import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { Button } from "../ui/button";

const STEPS = [
  {
    step: "01",
    title: "Start the server",
    description: "Spin up ServiceBridge + PostgreSQL with Docker Compose.",
    filename: "terminal",
    code: "docker compose up -d",
  },
  {
    step: "02",
    title: "Install the SDK",
    description: "Add the SDK to your Node.js service.",
    filename: "terminal",
    code: "npm install @servicebridge/sdk",
  },
  {
    step: "03",
    title: "Connect your service",
    description: "Register RPC handlers, subscribe to events, and call other services.",
    filename: "my-service.ts",
    code: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge(
  "127.0.0.1:14445",
  process.env.SERVICE_KEY ?? process.env.SERVICEBRIDGE_SERVICE_KEY ?? "dev-service-key",
  "my-service"
);

sb.handleRpc("hello", async (payload) => {
  return { message: "Hello from ServiceBridge!" };
});

sb.handleEvent("order.*", async (payload) => {
  console.log("Event received:", payload);
});

await sb.serve();`,
  },
];

export function GetStartedSection({ onDocs }: { onDocs?: () => void }) {
  return (
    <AnimatedSection className="py-24 border-t border-white/[0.04]" id="start">
      <div className="container mx-auto px-4">
        <motion.div variants={fadeInUp} className="text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight font-display">
            Start building in <span className="text-gradient">three steps</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Run the server, install the SDK, connect your services — done.
          </p>
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-16 grid gap-8 max-w-3xl mx-auto">
          {STEPS.map(({ step, title, description, filename, code }) => (
            <div key={step} className="flex gap-6">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] flex items-center justify-center font-mono text-sm font-bold text-emerald-400">
                  {step}
                </div>
                <div className="flex-1 w-px bg-white/[0.06] mt-3" />
              </div>
              <div className="pb-8 flex-1 min-w-0">
                <h3 className="text-lg font-semibold font-display mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
                <div className="rounded-xl border border-white/[0.06] bg-[#080c18] overflow-hidden">
                  <div className="border-b border-white/[0.06] px-4 py-2">
                    <span className="text-xs font-mono text-zinc-500">{filename}</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                    <code>{code}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            className="h-14 min-w-[200px] text-base gap-2 cursor-pointer"
            onClick={onDocs}
          >
            Read the Docs <ArrowRight className="w-4 h-4" />
          </Button>
          <a href="https://github.com/esurkov1/connectr" target="_blank" rel="noreferrer">
            <Button
              variant="outline"
              size="lg"
              className="h-14 min-w-[200px] text-base cursor-pointer"
            >
              GitHub
            </Button>
          </a>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
