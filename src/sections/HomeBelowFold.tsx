// Everything below the fold, bundled into a single deferred chunk. One dynamic
// import instead of ~16 — no request waterfall, far fewer points of failure on
// a stale deploy. The above-the-fold sections (Hero, Replaces, Features) stay
// in the main bundle so first paint never waits on a chunk fetch.
import { TraceFlowSection } from "../components/RunFlow";
import { Button } from "../ui/button";
import { AiSkillSection } from "./AiSkill";
import { ArchitectureSection } from "./Architecture";
import { CodeSection } from "./Code";
import { AlertsSection } from "./feature-alerts";
import { DirectRpcSection } from "./feature-direct-rpc";
import { DiscoveryMapSection } from "./feature-discovery-map";
import { DurableEventsSection } from "./feature-durable-events";
import { HttpSection } from "./feature-http";
import { JobsSection } from "./feature-jobs";
import { ObservabilitySection } from "./feature-observability";
import { StreamsSection } from "./feature-streams";
import { TracingSection } from "./feature-tracing";
import { WorkflowsSection } from "./feature-workflows";
import { GetStartedSection } from "./GetStarted";
import { UseCasesSection } from "./UseCases";

function MidCta({ onDocs }: { onDocs: () => void }) {
  return (
    <div className="border-t border-border">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 py-12 text-center sm:flex-row sm:gap-6">
          <p className="text-base text-muted-foreground">
            One Go binary plus Postgres — no sidecars, no extra infra.
          </p>
          <div className="flex items-center gap-3">
            <a href="#start">
              <Button size="sm" className="cursor-pointer">
                Get started
              </Button>
            </a>
            <Button size="sm" variant="ghost" className="cursor-pointer" onClick={onDocs}>
              Read the docs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeBelowFold({ onDocs }: { onDocs: () => void }) {
  return (
    <>
      <UseCasesSection />
      <CodeSection />
      <AiSkillSection />
      <TraceFlowSection />
      <ArchitectureSection />

      <MidCta onDocs={onDocs} />

      <DirectRpcSection />
      <HttpSection />
      <DurableEventsSection />
      <StreamsSection />
      <DiscoveryMapSection />

      <WorkflowsSection />
      <JobsSection />

      <TracingSection />
      <ObservabilitySection />
      <AlertsSection />

      <GetStartedSection onDocs={onDocs} />
    </>
  );
}
