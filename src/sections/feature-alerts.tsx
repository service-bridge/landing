import { motion } from "framer-motion";
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
import { AnimatedSection, fadeInUp, stagger } from "../components/animations";
import { SectionHeader } from "../ui/SectionHeader";

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
  return (
    <AnimatedSection id="alerts" className="py-24 sm:py-32 border-t border-border/40">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="Alerting"
          title={
            <>
              Know before your <span className="text-primary">users notice</span>
            </>
          }
          subtitle="Configure alert rules directly in the UI. Get notified instantly via Telegram, Webhook, or in-app push when something goes wrong."
        />

        {/* Cards */}
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {ALERT_CARDS.map((card) => (
            <motion.div
              key={card.title}
              variants={fadeInUp}
              className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 space-y-4"
            >
              <div className={`inline-flex p-3 rounded-xl ${card.iconBg}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-2xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom: flow illustration + code preview */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
        >
          {/* Left: flow */}
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
                  className={`flex-shrink-0 w-8 h-8 rounded-lg ${step.color} flex items-center justify-center`}
                >
                  <step.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 border-l border-border/40 pl-4 pb-3">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.sublabel}</p>
                </div>
                {i < 4 && <div className="absolute ml-4 mt-8 w-px h-3 bg-border/40" />}
              </div>
            ))}
          </div>

          {/* Right: rule JSON preview */}
          <div className="rounded-2xl border border-border/60 bg-card/80 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-amber-400/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">alert rule</span>
            </div>
            <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto">
              <code className="text-foreground/90">{RULE_PREVIEW}</code>
            </pre>
            <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">
                Rule active — cooldown 5 min — 2 channels
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
