// Everything below the fold, bundled into a single deferred chunk. One dynamic
// import instead of ~16 — no request waterfall, far fewer points of failure on
// a stale deploy. The above-the-fold sections (Hero, Replaces, Features) stay
// in the main bundle so first paint never waits on a chunk fetch.
import { TraceFlowSection } from "../components/RunFlow";
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

export function HomeBelowFold({ onDocs }: { onDocs: () => void }) {
  return (
    <>
      <UseCasesSection />
      <TraceFlowSection />
      <CodeSection />
      <AiSkillSection />
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
      <GetStartedSection onDocs={onDocs} />
    </>
  );
}
