import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  DocCodeBlock,
  H2,
  H3,
  Mono,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";

export function PageJobs() {
  return (
    <div>
      <PageHeader
        badge="SDK Reference"
        title="Jobs & Scheduling"
        description="Cron jobs, one-shot delays, and scheduled workflow triggers. The scheduler calls existing RPC handlers or publishes events — no separate queue workers, no Redis, no cron daemons."
      />

      {/* ── Handler side ─────────────────────────────────────────── */}
      <H2 id="handler-side">Handler side</H2>
      <P>
        Jobs target regular <Mono>handleRpc</Mono> or <Mono>handleEvent</Mono> handlers — there is
        no separate "job handler" concept. Write your business logic as a normal handler, schedule
        it with <Mono>job()</Mono>. The scheduler calls in as if it were another service.
      </P>
      <MultiCodeBlock
        code={{
          ts: `// Define the handler as usual
sb.handleRpc("billing.collect", async (payload) => {
  await chargeAllSubscriptions();
  return { charged: true };
});

await sb.serve();`,
          go: `svc.HandleRpc("billing.collect", func(ctx context.Context, payload json.RawMessage) (any, error) {
  return chargeAllSubscriptions(ctx)
})
svc.Serve(ctx, nil)`,
          py: `@sb.handle_rpc("billing.collect")
async def collect(payload: dict) -> dict:
    await charge_all_subscriptions()
    return {"charged": True}

await sb.serve()`,
        }}
      />

      {/* ── job() ────────────────────────────────────────────────── */}
      <H2 id="job-schedule">job() — schedule</H2>
      <P>
        Register a recurring or one-shot job. Jobs are durable — stored in PostgreSQL and resumed
        after restart. Returns a <Mono>jobId</Mono> string.
      </P>

      <H3 id="job-signature">Signature</H3>
      <MultiCodeBlock
        code={{
          ts: `job(target: string, opts: ScheduleOpts): Promise<string>`,
          go: `func (c *Client) Job(ctx context.Context, target string, opts ScheduleOpts) (string, error)`,
          py: `async def job(target: str, opts: ScheduleOpts | None = None) -> str`,
        }}
      />

      <H3 id="schedule-opts">ScheduleOpts</H3>
      <ParamTable
        rows={[
          {
            name: "cron / Cron",
            type: "string",
            desc: 'Standard 5- or 6-field cron expression (the optional 6th field specifies seconds), e.g. "0 * * * *" (hourly). Named descriptors are also supported: @hourly, @daily, @weekly, @monthly, @yearly, @midnight, @every <duration> (e.g. "@every 5m"). Mutually exclusive with delay.',
          },
          {
            name: "delay / DelayMs / delay_ms",
            type: "number (ms)",
            default: "0",
            desc: "One-shot execution after N milliseconds. Mutually exclusive with cron.",
          },
          {
            name: "timezone / Timezone",
            type: "string",
            default: "UTC",
            desc: "IANA timezone for cron evaluation, e.g. America/New_York.",
          },
          {
            name: "misfire / Misfire",
            type: '"fire_now" | "skip"',
            default: '"fire_now"',
            desc: 'Behaviour when a scheduled tick was missed. "fire_now" runs immediately on recovery; "skip" drops the missed tick.',
          },
          {
            name: "via / Via",
            type: '"rpc" | "event" | "workflow"',
            default: '"rpc"',
            desc: "How the job triggers the target — as an RPC call, event publish, or workflow start.",
          },
          {
            name: "retryPolicyJson / RetryPolicyJSON / retry_policy_json",
            type: "string (JSON)",
            desc: "JSON retry policy. Default is single-attempt: maxAttempts=1, baseDelayMs=1000, factor=2, maxDelayMs=60000, jitter=0.",
          },
        ]}
      />

      <H3 id="job-cron">Recurring cron job</H3>
      <MultiCodeBlock
        code={{
          ts: `const jobId = await sb.job("billing/billing.collect", {
  cron: "0 * * * *",   // every hour
  timezone: "UTC",
  via: "rpc",
  misfire: "fire_now", // execute immediately if a tick was missed
});`,
          go: `jobID, err := svc.Job(ctx, "billing/billing.collect", servicebridge.ScheduleOpts{
  Cron:     "0 * * * *",
  Timezone: "UTC",
  Via:      "rpc",
  Misfire:  "fire_now",
})`,
          py: `from service_bridge import ScheduleOpts

job_id = await sb.job("billing/billing.collect", ScheduleOpts(
    cron="0 * * * *",
    timezone="UTC",
    via="rpc",
    misfire="fire_now",
))`,
        }}
      />

      <H3 id="job-misfire">Misfire: skip</H3>
      <P>
        Use <Mono>misfire: "skip"</Mono> for jobs where running a stale tick would cause harm — for
        example, a job that sends a time-sensitive digest email. If the runtime was down when the
        cron fired, the tick is silently dropped and the next scheduled tick runs normally:
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.job("emails/emails.weekly_digest", {
  cron: "0 9 * * MON",   // every Monday 9am
  timezone: "Europe/Moscow",
  via: "rpc",
  misfire: "skip",       // don't send stale digest if runtime was down
});`,
          go: `svc.Job(ctx, "emails/emails.weekly_digest", servicebridge.ScheduleOpts{
  Cron:     "0 9 * * MON",
  Timezone: "Europe/Moscow",
  Via:      "rpc",
  Misfire:  "skip",
})`,
          py: `await sb.job("emails/emails.weekly_digest", ScheduleOpts(
    cron="0 9 * * MON",
    timezone="Europe/Moscow",
    via="rpc",
    misfire="skip",
))`,
        }}
      />

      <Callout type="info">
        The target (RPC handler, event subscriber, or workflow) always receives an empty payload{" "}
        <Mono>{"{}"}</Mono>. There is currently no way to pass custom input through a job trigger —
        parameterize via the target's own configuration instead.
      </Callout>

      <H3 id="job-delay">One-shot delayed job</H3>
      <P>Fire once after a delay — useful for welcome emails, trial expirations, follow-ups:</P>
      <MultiCodeBlock
        code={{
          ts: `await sb.job("emails/emails.send_welcome", {
  delay: 30_000,  // fire in 30 seconds
  via: "rpc",
});`,
          go: `svc.Job(ctx, "emails/emails.send_welcome", servicebridge.ScheduleOpts{
  DelayMs: 30_000,
  Via:     "rpc",
})`,
          py: `await sb.job("emails/emails.send_welcome", ScheduleOpts(
    delay_ms=30_000,
    via="rpc",
))`,
        }}
      />

      <Callout type="warning">
        The <Mono>delay</Mono>/<Mono>DelayMs</Mono>/<Mono>delay_ms</Mono> field is backed by a proto{" "}
        <Mono>int32</Mono> — the maximum value is <Mono>2,147,483,647 ms</Mono> (~24.8 days). Use a
        cron job or a durable workflow sleep step for longer delays.
      </Callout>

      <H3 id="job-event">Trigger via event</H3>
      <P>
        Jobs can publish events instead of calling RPC — any subscriber to the topic receives the
        trigger:
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.job("cleanup.daily", {
  cron: "0 2 * * *",
  timezone: "America/New_York",
  via: "event",  // publishes to the "cleanup.daily" topic
});`,
          go: `svc.Job(ctx, "cleanup.daily", servicebridge.ScheduleOpts{
  Cron:     "0 2 * * *",
  Timezone: "America/New_York",
  Via:      "event",
})`,
          py: `await sb.job("cleanup.daily", ScheduleOpts(
    cron="0 2 * * *",
    timezone="America/New_York",
    via="event",
))`,
        }}
      />

      {/* ── Trigger workflow ─────────────────────────────────────── */}
      <H2 id="job-workflow">Trigger a workflow</H2>
      <P>
        Use <Mono>via: "workflow"</Mono> to start a named workflow on a schedule. You can also
        trigger workflows on demand using <Mono>sb.executeWorkflow(name, input)</Mono> /{" "}
        <Mono>svc.ExecuteWorkflow(ctx, name, input)</Mono> /{" "}
        <Mono>await sb.execute_workflow(name, input)</Mono>. See the Workflows page for full details.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.job("order.reconciliation", {
  cron: "0 0 * * *",  // every midnight
  timezone: "UTC",
  via: "workflow",    // starts the "order.reconciliation" workflow
});`,
          go: `svc.Job(ctx, "order.reconciliation", servicebridge.ScheduleOpts{
  Cron: "0 0 * * *",
  Via:  "workflow",
})`,
          py: `await sb.job("order.reconciliation", ScheduleOpts(
    cron="0 0 * * *",
    via="workflow",
))`,
        }}
      />

      {/* ── Retry policy ─────────────────────────────────────────── */}
      <H2 id="job-retry">Retry policy</H2>
      <P>
        Jobs default to a single attempt with no retry. Pass <Mono>retryPolicyJson</Mono> to enable
        retries. The format is identical to the event retry policy:
      </P>
      <DocCodeBlock
        lang="json"
        code={`{
  "maxAttempts": 3,
  "baseDelayMs": 10000,
  "factor": 2,
  "maxDelayMs": 120000,
  "jitter": 0.1
}`}
      />
      <MultiCodeBlock
        code={{
          ts: `await sb.job("billing/billing.collect", {
  cron: "0 * * * *",
  via: "rpc",
  retryPolicyJson: JSON.stringify({
    maxAttempts: 3,
    baseDelayMs: 10000,
    factor: 2,
  }),
});`,
          go: `svc.Job(ctx, "billing/billing.collect", servicebridge.ScheduleOpts{
  Cron:            "0 * * * *",
  Via:             "rpc",
  RetryPolicyJSON: \`{"maxAttempts":3,"baseDelayMs":10000,"factor":2}\`,
})`,
          py: `import json
await sb.job("billing/billing.collect", ScheduleOpts(
    cron="0 * * * *",
    via="rpc",
    retry_policy_json=json.dumps({"maxAttempts": 3, "baseDelayMs": 10000, "factor": 2}),
))`,
        }}
      />

      {/* ── Manage jobs ──────────────────────────────────────────── */}
      <H2 id="job-manage">Manage jobs</H2>
      <P>
        Jobs are managed from the <strong>Jobs</strong> page in the dashboard. There is no SDK
        method to cancel or list jobs — use the admin API directly:
      </P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <strong className="text-foreground">Manual trigger</strong> —{" "}
          <Mono>POST /api/jobs/{"<jobId>"}/execute-now</Mono> fires the job immediately and returns a
          new <Mono>traceId</Mono>.
        </li>
        <li>
          <strong className="text-foreground">Cancel</strong> — Delete the job from the Jobs
          dashboard. No SDK cancel method is available yet.
        </li>
        <li>
          <strong className="text-foreground">Execution history</strong> — Each execution creates a
          trace visible in the Traces dashboard, linked to the job via the <Mono>job:</Mono> span
          prefix.
        </li>
      </ul>

      <Callout type="info">
        Jobs are durable — stored in PostgreSQL. Scheduled jobs resume after a runtime restart
        according to the <Mono>misfire</Mono> policy. The scheduler uses PostgreSQL leases so at
        most one instance fires per tick even in multi-node setups.
      </Callout>
    </div>
  );
}
