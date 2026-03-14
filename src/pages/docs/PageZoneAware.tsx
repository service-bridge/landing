import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageZoneAware() {
  return (
    <div>
      <PageHeader
        badge="Transport & Resilience"
        title="Zone-Aware Routing"
        description="ServiceBridge routes calls to workers in the same availability zone when possible, reducing cross-zone latency and egress costs."
      />

      <H2 id="how-it-works">How It Works</H2>
      <P>
        Each worker registers its availability zone at connect time. The runtime tracks zone metadata
        per worker replica and applies a configurable weight boost to local-zone workers during load
        balancing selection.
      </P>
      <P>
        Workers in the same zone as the runtime instance receive a <Mono>zone_weight_boost</Mono>
        multiplier. Cross-zone workers remain in the pool as fallback — if no local workers are
        available, the call routes normally across zones.
      </P>

      <H2 id="configuration">Configuration</H2>
      <DocCodeBlock
        lang="yaml"
        code={`transport:
  zone:
    local_zone: "us-east-1a"
    prefer_zone: true
    zone_weight_boost: 3`}
      />

      <H3 id="config-fields">Config fields</H3>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">Field</th>
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">Default</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {[
              ["local_zone", '""', "This runtime instance's availability zone"],
              ["prefer_zone", "false", "Enable zone-aware weight boost"],
              ["zone_weight_boost", "3", "Multiplier applied to same-zone workers during selection"],
            ].map(([field, def, desc]) => (
              <tr key={field} className="border-b border-border/50">
                <td className="py-2 pr-6 font-mono text-foreground">{field}</td>
                <td className="py-2 pr-6 font-mono">{def}</td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2 id="fallback">Fallback Behavior</H2>
      <P>
        If <Mono>prefer_zone</Mono> is enabled but no workers in <Mono>local_zone</Mono> are alive,
        the runtime falls back to round-robin across all available zones automatically. No manual
        fallback configuration is needed.
      </P>
      <Callout type="info">
        Zone-aware routing works with both Direct and Proxy transport modes. In Direct mode the
        caller SDK resolves the zone-preferred worker endpoint; in Proxy mode the runtime applies
        zone affinity before proxying the call.
      </Callout>

      <H2 id="multi-runtime">Multi-Runtime Deployments</H2>
      <P>
        In a multi-region or multi-AZ setup, deploy one runtime instance per zone and configure
        each with its own <Mono>local_zone</Mono>. Workers connect to the nearest runtime and
        automatically receive zone-aware routing.
      </P>
    </div>
  );
}

export default PageZoneAware;
