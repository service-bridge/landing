import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  MessageCircle,
  Send,
  ShieldAlert,
  Webhook,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/button";
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
    iconColor: "text-amber-400",
    title: "Define the condition",
    desc: "Pick a condition type and a threshold — error_rate > 10% in 5 min, or DLQ grew by 50 in 1 min. 8 built-in types cover the common failure modes.",
    tags: ["dlq_new", "error_rate", "service_offline", "latency_p99"],
  },
  {
    icon: Filter,
    iconColor: "text-emerald-400",
    title: "Tune the filter chain",
    desc: "A cooldown → window → dedup chain decides when a rule may fire, so a single incident never turns into an alert storm.",
    tags: ["cooldown", "window", "dedup"],
  },
  {
    icon: CheckCircle2,
    iconColor: "text-violet-400",
    title: "All in the UI",
    desc: "Create and edit rules in the console — no YAML, no PromQL. Every fire is recorded in alert_history for later review.",
    tags: ["No YAML", "No PromQL", "alert_history"],
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
                  <Badge key={tag} tone="border-border bg-muted/50 text-foreground/80">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
      <Button asChild variant="link" size="sm" className="h-auto px-0 text-emerald-300">
        <a href="#docs">
          Set up an alert rule in the UI in under a minute
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </a>
      </Button>
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
      subtitle="No YAML, no PromQL — alert rules live in the UI. Get notified instantly via Telegram, Webhook, email, in-app, or browser Web-Push when something goes wrong."
      content={content}
      demo={demo}
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={ShieldAlert}
            title="8 condition types"
            description="Covers the most common failure modes — from DLQ spikes and error rate to latency p99."
            iconClassName="text-red-400"
          />
          <FeatureCard
            variant="compact"
            icon={MessageCircle}
            title="Telegram delivery"
            description="Bot token from @BotFather, chat_id from @userinfobot — deliver in polling or webhook mode."
            iconClassName="text-blue-400"
          />
          <FeatureCard
            variant="compact"
            icon={Webhook}
            title="Webhook, email, in-app"
            description="Structured JSON to any endpoint (custom headers), email, in-app over SSE, browser Web-Push."
            iconClassName="text-purple-400"
          />
          <FeatureCard
            variant="compact"
            icon={Clock}
            title="Cooldown protection"
            description="A cooldown → window → dedup chain prevents alert storms; each rule respects its cooldown_seconds."
            iconClassName="text-violet-400"
          />
        </>
      }
    />
  );
}
