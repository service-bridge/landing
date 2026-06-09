import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Alerts",
    title: "Overview",
    description:
      "The runtime ships with a built-in alerting subsystem. An evaluator checks your rules on a fixed tick, a filter chain drops the noise, and surviving alerts go out to your notification channels. No Alertmanager, no PagerDuty, no extra container to run.",

    howItWorksTitle: "How it works",
    howItWorksP1:
      "You create and manage rules and channels from the dashboard. There are no config files and no restarts. A rule holds a condition type, the thresholds for that condition, a cooldown, a severity, and one or more channels it delivers to.",
    howItWorksP2:
      "The evaluator wakes on a periodic tick. Each tick it loads every enabled rule, checks each condition against live runtime data (DLQ depth, error rate, offline services, latency), and sends any rule that fires into the filter chain before delivery.",
    howItWorksP3:
      "The filter chain runs three stages in order. Cooldown skips a rule that already fired inside its window. Window (optional) holds back until the rule fires N times within a time window. Dedup collapses alerts that share a payload signature inside the window. What survives fans out to every attached channel in parallel, with exponential-backoff retries, and the runtime records each delivery attempt in the alert history.",
    tickCallout1: "The evaluation tick is settings-driven, not hardcoded.",
    tickCallout2: "controls it. Default",
    tickCallout3: "ms, allowed range",
    tickCallout4: "Edit it at the dashboard Settings page; the change applies live without a restart.",
    cooldownCallout:
      "Every rule must set a positive cooldown. After a rule fires, it will not fire again until",
    cooldownCalloutAfter: "have elapsed. This keeps a long incident from turning into an alert storm.",

    statsTitle: "At a glance",
    statConditionLabel: "Condition types",
    statConditionDesc:
      "dlq_new, error_rate, service_offline, delivery_failures, job_error, workflow_error, metric_threshold, latency_p99",
    statChannelLabel: "Channel kinds",
    statChannelDesc: "inapp (UI), email, telegram, webhook, browser_push",
    statSeverityLabel: "Severity levels",
    statSeverityDesc: "info, warning (default), critical",
    statRetentionLabel: "History retention",
    statRetentionDesc:
      "alert_history is pruned to alerts.retention_ms (default 30 days), also settings-driven and live",
  },
  ru: {
    badge: "Алерты",
    title: "Обзор",
    description:
      "В рантайм встроена подсистема алертов. Evaluator проверяет ваши правила на фиксированном тике, цепочка фильтров отсекает шум, а уцелевшие алерты уходят в ваши каналы уведомлений. Без Alertmanager, без PagerDuty, без отдельного контейнера.",

    howItWorksTitle: "Как работает",
    howItWorksP1:
      "Правила и каналы вы создаёте и настраиваете прямо в дашборде. Конфиг-файлов нет, перезапусков тоже. Правило хранит тип условия, пороги для этого условия, cooldown, severity и один или несколько каналов, в которые доставляет.",
    howItWorksP2:
      "Evaluator просыпается по периодическому тику. На каждом тике он берёт все включённые правила, сверяет каждое условие с живыми данными рантайма (глубина DLQ, error rate, офлайн-сервисы, latency) и любое сработавшее правило отправляет в цепочку фильтров перед доставкой.",
    howItWorksP3:
      "Цепочка фильтров проходит три стадии по порядку. Cooldown пропускает правило, которое уже срабатывало внутри своего окна. Window (опционально) придерживает алерт, пока правило не сработает N раз за окно времени. Dedup схлопывает алерты с одинаковой сигнатурой payload внутри окна. Что уцелело, параллельно расходится по всем привязанным каналам с ретраями по экспоненциальному backoff, а каждую попытку доставки рантайм пишет в историю алертов.",
    tickCallout1: "Интервал проверки задаётся настройками, а не зашит в код.",
    tickCallout2: "управляет им — по умолчанию",
    tickCallout3: "мс, допустимый диапазон",
    tickCallout4: "Меняется на странице Settings дашборда; изменение применяется на лету без перезапуска.",
    cooldownCallout:
      "У каждого правила должен быть положительный cooldown. После срабатывания правило не сработает снова, пока не пройдёт",
    cooldownCalloutAfter: ". Так затяжной инцидент не превращается в шторм алертов.",

    statsTitle: "Кратко",
    statConditionLabel: "Типы условий",
    statConditionDesc:
      "dlq_new, error_rate, service_offline, delivery_failures, job_error, workflow_error, metric_threshold, latency_p99",
    statChannelLabel: "Виды каналов",
    statChannelDesc: "inapp (UI), email, telegram, webhook, browser_push",
    statSeverityLabel: "Уровни severity",
    statSeverityDesc: "info, warning (по умолчанию), critical",
    statRetentionLabel: "Хранение истории",
    statRetentionDesc:
      "alert_history прунится до alerts.retention_ms (по умолчанию 30 дней), тоже из настроек и на лету",
  },
};

export function PageAlertsOverview() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="how-it-works">{t.howItWorksTitle}</H2>
      <P>{t.howItWorksP1}</P>
      <P>{t.howItWorksP2}</P>
      <P>{t.howItWorksP3}</P>

      <Callout type="info">
        {t.tickCallout1} <Mono>alerts.eval_tick_ms</Mono> {t.tickCallout2} <strong>15000</strong>{" "}
        {t.tickCallout3} <Mono>[10000, 30000]</Mono>. {t.tickCallout4}
      </Callout>

      <Callout type="tip">
        {t.cooldownCallout} <Mono>cooldown_seconds</Mono> {t.cooldownCalloutAfter}
      </Callout>

      <H2 id="stats">{t.statsTitle}</H2>
      <div className="grid sm:grid-cols-2 gap-3 my-5">
        {[
          ["8", t.statConditionLabel, t.statConditionDesc],
          ["5", t.statChannelLabel, t.statChannelDesc],
          ["3", t.statSeverityLabel, t.statSeverityDesc],
          ["30d", t.statRetentionLabel, t.statRetentionDesc],
        ].map(([num, label, desc]) => (
          <div key={label} className="rounded-2xl border border-surface-border bg-surface p-4">
            <p className="text-2xl font-bold font-display text-primary mb-1">{num}</p>
            <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
