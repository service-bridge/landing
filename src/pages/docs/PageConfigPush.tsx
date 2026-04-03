import { Callout, DocCodeBlock, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageConfigPush() {
  return (
    <div>
      <PageHeader
        badge="Transport & Resilience"
        title="ConfigPush"
        description="Runtime transport configuration can be pushed to workers through the session stream without restart — hot-reload transport modes, circuit breaker thresholds, and zone preferences."
      />

      <H2 id="what-is-configpush">What is ConfigPush</H2>
      <P>
        ConfigPush is a server-initiated message sent over the existing worker session stream. When
        the runtime operator updates the transport config, the server pushes a{" "}
        <Mono>ConfigPush</Mono> frame to all connected workers. Workers apply the new config
        immediately — no reconnect or restart needed.
      </P>
      <Callout type="tip">
        ConfigPush is ideal for runtime tuning in production: you can open circuit breakers, switch
        transport modes, or adjust zone weights without any downtime.
      </Callout>

      <H2 id="what-can-be-pushed">What Can Be Pushed</H2>
      <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground my-3">
        <li>Default transport mode (direct / proxy)</li>
        <li>Per-service transport overrides</li>
        <li>Per-function transport overrides</li>
        <li>Circuit breaker thresholds</li>
        <li>Zone preferences and weight boost</li>
        <li>Fallback policies</li>
      </ul>

      <H2 id="config-example">Configuration Example</H2>
      <DocCodeBlock
        lang="yaml"
        code={`transport:
  default_mode: direct
  service_overrides:
    payments:
      mode: proxy
      circuit_breaker:
        failure_threshold: 3
  function_overrides:
    "payments/payment.charge":
      mode: proxy
      timeout_ms: 10000`}
      />

      <H2 id="apply-order">Apply Order</H2>
      <P>
        When a ConfigPush is received, workers apply the configuration atomically. In-flight RPC
        calls are not interrupted — the new config takes effect for subsequent calls only.
      </P>
      <Callout type="info">
        ConfigPush uses the same session stream as commands and heartbeats. It does not require a
        separate control channel or connection.
      </Callout>
    </div>
  );
}

export default PageConfigPush;
