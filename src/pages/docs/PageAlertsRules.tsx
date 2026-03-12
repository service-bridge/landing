import { H2, PageHeader, ParamTable } from "../../ui/DocComponents";

export function PageAlertsRules() {
  return (
    <div>
      <PageHeader
        badge="Alerts"
        title="Alert Rules"
        description="Each rule has a condition type and parameters. Six built-in condition types cover the most common failure scenarios."
      />

      <H2 id="condition-types">Condition Types</H2>
      <ParamTable
        rows={[
          {
            name: "dlq_new",
            type: "—",
            desc: "Fires whenever new DLQ entries appear since the last evaluation cycle. No parameters needed.",
          },
          {
            name: "error_rate",
            type: "threshold_pct, window_minutes, service?",
            desc: "Fires when the error percentage of runs in the last N minutes exceeds threshold_pct. Optional service filter.",
          },
          {
            name: "service_offline",
            type: "service, offline_after_seconds",
            desc: "Fires when the specified service hasn't sent a heartbeat within offline_after_seconds.",
          },
          {
            name: "delivery_failures",
            type: "threshold, window_minutes, topic?",
            desc: "Fires when rejected/DLQ delivery count in the window exceeds threshold. Optional topic filter.",
          },
          {
            name: "job_error",
            type: "threshold, window_minutes, job_ref?",
            desc: "Fires when failed job execution count in the window exceeds threshold. Optional job_ref filter.",
          },
          {
            name: "workflow_error",
            type: "threshold, window_minutes, workflow_name?",
            desc: "Fires when failed workflow run count in the window exceeds threshold. Optional workflow_name filter.",
          },
        ]}
      />

      <H2 id="rule-settings">Rule Settings</H2>
      <ParamTable
        rows={[
          {
            name: "cooldown_seconds",
            type: "number",
            default: "300",
            desc: "Minimum seconds between repeated notifications for the same rule. Prevents alert storms.",
          },
          {
            name: "enabled",
            type: "boolean",
            default: "true",
            desc: "Rules can be toggled on/off from the UI without deleting them.",
          },
          {
            name: "channels",
            type: "Channel[]",
            desc: "One or more notification channels. All attached channels receive the alert simultaneously.",
          },
        ]}
      />
    </div>
  );
}
