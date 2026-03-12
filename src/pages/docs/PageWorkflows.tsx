import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";

export function PageWorkflows() {
  return (
    <div>
      <PageHeader
        badge="SDK Reference"
        title="Workflows"
        description="DAG-based orchestration of RPC calls, events, waits, and child workflows. Each step is durable — workflows resume from the last completed step after any restart."
      />

      {/* ── Concept ──────────────────────────────────────────────── */}
      <H2 id="concept">How it works</H2>
      <P>
        A workflow is a directed acyclic graph (DAG) of steps. Each step declares its dependencies
        via <Mono>deps</Mono>; steps without shared dependencies run in parallel automatically.
        The runtime persists each step's completion state in PostgreSQL — workflows survive restarts
        and resume from the last completed step. The full execution timeline is visible in the
        dashboard.
      </P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li><Mono>rpc</Mono> — calls a registered handler and waits for the response</li>
        <li><Mono>event</Mono> — publishes a durable event and continues immediately</li>
        <li><Mono>event_wait</Mono> — suspends the workflow until a matching event arrives (with optional timeout)</li>
        <li><Mono>sleep</Mono> — pauses for N milliseconds durably (survives restarts)</li>
        <li><Mono>workflow</Mono> — starts a child workflow and waits for it to complete</li>
      </ul>

      <Callout type="info">
        There is no dedicated <Mono>runWorkflow()</Mono> helper yet. Use{" "}
        <Mono>job(name, {"{ via: \"workflow\" }"})</Mono> to trigger a workflow on a schedule, or
        start one as a step inside another workflow.
      </Callout>

      {/* ── Handlers ─────────────────────────────────────────────── */}
      <H2 id="handlers">Define handlers first</H2>
      <P>
        Workflow steps call existing <Mono>handleRpc</Mono> or <Mono>handleEvent</Mono> handlers.
        Register them in your service workers before calling <Mono>serve()</Mono>:
      </P>
      <MultiCodeBlock
        code={{
          ts: `// payments service
sb.handleRpc("payments/charge", async (payload: { orderId: string; amount: number }) => {
  const tx = await stripe.charge(payload);
  return { txId: tx.id };
});

// inventory service
sb.handleRpc("inventory/reserve", async (payload: { orderId: string }) => {
  await db.reserve(payload.orderId);
  return { reserved: true };
});

// notifications — listens for the workflow's final event
sb.handleEvent("orders.fulfilled", async (payload, ctx) => {
  await sendEmail(payload);
});`,
          go: `// payments service
svc.HandleRpc("payments/charge",
  func(ctx context.Context, payload json.RawMessage) (any, error) {
    return stripe.Charge(ctx, payload)
  })

// inventory service
svc.HandleRpc("inventory/reserve",
  func(ctx context.Context, payload json.RawMessage) (any, error) {
    return db.Reserve(ctx, payload)
  })

// notifications
svc.HandleEvent("orders.fulfilled",
  func(ctx context.Context, payload json.RawMessage, ec *servicebridge.EventContext) error {
    return sendEmail(ctx, payload)
  }, nil)`,
          py: `# payments service
@sb.handle_rpc("payments/charge")
async def charge(payload: dict) -> dict:
    tx = await stripe.charge(payload)
    return {"tx_id": tx.id}

# inventory service
@sb.handle_rpc("inventory/reserve")
async def reserve(payload: dict) -> dict:
    await db.reserve(payload["order_id"])
    return {"reserved": True}

# notifications
@sb.handle_event("orders.fulfilled")
async def on_fulfilled(payload: dict, ctx) -> None:
    await send_email(payload)`,
        }}
      />

      {/* ── workflow() ───────────────────────────────────────────── */}
      <H2 id="workflow-start">workflow() — register definition</H2>

      <H3 id="workflow-signature">Signature</H3>
      <MultiCodeBlock
        code={{
          ts: `workflow(name: string, steps: WorkflowStep[]): Promise<string>`,
          go: `func (c *Client) Workflow(ctx context.Context, name string, steps []WorkflowStep) (string, error)`,
          py: `async def workflow(name: str, steps: list[WorkflowStep]) -> str`,
        }}
      />
      <P>
        Returns the workflow definition ID. Calling <Mono>workflow()</Mono> with an existing name
        updates that definition in place.
      </P>

      <H3 id="step-fields">WorkflowStep fields</H3>
      <ParamTable
        rows={[
          { name: "id", type: "string", desc: "Unique step identifier within this workflow definition." },
          { name: "type", type: '"rpc" | "event" | "event_wait" | "sleep" | "workflow"', desc: "Step execution type." },
          { name: "ref", type: "string", desc: 'Required for "rpc", "event", "event_wait", and "workflow". RPC: "service/method". Event/event_wait: topic pattern. Workflow: child workflow name.' },
          { name: "deps", type: "string[]", default: "[]", desc: "Step IDs that must complete before this step runs. Steps with no shared deps run in parallel." },
          { name: "if / If / if_expr", type: "string", desc: "Filter expression evaluated against the resolved input. If false, step is skipped (and cascades to downstream-only deps)." },
          { name: "timeoutMs / TimeoutMs / timeout_ms", type: "number", desc: "Step-level timeout for rpc and event_wait steps." },
          { name: "durationMs / DurationMs / duration_ms", type: "number", desc: 'Required for "sleep" steps. Pause duration in milliseconds.' },
        ]}
      />

      {/* ── Output chaining ──────────────────────────────────────── */}
      <H2 id="output-chaining">Output chaining</H2>
      <P>
        The output of a step automatically becomes the input of dependent steps:
      </P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li><strong className="text-foreground">0 deps</strong> — step receives the original workflow run input</li>
        <li><strong className="text-foreground">1 dep</strong> — step receives that dep's output directly</li>
        <li><strong className="text-foreground">2+ deps</strong> — step receives <Mono>{"{ depId: depOutput, ... }"}</Mono> map</li>
      </ul>
      <P>
        Use the <Mono>if</Mono> field (<Mono>if_expr</Mono> in Python) to inspect chained input
        and conditionally skip a step.
      </P>

      {/* ── Main example ─────────────────────────────────────────── */}
      <H3 id="workflow-example">Order fulfillment workflow</H3>
      <MultiCodeBlock
        code={{
          ts: `const workflowDefinitionId = await sb.workflow("order.fulfillment", [
  { id: "reserve",  type: "rpc",        ref: "inventory/reserve" },
  { id: "charge",   type: "rpc",        ref: "payments/charge",    deps: ["reserve"] },
  { id: "wait_dlv", type: "event_wait", ref: "shipping.delivered", deps: ["charge"], timeoutMs: 86_400_000 },
  { id: "notify",   type: "event",      ref: "orders.fulfilled",   deps: ["wait_dlv"] },
]);`,
          go: `workflowDefinitionID, err := svc.Workflow(ctx, "order.fulfillment", []servicebridge.WorkflowStep{
  {ID: "reserve",  Type: "rpc",        Ref: "inventory/reserve"},
  {ID: "charge",   Type: "rpc",        Ref: "payments/charge",    Deps: []string{"reserve"}},
  {ID: "wait_dlv", Type: "event_wait", Ref: "shipping.delivered", Deps: []string{"charge"}, TimeoutMs: 86_400_000},
  {ID: "notify",   Type: "event",      Ref: "orders.fulfilled",   Deps: []string{"wait_dlv"}},
})`,
          py: `from service_bridge import WorkflowStep

workflow_id = await sb.workflow("order.fulfillment", [
    WorkflowStep(id="reserve",  type="rpc",        ref="inventory/reserve"),
    WorkflowStep(id="charge",   type="rpc",        ref="payments/charge",    deps=["reserve"]),
    WorkflowStep(id="wait_dlv", type="event_wait",  ref="shipping.delivered", deps=["charge"], timeout_ms=86_400_000),
    WorkflowStep(id="notify",   type="event",       ref="orders.fulfilled",   deps=["wait_dlv"]),
])`,
        }}
      />

      {/* ── Parallel steps ───────────────────────────────────────── */}
      <H3 id="parallel-steps">Parallel steps</H3>
      <P>
        Steps without shared dependencies execute in parallel automatically — no extra syntax:
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("onboarding", [
  { id: "create_user",  type: "rpc",   ref: "users/create" },
  // These two run in parallel after create_user:
  { id: "send_welcome", type: "event", ref: "emails.welcome",  deps: ["create_user"] },
  { id: "init_billing", type: "rpc",   ref: "billing/init",    deps: ["create_user"] },
  // This waits for BOTH to finish:
  { id: "activate",     type: "rpc",   ref: "users/activate",  deps: ["send_welcome", "init_billing"] },
]);`,
          go: `svc.Workflow(ctx, "onboarding", []servicebridge.WorkflowStep{
  {ID: "create_user",  Type: "rpc",   Ref: "users/create"},
  {ID: "send_welcome", Type: "event", Ref: "emails.welcome", Deps: []string{"create_user"}},
  {ID: "init_billing", Type: "rpc",   Ref: "billing/init",   Deps: []string{"create_user"}},
  {ID: "activate",     Type: "rpc",   Ref: "users/activate", Deps: []string{"send_welcome", "init_billing"}},
})`,
          py: `await sb.workflow("onboarding", [
    WorkflowStep(id="create_user",  type="rpc",   ref="users/create"),
    WorkflowStep(id="send_welcome", type="event", ref="emails.welcome",  deps=["create_user"]),
    WorkflowStep(id="init_billing", type="rpc",   ref="billing/init",    deps=["create_user"]),
    WorkflowStep(id="activate",     type="rpc",   ref="users/activate",  deps=["send_welcome", "init_billing"]),
])`,
        }}
      />

      {/* ── event_wait ───────────────────────────────────────────── */}
      <H2 id="event-wait">event_wait — suspend until an event</H2>
      <P>
        An <Mono>event_wait</Mono> step suspends the workflow until an event matching the topic
        pattern arrives. The matched event's payload becomes the step's output and is passed to
        downstream steps. Set <Mono>timeoutMs</Mono> to fail the step if no event arrives within
        the deadline — the step fails with <Mono>"event_wait timeout exceeded"</Mono>.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("payment.flow", [
  { id: "initiate",    type: "rpc",        ref: "payments/initiate" },
  // Suspend and wait up to 10 minutes for bank confirmation
  { id: "wait_bank",   type: "event_wait", ref: "payment.confirmed",
    deps: ["initiate"], timeoutMs: 600_000 },
  { id: "fulfill",     type: "rpc",        ref: "orders/fulfill",
    deps: ["wait_bank"] },
]);`,
          go: `svc.Workflow(ctx, "payment.flow", []servicebridge.WorkflowStep{
  {ID: "initiate",  Type: "rpc",        Ref: "payments/initiate"},
  {ID: "wait_bank", Type: "event_wait", Ref: "payment.confirmed",
   Deps: []string{"initiate"}, TimeoutMs: 600_000},
  {ID: "fulfill",   Type: "rpc",        Ref: "orders/fulfill",
   Deps: []string{"wait_bank"}},
})`,
          py: `await sb.workflow("payment.flow", [
    WorkflowStep(id="initiate",  type="rpc",        ref="payments/initiate"),
    WorkflowStep(id="wait_bank", type="event_wait",  ref="payment.confirmed",
                 deps=["initiate"], timeout_ms=600_000),
    WorkflowStep(id="fulfill",   type="rpc",        ref="orders/fulfill",
                 deps=["wait_bank"]),
])`,
        }}
      />

      {/* ── Conditional steps ────────────────────────────────────── */}
      <H2 id="conditional-if">Conditional steps</H2>
      <P>
        Add an <Mono>if</Mono> field containing a filter expression to make a step conditional.
        The expression is evaluated against the step's resolved input (chained from deps). If the
        condition is false, the step status is set to <Mono>skipped</Mono> and downstream-only
        dependents cascade as skipped too.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("order.fulfillment", [
  { id: "reserve",   type: "rpc",   ref: "inventory/reserve" },
  { id: "charge",    type: "rpc",   ref: "payments/charge",  deps: ["reserve"] },
  // Only notify if reserve succeeded — "reserved" came from reserve's output
  { id: "notify",    type: "event", ref: "orders.confirmed",
    deps: ["charge"],
    if: "reserved=true" },
  // Only ship if payment ok
  { id: "ship",      type: "rpc",   ref: "shipping/create",
    deps: ["notify"],
    if: "ok=true" },
]);`,
          go: `svc.Workflow(ctx, "order.fulfillment", []servicebridge.WorkflowStep{
  {ID: "reserve",  Type: "rpc",   Ref: "inventory/reserve"},
  {ID: "charge",   Type: "rpc",   Ref: "payments/charge",   Deps: []string{"reserve"}},
  {ID: "notify",   Type: "event", Ref: "orders.confirmed",
   Deps: []string{"charge"}, If: "reserved=true"},
  {ID: "ship",     Type: "rpc",   Ref: "shipping/create",
   Deps: []string{"notify"}, If: "ok=true"},
})`,
          py: `await sb.workflow("order.fulfillment", [
    WorkflowStep(id="reserve",  type="rpc",   ref="inventory/reserve"),
    WorkflowStep(id="charge",   type="rpc",   ref="payments/charge",   deps=["reserve"]),
    WorkflowStep(id="notify",   type="event", ref="orders.confirmed",
                 deps=["charge"],  if_expr="reserved=true"),
    WorkflowStep(id="ship",     type="rpc",   ref="shipping/create",
                 deps=["notify"],  if_expr="ok=true"),
])`,
        }}
      />

      {/* ── Child workflows ──────────────────────────────────────── */}
      <H2 id="child-workflow">Child workflows</H2>
      <P>
        A <Mono>type: "workflow"</Mono> step starts a named child workflow and suspends the parent
        until the child completes. The child workflow's final output becomes the step's output and
        is chained to downstream steps. Child workflows are <strong>not</strong> automatically
        cancelled when the parent is cancelled.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("order.post-purchase", [
  { id: "fulfillment", type: "workflow", ref: "order.fulfillment" },
  // Runs after the entire fulfillment sub-workflow completes:
  { id: "analytics",   type: "rpc",      ref: "analytics/record",
    deps: ["fulfillment"] },
  { id: "loyalty",     type: "rpc",      ref: "rewards/credit",
    deps: ["fulfillment"] },
]);`,
          go: `svc.Workflow(ctx, "order.post-purchase", []servicebridge.WorkflowStep{
  {ID: "fulfillment", Type: "workflow", Ref: "order.fulfillment"},
  {ID: "analytics",   Type: "rpc",     Ref: "analytics/record",
   Deps: []string{"fulfillment"}},
  {ID: "loyalty",     Type: "rpc",     Ref: "rewards/credit",
   Deps: []string{"fulfillment"}},
})`,
          py: `await sb.workflow("order.post-purchase", [
    WorkflowStep(id="fulfillment", type="workflow", ref="order.fulfillment"),
    WorkflowStep(id="analytics",   type="rpc",      ref="analytics/record",  deps=["fulfillment"]),
    WorkflowStep(id="loyalty",     type="rpc",      ref="rewards/credit",    deps=["fulfillment"]),
])`,
        }}
      />

      {/* ── Durable sleep ────────────────────────────────────────── */}
      <H2 id="sleep-step">Durable sleep</H2>
      <P>
        The <Mono>sleep</Mono> step pauses the workflow for a specified duration. The sleep deadline
        is stored in PostgreSQL — if the runtime restarts during the sleep, it resumes correctly
        after the deadline expires.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("trial.expiry", [
  { id: "send_reminder", type: "rpc",   ref: "emails/send-trial-reminder" },
  { id: "wait_7d",       type: "sleep", durationMs: 604_800_000,             deps: ["send_reminder"] },
  { id: "expire",        type: "rpc",   ref: "billing/expire-trial",         deps: ["wait_7d"] },
]);`,
          go: `svc.Workflow(ctx, "trial.expiry", []servicebridge.WorkflowStep{
  {ID: "send_reminder", Type: "rpc",   Ref: "emails/send-trial-reminder"},
  {ID: "wait_7d",       Type: "sleep", DurationMs: 604_800_000,            Deps: []string{"send_reminder"}},
  {ID: "expire",        Type: "rpc",   Ref: "billing/expire-trial",        Deps: []string{"wait_7d"}},
})`,
          py: `await sb.workflow("trial.expiry", [
    WorkflowStep(id="send_reminder", type="rpc",   ref="emails/send-trial-reminder"),
    WorkflowStep(id="wait_7d",       type="sleep", duration_ms=604_800_000,           deps=["send_reminder"]),
    WorkflowStep(id="expire",        type="rpc",   ref="billing/expire-trial",        deps=["wait_7d"]),
])`,
        }}
      />

      {/* ── Cancel ───────────────────────────────────────────────── */}
      <H2 id="cancel">Cancel a run</H2>
      <P>
        Cancelling a run marks it as <Mono>cancelled</Mono>, clears any pending leases and
        event waiters, and closes the root span with an error status. In-flight steps that are
        already executing are not interrupted. Child workflows are <strong>not</strong>{" "}
        auto-cancelled.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.cancelWorkflowRun("run_01HQ...XYZ");`,
          go: `err := svc.CancelWorkflowRun(ctx, "run_01HQ...XYZ")`,
          py: `await sb.cancel_workflow_run("run_01HQ...XYZ")`,
        }}
      />

      <Callout type="info">
        Each step's completion state is persisted in PostgreSQL. The full execution timeline —
        step statuses, inputs, outputs, timings — is visible in the dashboard. Workflows survive
        runtime restarts and resume from the last completed step automatically.
      </Callout>
    </div>
  );
}
