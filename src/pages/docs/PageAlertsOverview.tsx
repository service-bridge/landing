import { Callout, H2, P, PageHeader } from "../../ui/DocComponents";

export function PageAlertsOverview() {
  return (
    <div>
      <PageHeader
        badge="Alerts"
        title="Alerts Overview"
        description="ServiceBridge has a built-in alerting system that evaluates rules every 30 seconds and sends notifications to configured channels. No Alertmanager, no PagerDuty configuration."
      />

      <H2 id="how-it-works">How it works</H2>
      <P>
        Alert rules are created and managed entirely through the dashboard UI — no config files, no
        restarts. Each rule has a condition type, parameters, a cooldown period, and one or more
        notification channels.
      </P>
      <P>
        Rules are evaluated on the server every 30 seconds. When a condition fires, notifications
        are sent to all attached channels. The rule enters a cooldown period and won't fire again
        until it expires.
      </P>

      <Callout type="tip">
        The cooldown mechanism prevents alert storms during prolonged incidents. Once a rule fires,
        it won't fire again until <strong>cooldown_seconds</strong> (default: 300) have elapsed.
      </Callout>

      <H2 id="stats">At a glance</H2>
      <div className="grid sm:grid-cols-3 gap-3 my-5">
        {[
          [
            "6",
            "Alert condition types",
            "dlq_new, error_rate, service_offline, delivery_failures, job_error, workflow_error",
          ],
          ["3", "Channel types", "UI push via WebSocket, Telegram Bot API, custom Webhook"],
          ["30s", "Evaluation interval", "Rules are evaluated every 30 seconds on the server"],
        ].map(([num, label, desc]) => (
          <div key={label} className="rounded-2xl border border-surface-border bg-surface p-4">
            <p className="text-2xl font-bold font-display text-primary mb-1">{num}</p>
            <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <H2 id="getting-started">Getting started</H2>
      <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          Open the dashboard and navigate to <strong>Alerts → Channels</strong>.
        </li>
        <li>Add a notification channel (UI, Telegram, or Webhook).</li>
        <li>
          Navigate to <strong>Alerts → Rules</strong> and create a rule.
        </li>
        <li>Select a condition type, set parameters, attach the channel.</li>
        <li>Save — the rule starts evaluating immediately.</li>
      </ol>
    </div>
  );
}
