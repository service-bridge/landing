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
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";

const FLOW_STEPS = [
  {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    label: "Condition triggered",
    sub: "error_rate > 10% in last 5 min",
  },
  {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    label: "Filters passed",
    sub: "cooldown → window → dedup — ok to fire",
  },
  {
    icon: Bell,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    label: "History recorded",
    sub: "alert_history INSERT, rule marked fired",
  },
  {
    icon: Send,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    label: "Channels notified",
    sub: "Telegram · Webhook · Email · in-app · Web-Push",
  },
  {
    icon: Clock,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    label: "Cooldown armed",
    sub: "next fire blocked for cooldown_seconds",
  },
];

const ALERT_FEATURES = [
  {
    icon: ShieldAlert,
    iconColor: "text-red-400",
    title: "Built-in Conditions",
    desc: "Eight condition types: DLQ spikes, error rate, service offline, delivery failures, job errors, workflow errors, metric threshold, latency p99.",
    tags: ["dlq_new", "error_rate", "service_offline", "latency_p99"],
  },
  {
    icon: MessageCircle,
    iconColor: "text-blue-400",
    title: "Telegram",
    desc: "Add a bot token from @BotFather, grab your chat_id via @userinfobot, then deliver in polling or webhook mode.",
    tags: ["Bot API", "Polling or webhook"],
  },
  {
    icon: Webhook,
    iconColor: "text-purple-400",
    title: "Webhook, Email & In-App",
    desc: "Structured JSON to any HTTP endpoint with custom headers, email, in-app alerts over SSE, and browser Web-Push.",
    tags: ["Structured JSON", "SSE + Web-Push"],
  },
];

export function AlertsSection() {
  const content = (
    <div className="space-y-4">
      {ALERT_FEATURES.map((f) => (
        <Card key={f.title}>
          <div className="flex items-start gap-3">
            <f.icon className={`w-5 h-5 mt-0.5 shrink-0 ${f.iconColor}`} />
            <div className="min-w-0">
              <p className="type-subsection-title mb-1">{f.title}</p>
              <p className="type-body-sm text-muted-foreground">{f.desc}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {f.tags.map((tag) => (
                  <Badge key={tag} tone="border-surface-border bg-surface text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const demo = (
    <CodePanel title="alert flow">
      <div className="p-5">
        <div className="relative">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-8 h-8 rounded-xl ${step.bg} flex items-center justify-center shrink-0`}
                >
                  <step.icon className={`w-4 h-4 ${step.color}`} />
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div className="w-px flex-1 min-h-[20px] bg-surface-border mt-1" />
                )}
              </div>
              <div className="pb-4 min-w-0">
                <p className="type-body font-medium">{step.label}</p>
                <p className="type-body-sm text-muted-foreground">{step.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CodePanel>
  );

  return (
    <FeatureSection
      id="alerts"
      eyebrow="Alerting"
      title="Know before your users notice"
      subtitle="Configure alert rules directly in the UI. Get notified instantly via Telegram, Webhook, email, in-app, or browser Web-Push when something goes wrong."
      content={content}
      demo={demo}
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={ShieldAlert}
            title="8 condition types"
            description="DLQ spikes, error rate, service offline, delivery failures, job errors, workflow errors, metric threshold, latency p99 — covers the most common failure modes."
            iconClassName="text-red-400"
          />
          <FeatureCard
            variant="compact"
            icon={MessageCircle}
            title="Telegram delivery"
            description="Bot token from @BotFather, chat_id from the @userinfobot helper, polling or webhook mode — Markdown messages via the Bot API."
            iconClassName="text-blue-400"
          />
          <FeatureCard
            variant="compact"
            icon={Webhook}
            title="Webhook, email, in-app"
            description="Send JSON to any endpoint with custom headers, deliver by email, push in-app alerts over SSE and to the browser via Web-Push — zero polling."
            iconClassName="text-purple-400"
          />
          <FeatureCard
            variant="compact"
            icon={Clock}
            title="Cooldown protection"
            description="A cooldown → window → dedup filter chain prevents alert storms. Each rule tracks last fire time and respects its cooldown_seconds interval."
            iconClassName="text-violet-400"
          />
        </>
      }
    />
  );
}
