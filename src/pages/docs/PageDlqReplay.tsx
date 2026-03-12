import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageDlqReplay() {
  return (
    <div>
      <PageHeader
        badge="Production"
        title="DLQ & Replay"
        description="Dead-letter entries are created when a message exhausts all retry attempts. They can be inspected, replayed individually, or bulk-replayed from the dashboard."
      />

      <H2 id="via-ui">Via dashboard</H2>
      <P>Navigate to the <strong>DLQ</strong> page in the dashboard:</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>Click <strong>Replay All</strong> to re-publish up to 500 entries at once.</li>
        <li>Click the action button on any individual entry to replay it.</li>
        <li>Admin login required for all DLQ operations.</li>
      </ul>

      <Callout type="info">
        Replayed messages are published as <strong>new events</strong> with a fresh trace ID. The
        original DLQ entry is <strong>not deleted</strong> — clear the DLQ manually from the UI
        after confirming successful redelivery.
      </Callout>

      <H2 id="notes">Retry policy</H2>
      <P>
        Configure the consumer retry policy via <Mono>retryPolicyJson</Mono> in{" "}
        <Mono>handleEvent()</Mono>. The default policy retries up to 3 times with exponential
        backoff before moving to DLQ.
      </P>
      <P>
        Example retry policy JSON (pass as <Mono>retryPolicyJson</Mono> string):
      </P>
      <div className="rounded-lg border border-border bg-card overflow-hidden my-4 text-sm shadow-sm">
        <pre className="p-4 overflow-x-auto font-mono text-xs text-foreground/80 bg-background/40">
          {`{
  "max_attempts": 5,
  "initial_delay_ms": 1000,
  "backoff_multiplier": 2.0,
  "max_delay_ms": 60000
}`}
        </pre>
      </div>

      <H2 id="monitor">Monitoring DLQ depth</H2>
      <P>
        The <Mono>sb_dlq_size</Mono> Prometheus metric tracks the current DLQ depth. Set up an
        alert rule with <Mono>dlq_new</Mono> condition type in the dashboard to get notified when
        new DLQ entries appear.
      </P>
    </div>
  );
}
