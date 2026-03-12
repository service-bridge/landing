import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageReliability() {
  return (
    <div>
      <PageHeader
        badge="Production"
        title="Reliability Semantics"
        description="Understanding delivery guarantees and failure behavior before going to production."
      />

      <H2 id="guarantees">Delivery guarantees per primitive</H2>
      <div className="overflow-x-auto rounded-xl border border-surface-border my-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-2xs uppercase tracking-wider text-muted-foreground/70">
              <th className="px-4 py-2.5">Primitive</th>
              <th className="px-4 py-2.5">Guarantee</th>
              <th className="px-4 py-2.5">On server outage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {[
              ["rpc()", "Best-effort with retries", "Uses cached registry — direct calls continue"],
              ["event()", "At-least-once, durable (PostgreSQL-backed)", "SDK queues in memory, flushes after reconnect"],
              ["job()", "At-least-once, durable", "SDK queues in memory, flushes after reconnect"],
              ["workflow()", "Resumable, step-level durability", "Resumes from last completed step after restart"],
            ].map(([prim, guarantee, outage]) => (
              <tr key={prim as string} className="text-muted-foreground">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{prim}</td>
                <td className="px-4 py-2.5">{guarantee}</td>
                <td className="px-4 py-2.5 text-muted-foreground/70">{outage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="warning">
        Event delivery is <strong>at-least-once</strong>, not exactly-once. Design consumer
        handlers to be idempotent, or use <Mono>idempotencyKey</Mono> on the publisher side to
        prevent duplicate events from being created.
      </Callout>

      <H2 id="outage">Event delivery status</H2>
      <P>Each event in the dashboard shows one of three delivery statuses:</P>
      <ul className="list-none space-y-1.5 my-3 text-sm text-muted-foreground">
        <li>
          <span className="font-mono text-emerald-400 mr-2">delivered</span>— All subscriber groups
          acknowledged delivery.
        </li>
        <li>
          <span className="font-mono text-amber-400 mr-2">partial_error</span>— At least one group
          moved to DLQ while others delivered successfully.
        </li>
        <li>
          <span className="font-mono text-red-400 mr-2">failed</span>— All retries exhausted across
          all groups, moved to DLQ.
        </li>
      </ul>

      <H2 id="rpc-reliability">RPC reliability</H2>
      <P>
        RPC calls use exponential backoff retries (configurable via <Mono>retries</Mono> and{" "}
        <Mono>retryDelay</Mono>). The SDK caches service endpoint lists from the last successful
        discovery refresh — so direct RPC calls between services continue working even if the
        control plane is temporarily unreachable.
      </P>

      <H2 id="workflow-reliability">Workflow reliability</H2>
      <P>
        Each workflow step's completion state is persisted in PostgreSQL. If the runtime restarts
        mid-workflow, it resumes from the last completed step. <Mono>event_wait</Mono> steps
        suspend the workflow coroutine and resume when the matching event arrives — surviving
        arbitrary downtime.
      </P>
    </div>
  );
}
