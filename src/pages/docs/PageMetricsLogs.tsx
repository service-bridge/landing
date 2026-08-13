import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  DocCodeBlock,
  H2,
  H3,
  Mono,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Observability",
    title: "Metrics & Logs",
    description:
      "Emit your own counters, gauges, histograms and structured logs from worker code via sb.telemetry. Everything ships over the telemetry stream and shows up in the dashboard, auto-tagged with your instance_id.",

    metricsTitle: "Metrics",
    metricsIntro1pre: "The built-in domains (RPC, HTTP, events, workflows, jobs) are traced by the runtime",
    metricsIntro1bold: "automatically",
    metricsIntro1post:
      ", so you never record those. Custom metrics cover the numbers only your business logic knows.",
    metricsIntro2pre: "Create a metric handle from",
    metricsIntro2post:
      "and call it. There are three kinds; create each handle once and reuse it.",
    metricsKindsTitle: "Three kinds",
    counterDesc: "Monotonically increasing count. .inc() adds 1, .inc(n) adds n.",
    gaugeDesc: "A value that goes up and down. .set(value) writes the current reading.",
    histogramDesc:
      "A distribution of observations like latency or sizes. .observe(value) records one sample; the unit defaults to \"s\".",
    metricsSigTitle: "Signatures",
    counterSig: "sb.telemetry.counter(name, labels?)",
    gaugeSig: "sb.telemetry.gauge(name, labels?)",
    histogramSig: "sb.telemetry.histogram(name, unit?, labels?)",
    metricsLabels1pre: "The optional",
    metricsLabels1post:
      "argument is a flat object of string-only tags. Every metric is also tagged with the current",
    metricsLabels1end: "automatically, so each reading is tied to the instance that produced it.",
    metricsCallout:
      "Metric handles can be created before start(). Points buffer in a local ring and flush to the runtime as soon as a session exists.",

    logsTitle: "Log capture",
    logsIntro1pre: "Write structured logs through",
    logsIntro1mid: "(or the shorthand",
    logsIntro1post:
      "). Four levels are available; the second argument is an arbitrary object of structured fields, serialized to JSON.",
    logsFieldsDesc:
      "Each entry is auto-tagged with the current instance_id and, inside a traced operation, the active trace and op id, so a log line links straight to its trace in the dashboard.",
    logsLevelsTitle: "Levels",
    logsLevelsDesc: "debug, info, warn, error. All take (message, fields?).",
    logsCallout:
      "No logging config to set up. The SDK pushes metrics and logs over the same telemetry gRPC stream as traces, and you read them in the built-in dashboard. How long they stay is a runtime setting: tune the telemetry.* retention keys in the dashboard at /settings, never an environment variable.",

    prometheusTitle: "Prometheus export",
    prometheusIntro:
      "When enabled in the dashboard under Settings → obsexport.prometheus.enable, the runtime exposes a standard Prometheus text-format endpoint at :14446/metrics. A Prometheus server scrapes it on its own schedule — no push required.",
    prometheusScrapeCfg: `scrape_configs:
  - job_name: servicebridge
    static_configs:
      - targets: ["runtime.internal:14446"]
    # optional bearer token — matches obsexport.metrics_bearer_token
    authorization:
      credentials: <token>`,
    prometheusSettings: [
      { name: "obsexport.prometheus.enable", type: "bool", default: "false", desc: "Enable the /metrics pull endpoint." },
      { name: "network.obsexport_port", type: "int", default: "14446", desc: "TCP port for the obsexport listener. Restart required." },
      { name: "obsexport.metrics_bearer_token", type: "string", default: '""', desc: "Optional Bearer token; when set, scrape requests without a matching Authorization header receive 401." },
      { name: "obsexport.metrics_window_ms", type: "int64 ms", default: "60000", desc: "Lookback window for the latest metric sample per series. Default 60 s." },
      { name: "obsexport.metrics_series_cap", type: "int", default: "100000", desc: "Maximum number of series emitted in one scrape response." },
    ],
    prometheusCallout:
      "All exporters are disabled by default. Enable them live in the dashboard under /settings — no runtime restart needed (except network.obsexport_port, which rebinds a socket).",

    lokiTitle: "Loki export",
    lokiIntro:
      "When obsexport.loki.enable is set to true (requires obsexport.loki.endpoint), the runtime pushes structured log batches to an existing Loki instance via POST /loki/api/v1/push. The runtime does not run its own Loki server.",
    lokiLabels: "Each log stream carries three fixed labels: {service, level, source}. The instance label is added when obsexport.loki.instance_label_enabled is true. trace_id and op_id are emitted as structured metadata, so LogQL queries can correlate log lines with traces in Grafana.",
    lokiAtLeastOnce:
      "Delivery is at-least-once. A persistent cursor in the obsexport_cursors table tracks the last pushed position (unix-ms + tiebreak id); a runtime restart re-emits from the cursor, not from zero. A bounded in-memory buffer absorbs bursts — when the buffer is full and Loki is slow, the oldest batch is dropped to bound memory use. The drop count is tracked in-process only; it is not exposed as a metric.",
    lokiSettings: [
      { name: "obsexport.loki.enable", type: "bool", default: "false", desc: "Enable Loki push. Requires obsexport.loki.endpoint." },
      { name: "obsexport.loki.endpoint", type: "string", default: '""', desc: "Loki push API URL, e.g. http://loki:3100." },
      { name: "obsexport.loki.bearer_token", type: "string", default: '""', desc: "Optional Bearer token for Loki authentication." },
      { name: "obsexport.loki.instance_label_enabled", type: "bool", default: "false", desc: "Add instance label to each Loki stream." },
      { name: "obsexport.loki.push_interval_ms", type: "int64 ms", default: "10000", desc: "Push cycle interval. Default 10 s." },
      { name: "obsexport.loki.buffer_max_batches", type: "int", default: "1000", desc: "Max queued batches; drop-oldest on overflow." },
    ],
  },
  ru: {
    badge: "Наблюдаемость",
    title: "Метрики и логи",
    description:
      "Отправляйте свои счётчики, gauge, гистограммы и структурные логи из кода воркера через sb.telemetry. Всё уходит по потоку телеметрии и появляется в дашборде, авто-тегированное вашим instance_id.",

    metricsTitle: "Метрики",
    metricsIntro1pre: "Встроенные домены (RPC, HTTP, события, воркфлоу, задания) рантайм трейсит",
    metricsIntro1bold: "сам",
    metricsIntro1post:
      ", так что руками вы их не пишете. Свои метрики нужны для чисел, которые знает только ваша бизнес-логика.",
    metricsIntro2pre: "Создайте хендл метрики из",
    metricsIntro2post:
      "и вызывайте его. Видов три; каждый хендл создавайте один раз и переиспользуйте.",
    metricsKindsTitle: "Три вида",
    counterDesc: "Монотонно растущий счётчик. .inc() прибавляет 1, .inc(n) — на n.",
    gaugeDesc: "Значение, которое растёт и падает. .set(value) записывает текущий замер.",
    histogramDesc:
      "Распределение наблюдений вроде задержек или размеров. .observe(value) записывает один сэмпл; единица по умолчанию \"s\".",
    metricsSigTitle: "Сигнатуры",
    counterSig: "sb.telemetry.counter(name, labels?)",
    gaugeSig: "sb.telemetry.gauge(name, labels?)",
    histogramSig: "sb.telemetry.histogram(name, unit?, labels?)",
    metricsLabels1pre: "Необязательный аргумент",
    metricsLabels1post:
      "— плоский объект меток (только строки). Каждая метрика также авто-тегируется текущим",
    metricsLabels1end: ", так что замер привязан к инстансу, который его произвёл.",
    metricsCallout:
      "Хендлы метрик можно создавать до start(). Точки буферизуются в локальном ring-буфере и уходят в рантайм, как только появится сессия.",

    logsTitle: "Захват логов",
    logsIntro1pre: "Пишите структурные логи через",
    logsIntro1mid: "(или короткий алиас",
    logsIntro1post:
      "). Доступны четыре уровня; второй аргумент — произвольный объект структурных полей, сериализуемый в JSON.",
    logsFieldsDesc:
      "Каждая запись авто-тегируется текущим instance_id, а внутри трейсимой операции — активным trace и op id, поэтому строка лога ведёт прямо к своему трейсу в дашборде.",
    logsLevelsTitle: "Уровни",
    logsLevelsDesc: "debug, info, warn, error. Все принимают (message, fields?).",
    logsCallout:
      "Никакой настройки логирования нет. SDK шлёт метрики и логи по тому же gRPC-потоку телеметрии, что и трейсы, а читаете вы их во встроенном дашборде. Срок хранения — настройка рантайма: правьте ключи telemetry.* в дашборде на /settings, не переменную окружения.",

    prometheusTitle: "Экспорт Prometheus",
    prometheusIntro:
      "При включении в дашборде (Settings → obsexport.prometheus.enable) рантайм открывает эндпоинт в стандартном text-формате Prometheus на :14446/metrics. Prometheus-сервер скрейпит его по своему расписанию — push не нужен.",
    prometheusScrapeCfg: `scrape_configs:
  - job_name: servicebridge
    static_configs:
      - targets: ["runtime.internal:14446"]
    # опциональный bearer-токен — совпадает с obsexport.metrics_bearer_token
    authorization:
      credentials: <token>`,
    prometheusSettings: [
      { name: "obsexport.prometheus.enable", type: "bool", default: "false", desc: "Включить pull-эндпоинт /metrics." },
      { name: "network.obsexport_port", type: "int", default: "14446", desc: "TCP-порт слушателя obsexport. Требуется рестарт." },
      { name: "obsexport.metrics_bearer_token", type: "string", default: '""', desc: "Опциональный Bearer-токен; при установке запросы без совпадающего Authorization получают 401." },
      { name: "obsexport.metrics_window_ms", type: "int64 ms", default: "60000", desc: "Окно последнего сэмпла на серию. По умолчанию 60 с." },
      { name: "obsexport.metrics_series_cap", type: "int", default: "100000", desc: "Максимум серий в одном scrape-ответе." },
    ],
    prometheusCallout:
      "Все экспортёры выключены по умолчанию. Включаются вживую в дашборде на /settings — рестарт рантайма не нужен (кроме network.obsexport_port, который перепривязывает сокет).",

    lokiTitle: "Экспорт Loki",
    lokiIntro:
      "При включении obsexport.loki.enable=true (требует obsexport.loki.endpoint) рантайм пушит батчи структурированных логов в существующий Loki через POST /loki/api/v1/push. Собственного сервера Loki рантайм не поднимает.",
    lokiLabels: "Каждый лог-стрим несёт три фиксированных метки: {service, level, source}. Метка instance добавляется при obsexport.loki.instance_label_enabled=true. trace_id и op_id передаются как structured metadata — LogQL-запросы могут сопоставлять строки логов с трейсами в Grafana.",
    lokiAtLeastOnce:
      "Доставка at-least-once. Постоянный курсор в таблице obsexport_cursors отслеживает последнюю отправленную позицию (unix-ms + tiebreak id); рестарт рантайма продолжает с курсора, а не с нуля. Ограниченный in-memory буфер поглощает всплески — при заполнении и медленном Loki старейший батч сбрасывается, чтобы ограничить потребление памяти. Счётчик сбросов отслеживается только внутри процесса и не экспортируется как метрика.",
    lokiSettings: [
      { name: "obsexport.loki.enable", type: "bool", default: "false", desc: "Включить Loki push. Требует obsexport.loki.endpoint." },
      { name: "obsexport.loki.endpoint", type: "string", default: '""', desc: "URL Loki push API, например http://loki:3100." },
      { name: "obsexport.loki.bearer_token", type: "string", default: '""', desc: "Опциональный Bearer-токен для аутентификации в Loki." },
      { name: "obsexport.loki.instance_label_enabled", type: "bool", default: "false", desc: "Добавлять метку instance к каждому Loki stream." },
      { name: "obsexport.loki.push_interval_ms", type: "int64 ms", default: "10000", desc: "Интервал push-цикла. По умолчанию 10 с." },
      { name: "obsexport.loki.buffer_max_batches", type: "int", default: "1000", desc: "Максимум батчей в очереди; drop-oldest при переполнении." },
    ],
  },
};

export function PageMetricsLogs() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="metrics">{t.metricsTitle}</H2>
      <P>
        {t.metricsIntro1pre} <strong>{t.metricsIntro1bold}</strong> {t.metricsIntro1post}
      </P>
      <P>
        {t.metricsIntro2pre} <Mono>sb.telemetry</Mono> {t.metricsIntro2post}
      </P>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge("localhost:14445", key);

// Counter: monotonically increasing
const charges = sb.telemetry.counter("charges_total", { currency: "usd" });
charges.inc();        // +1
charges.inc(3);       // +3

// Gauge: goes up and down
const queueDepth = sb.telemetry.gauge("queue_depth");
queueDepth.set(42);

// Histogram: distribution; unit defaults to "s"
const latency = sb.telemetry.histogram("charge_latency", "s");
latency.observe(0.137);`,
        }}
      />

      <H3 id="metrics-kinds">{t.metricsKindsTitle}</H3>
      <ParamTable
        rows={[
          { name: "counter", type: ".inc(amount = 1)", desc: t.counterDesc },
          { name: "gauge", type: ".set(value)", desc: t.gaugeDesc },
          { name: "histogram", type: ".observe(value)", desc: t.histogramDesc },
        ]}
      />

      <H3 id="metrics-sig">{t.metricsSigTitle}</H3>
      <ParamTable
        rows={[
          { name: "counter", type: t.counterSig, desc: t.counterDesc },
          { name: "gauge", type: t.gaugeSig, desc: t.gaugeDesc },
          { name: "histogram", type: t.histogramSig, desc: t.histogramDesc },
        ]}
      />
      <P>
        {t.metricsLabels1pre} <Mono>labels</Mono> {t.metricsLabels1post}{" "}
        <Mono>instance_id</Mono>
        {t.metricsLabels1end}
      </P>

      <Callout type="info">{t.metricsCallout}</Callout>

      <H2 id="logs">{t.logsTitle}</H2>
      <P>
        {t.logsIntro1pre} <Mono>sb.telemetry.log</Mono> {t.logsIntro1mid}{" "}
        <Mono>sb.logger</Mono>
        {t.logsIntro1post}
      </P>
      <MultiCodeBlock
        code={{
          ts: `// Structured logs: second arg is any JSON-serializable object
sb.telemetry.log.info("charge ok", { orderId, amountCents });
sb.telemetry.log.error("charge failed", { orderId, err: String(err) });

// sb.logger is a shorthand for sb.telemetry.log
sb.logger.warn("retrying charge", { orderId, attempt: 2 });`,
        }}
      />

      <H3 id="logs-levels">{t.logsLevelsTitle}</H3>
      <P>{t.logsLevelsDesc}</P>
      <P>{t.logsFieldsDesc}</P>

      <Callout type="info">{t.logsCallout}</Callout>

      <H2 id="prometheus-export">{t.prometheusTitle}</H2>
      <P>{t.prometheusIntro}</P>
      <DocCodeBlock lang="yaml" code={t.prometheusScrapeCfg} />
      <ParamTable rows={t.prometheusSettings} />
      <Callout type="tip">{t.prometheusCallout}</Callout>

      <H2 id="loki-export">{t.lokiTitle}</H2>
      <P>{t.lokiIntro}</P>
      <P>{t.lokiLabels}</P>
      <P>{t.lokiAtLeastOnce}</P>
      <ParamTable rows={t.lokiSettings} />
    </div>
  );
}
