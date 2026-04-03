import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageTransportModes() {
  return (
    <div>
      <PageHeader
        badge="Transport & Resilience"
        title="Transport Modes"
        description="ServiceBridge supports Direct and Proxy transport modes with per-function overrides, zone-aware load balancing, and per-endpoint circuit breakers."
      />

      <H2 id="direct-mode">Direct Mode</H2>
      <P>
        Callers connect directly to workers via mTLS gRPC. The runtime resolves the worker endpoint
        from its in-memory registry and returns it to the caller SDK. Subsequent calls go
        peer-to-peer with zero proxy hops and no runtime latency overhead.
      </P>
      <Callout type="tip">
        Direct mode is the default. It offers the lowest possible latency and is recommended for
        latency-sensitive RPC paths.
      </Callout>

      <H2 id="proxy-mode">Proxy Mode</H2>
      <P>
        All calls route through the ServiceBridge runtime as a proxy. Workers do not need to be
        directly reachable from the caller — useful in NAT or multi-network environments.
      </P>

      <H2 id="config-hierarchy">3-Level Config Hierarchy</H2>
      <P>Transport mode is resolved from the most-specific override to the global default:</P>
      <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <Mono>function_overrides["fn.name"]</Mono> — per-function override, key is the function name in dot notation (e.g. <Mono>"payment.charge"</Mono>), highest priority
        </li>
        <li>
          <Mono>service_overrides["service"]</Mono> — per-service
        </li>
        <li>
          <Mono>default_mode</Mono> — global fallback
        </li>
      </ol>
      <DocCodeBlock
        lang="yaml"
        code={`transport:
  default_mode: direct
  service_overrides:
    payments:
      mode: proxy
  function_overrides:
    "payment.charge":
      mode: proxy
      timeout_ms: 10000`}
      />

      <H2 id="circuit-breakers">Circuit Breakers</H2>
      <P>
        Each endpoint has its own circuit breaker with a Closed / Open / Half-Open FSM. When the
        failure threshold is exceeded the breaker opens and calls fail-fast until the probe interval
        elapses.
      </P>
      <H3 id="cb-config">Configuration</H3>
      <DocCodeBlock
        lang="yaml"
        code={`circuit_breaker:
  failure_threshold: 5   # consecutive failures to open
  probe_interval_ms: 10000  # time in Open before Half-Open probe`}
      />
      <Callout type="info">
        Circuit breaker state is per runtime instance and is not shared across replicas. Each
        replica makes independent open/close decisions.
      </Callout>

      <H2 id="zone-aware">Zone-Aware Load Balancing</H2>
      <P>
        Workers in the same availability zone as the caller receive a configurable weight boost.
        Cross-zone traffic falls back automatically when no local workers are available.
      </P>
      <DocCodeBlock
        lang="yaml"
        code={`transport:
  zone:
    local_zone: "us-east-1a"
    prefer_zone: true
    zone_weight_boost: 3`}
      />
    </div>
  );
}

export default PageTransportModes;
