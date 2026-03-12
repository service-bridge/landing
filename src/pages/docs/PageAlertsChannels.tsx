import { DocCodeBlock, H2, P, PageHeader, ParamTable } from "../../ui/DocComponents";

export function PageAlertsChannels() {
  return (
    <div>
      <PageHeader
        badge="Alerts"
        title="Notification Channels"
        description="Three channel types: UI push (WebSocket), Telegram Bot, and custom Webhook. Add channels from the dashboard — no config files needed."
      />

      <ParamTable
        rows={[
          {
            name: "ui",
            type: "—",
            desc: "Real-time in-app notification delivered via WebSocket push to all connected dashboard sessions.",
          },
          {
            name: "telegram",
            type: "bot_token, chat_id",
            desc: "Sends a Markdown-formatted message via Telegram Bot API. chat_id is resolved automatically via the binding flow.",
          },
          {
            name: "webhook",
            type: "url, headers?",
            desc: "HTTP POST with a structured JSON payload to any URL. Optional custom headers (e.g. Authorization).",
          },
        ]}
      />

      <H2 id="webhook-payload">Webhook Payload</H2>
      <P>The webhook receives a JSON POST body with this schema:</P>
      <DocCodeBlock
        lang="json"
        code={`{
  "rule_id":        "uuid",
  "rule_name":      "DLQ spike",
  "condition_type": "dlq_new",
  "message":        "3 new dead-letter message(s) in the last cycle",
  "details":        { "dlq_count": 3, "since": "2026-03-08T10:00:00Z" },
  "fired_at":       "2026-03-08T10:00:30Z"
}`}
      />

      <H2 id="webhook-headers">Custom webhook headers</H2>
      <P>
        Use custom headers to authenticate webhook deliveries. For example, to send to a Slack
        incoming webhook or a custom receiver with Bearer auth:
      </P>
      <DocCodeBlock
        lang="json"
        code={`{
  "url": "https://hooks.slack.com/services/T.../B.../...",
  "headers": {
    "Content-Type": "application/json"
  }
}`}
      />
    </div>
  );
}
