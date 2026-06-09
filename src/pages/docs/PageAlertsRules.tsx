import { Callout, H2, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Alerts",
    title: "Alert Rules",
    description:
      "A rule pairs a condition type with its config. The evaluator re-checks every enabled rule on each tick (15s by default) and fires the moment the condition is met. Eight built-in condition types cover the failure modes you hit most.",

    conditionTypesTitle: "Condition types",
    conditionTypesP:
      "Each rule stores a condition_type and a JSON condition config. On save the runtime validates that config against the type's schema, so only the fields below get through. Window sizes are whole minutes, and the dlq_new window is fixed at 5 minutes.",

    dlqNewDesc:
      "Fires when at least one new entry lands in the dead-letter queue within a fixed 5-minute look-back. No config.",
    errorRateDesc:
      "Fires when the error share of spans over the window reaches threshold_pct (0–100). Optional service_ids narrows the scope.",
    serviceOfflineDesc:
      "Fires when a targeted active service has no connected instance. Empty service_ids checks every active service.",
    deliveryFailuresDesc:
      "Fires when dead-letter event deliveries in the window reach threshold. Optional topics filter.",
    jobErrorDesc:
      "Fires when failed job executions in the window reach threshold. Optional job_refs filter.",
    workflowErrorDesc:
      "Fires when failed workflow runs in the window reach threshold. Optional workflow_names filter.",
    metricThresholdDesc:
      "Fires when a named metric compares true against value. comparator is one of > >= < <= == !=. Optional labels select a series. No data means no fire.",
    latencyP99Desc:
      "Fires when p99 latency over the window is at or above threshold_ms. Optional service filter.",

    paramsNote:
      "The array filters (service_ids, topics, job_refs, workflow_names) are optional. Leave one out and it matches everything.",

    ruleSettingsTitle: "Rule settings",
    ruleSettingsP:
      "Beyond the condition, every rule carries delivery and scheduling settings shared by all condition types.",

    severityDesc: 'One of "info", "warning", "critical". Empty defaults to "warning".',
    cooldownDesc:
      "Minimum seconds between repeated firings of the same rule. Must be greater than 0. Prevents alert storms.",
    enabledDesc:
      "Toggle the rule on/off from the dashboard without deleting it. Disabled rules are skipped by the evaluator.",
    channelsDesc:
      "Notification channels attached to the rule. Every attached channel receives the alert in parallel.",

    tickNote:
      "The evaluator tick interval is set in Settings (alerts.eval_tick_ms, default 15000 ms, range 10000–30000). A change applies live without a restart.",
  },
  ru: {
    badge: "Алерты",
    title: "Правила алертов",
    description:
      "Правило связывает тип условия с его конфигом. Evaluator перепроверяет каждое включённое правило на каждом тике (по умолчанию 15с) и срабатывает, как только условие выполнено. Восемь встроенных типов условий покрывают самые частые сбои.",

    conditionTypesTitle: "Типы условий",
    conditionTypesP:
      "Каждое правило хранит condition_type и JSON-конфиг условия. При сохранении рантайм сверяет конфиг со схемой типа, поэтому проходят только перечисленные ниже поля. Размеры окна задаются в целых минутах, а окно dlq_new фиксировано на 5 минут.",

    dlqNewDesc:
      "Срабатывает, когда в dead-letter queue появляется хотя бы одна новая запись за фиксированное окно 5 минут. Конфига нет.",
    errorRateDesc:
      "Срабатывает, когда доля ошибочных спанов за окно достигает threshold_pct (0–100). Опциональный service_ids сужает область.",
    serviceOfflineDesc:
      "Срабатывает, когда у целевого активного сервиса нет ни одного подключённого инстанса. Пустой service_ids проверяет все активные сервисы.",
    deliveryFailuresDesc:
      "Срабатывает, когда количество dead-letter доставок событий за окно достигает threshold. Опциональный фильтр topics.",
    jobErrorDesc:
      "Срабатывает, когда количество ошибок выполнения задач за окно достигает threshold. Опциональный фильтр job_refs.",
    workflowErrorDesc:
      "Срабатывает, когда количество неуспешных запусков workflow за окно достигает threshold. Опциональный фильтр workflow_names.",
    metricThresholdDesc:
      "Срабатывает, когда именованная метрика истинно сравнивается с value. comparator — один из > >= < <= == !=. Опциональный labels выбирает серию. Нет данных — нет срабатывания.",
    latencyP99Desc:
      "Срабатывает, когда p99-латентность за окно достигает или превышает threshold_ms. Опциональный фильтр service.",

    paramsNote:
      "Фильтры-массивы (service_ids, topics, job_refs, workflow_names) опциональны. Если оставить такой пустым, он совпадает со всем.",

    ruleSettingsTitle: "Настройки правила",
    ruleSettingsP:
      "Помимо условия каждое правило несёт настройки доставки и расписания, общие для всех типов условий.",

    severityDesc: 'Один из "info", "warning", "critical". Пустое значение → "warning".',
    cooldownDesc:
      "Минимум секунд между повторными срабатываниями одного правила. Должно быть больше 0. Предотвращает шторм алертов.",
    enabledDesc:
      "Включение/отключение правила из дашборда без удаления. Отключённые правила пропускаются evaluator-ом.",
    channelsDesc:
      "Каналы уведомлений, привязанные к правилу. Каждый привязанный канал получает алерт параллельно.",

    tickNote:
      "Интервал тика evaluator задаётся в Settings (alerts.eval_tick_ms, по умолчанию 15000 мс, диапазон 10000–30000). Изменение применяется на лету без рестарта.",
  },
};

export function PageAlertsRules() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="condition-types">{t.conditionTypesTitle}</H2>
      <P>{t.conditionTypesP}</P>
      <ParamTable
        rows={[
          {
            name: "dlq_new",
            type: "—",
            desc: t.dlqNewDesc,
          },
          {
            name: "error_rate",
            type: "threshold_pct, window_minutes, service_ids?",
            desc: t.errorRateDesc,
          },
          {
            name: "service_offline",
            type: "service_ids?",
            desc: t.serviceOfflineDesc,
          },
          {
            name: "delivery_failures",
            type: "threshold, window_minutes, topics?",
            desc: t.deliveryFailuresDesc,
          },
          {
            name: "job_error",
            type: "threshold, window_minutes, job_refs?",
            desc: t.jobErrorDesc,
          },
          {
            name: "workflow_error",
            type: "threshold, window_minutes, workflow_names?",
            desc: t.workflowErrorDesc,
          },
          {
            name: "metric_threshold",
            type: "metric, comparator, value, labels?",
            desc: t.metricThresholdDesc,
          },
          {
            name: "latency_p99",
            type: "threshold_ms, window_minutes, service?",
            desc: t.latencyP99Desc,
          },
        ]}
      />
      <Callout type="info">{t.paramsNote}</Callout>

      <H2 id="rule-settings">{t.ruleSettingsTitle}</H2>
      <P>{t.ruleSettingsP}</P>
      <ParamTable
        rows={[
          {
            name: "severity",
            type: "string",
            default: '"warning"',
            desc: t.severityDesc,
          },
          {
            name: "cooldown_seconds",
            type: "number",
            desc: t.cooldownDesc,
          },
          {
            name: "enabled",
            type: "boolean",
            default: "true",
            desc: t.enabledDesc,
          },
          {
            name: "channels",
            type: "Channel[]",
            desc: t.channelsDesc,
          },
        ]}
      />
      <Callout type="tip">
        <Mono>alerts.eval_tick_ms</Mono> — {t.tickNote}
      </Callout>
    </div>
  );
}
