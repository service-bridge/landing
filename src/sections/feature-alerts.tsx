import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  MessageCircle,
  Send,
  ShieldAlert,
  Webhook,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { CodePanel } from "../ui/CodePanel";
import { FeatureSection } from "../ui/FeatureSection";

const ALERT_CARDS = [
  {
    icon: ShieldAlert,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    title: "Smart Conditions",
    desc: "Six built-in condition types cover the most common failure modes: DLQ spikes, error rate threshold, service going offline, delivery failure storms, job execution errors, and workflow run errors.",
    tags: [
      "dlq_new",
      "error_rate",
      "service_offline",
      "delivery_failures",
      "job_error",
      "workflow_error",
    ],
  },
  {
    icon: MessageCircle,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    title: "Telegram Deep-link",
    desc: "Add your bot token, click 'Get Binding Link', open the link in Telegram and press Start — chat_id is resolved automatically. No manual copy-paste required.",
    tags: ["One-click binding", "No chat_id input", "Confirmation message"],
  },
  {
    icon: Webhook,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    title: "Webhook & In-App",
    desc: "Send structured JSON payloads to any HTTP endpoint with custom headers. In-app alerts fire instantly via WebSocket push — no polling needed.",
    tags: ["Structured JSON", "Custom headers", "Real-time push"],
  },
];

const RULE_PREVIEW = `{
  "name": "DLQ spike",
  "condition_type": "dlq_new",
  "cooldown_seconds": 300,
  "channels": [
    "telegram-oncall",
    "webhook-pagerduty"
  ]
}`;

export function AlertsSection() {
  const content = (
    <div className="grid gap-6">
      {ALERT_CARDS.map((card) => (
        <Card key={card.title}>
          <div className={`inline-flex p-3 rounded-xl ${card.iconBg} mb-4`}>
            <card.icon className={`w-5 h-5 ${card.iconColor}`} />
          </div>
          <div>
            <h3 className="type-subsection-title mb-2">{card.title}</h3>
            <p className="type-body text-muted-foreground">{card.desc}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-3">
            {card.tags.map((tag) => (
              <Badge
                key={tag}
                tone="border-surface-border bg-surface text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  const demo = (
    <div className="space-y-6">
      {/* Flow illustration */}
      <div className="space-y-3">
        {[
          {
            icon: AlertTriangle,
            color: "text-amber-400 bg-amber-400/10",
            label: "Condition triggered",
            sublabel: "error_rate > 10% in last 5 min",
          },
          {
            icon: CheckCircle2,
            color: "text-emerald-400 bg-emerald-400/10",
            label: "Cooldown checked",
            sublabel: "300s since last fire — ok to proceed",
          },
          {
            icon: Bell,
            color: "text-primary bg-primary/10",
            label: "History recorded",
            sublabel: "alert_history INSERT",
          },
          {
            icon: Send,
            color: "text-blue-400 bg-blue-400/10",
            label: "Channels notified",
            sublabel: "Telegram · Webhook · UI push",
          },
          {
            icon: Clock,
            color: "text-violet-400 bg-violet-400/10",
            label: "Cooldown armed",
            sublabel: "Next fire allowed in 5 min",
          },
        ].map((step, i) => (
          <div key={step.label} className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-xl ${step.color} flex items-center justify-center`}
            >
              <step.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 border-l border-surface-border pl-4 pb-3">
              <p className="type-body font-medium">{step.label}</p>
              <p className="type-body-sm text-muted-foreground">{step.sublabel}</p>
            </div>
            {i < 4 && <div className="absolute ml-4 mt-8 w-px h-3 bg-surface-border" />}
          </div>
        ))}
      </div>

      {/* Rule JSON preview */}
      <CodePanel title="alert rule">
        <pre className="p-5 type-body leading-relaxed overflow-x-auto">
          <code className="text-foreground/90">{RULE_PREVIEW}</code>
        </pre>
        <div className="px-5 py-3 border-t border-surface-border bg-code-chrome flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="type-body-sm text-muted-foreground">
            Rule active — cooldown 5 min — 2 channels
          </span>
        </div>
      </CodePanel>
    </div>
  );

  return (
    <FeatureSection
      id="alerts"
      eyebrow="Alerting"
      title={
        <>
          Know before your <span className="text-gradient">users notice</span>
        </>
      }
      subtitle="Configure alert rules directly in the UI. Get notified instantly via Telegram, Webhook, or in-app push when something goes wrong."
      content={content}
      demo={demo}
    />
  );
}
