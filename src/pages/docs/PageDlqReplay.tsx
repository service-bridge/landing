import { Callout, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageDlqReplay() {
  return (
    <div>
      <PageHeader
        badge="Production"
        title="DLQ & Replay"
        description="Dead-letter entries are created when a message exhausts all retry attempts or when the consumer TTL expires. They can be inspected, replayed individually, or bulk-replayed from the dashboard."
      />

      <H2 id="when-dlq">When does a delivery land in DLQ?</H2>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <strong>Retries exhausted</strong> — the handler threw errors on every attempt defined by
          the retry policy (<Mono>maxAttempts</Mono>). Reason: <Mono>max_attempts_exceeded</Mono>.
        </li>
        <li>
          <strong>Explicit rejection</strong> — the handler called{" "}
          <Mono>ctx.reject(reason)</Mono>, bypassing remaining retries. Reason: provided by the
          handler.
        </li>
        <li>
          <strong>Consumer TTL exceeded</strong> — the consumer group never came online within the
          configured TTL (<Mono>SERVICEBRIDGE_DELIVERY_TTL_DAYS</Mono>, default 7 days). Reason:{" "}
          <Mono>delivery_ttl_exceeded</Mono>. Set the TTL to <Mono>0</Mono> to wait indefinitely.
        </li>
      </ul>

      <Callout type="info">
        Time spent <em>waiting for an offline consumer</em> does not burn retry attempts. Retries
        only count when the consumer actually tried to process the message and failed.
      </Callout>

      <H2 id="via-ui">Via dashboard</H2>
      <P>
        Navigate to the <strong>DLQ</strong> page in the dashboard:
      </P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          Click <strong>Replay All</strong> to re-publish up to 500 entries at once.
        </li>
        <li>Click the action button on any individual entry to replay it.</li>
        <li>Admin login required for all DLQ operations.</li>
      </ul>

      <Callout type="info">
        Replayed messages are published as <strong>new events</strong> with a fresh trace ID. The
        original DLQ entry is <strong>not deleted</strong> — clear the DLQ manually from the UI
        after confirming successful redelivery.
      </Callout>

      <H2 id="retry-policy">Retry policy</H2>
      <P>
        Configure the consumer retry policy via <Mono>retryPolicyJson</Mono> in{" "}
        <Mono>handleEvent()</Mono>. The default policy retries up to 3 times with exponential
        backoff before moving to DLQ.
      </P>
      <H3 id="retry-policy-json">Retry policy JSON</H3>
      <div className="rounded-lg border border-border bg-card overflow-hidden my-4 text-sm shadow-sm">
        <pre className="p-4 overflow-x-auto font-mono text-xs text-foreground/80 bg-background/40">
          {`{
  "maxAttempts": 5,
  "baseDelayMs": 1000,
  "factor": 2.0,
  "maxDelayMs": 60000,
  "jitter": 0.2
}`}
        </pre>
      </div>
      <P>
        Delay formula: <Mono>min(baseDelayMs × factor^(attempt-1), maxDelayMs) ± jitter</Mono>.
        Call <Mono>ctx.retry(delayMs)</Mono> in a handler to override the delay for a specific
        attempt.
      </P>

      <H2 id="monitor">Monitoring DLQ depth</H2>
      <P>
        The <Mono>sb_dlq_size</Mono> Prometheus metric tracks the current DLQ depth. Set up an alert
        rule with <Mono>dlq_new</Mono> condition type in the dashboard to get notified when new DLQ
        entries appear.
      </P>
    </div>
  );
}
