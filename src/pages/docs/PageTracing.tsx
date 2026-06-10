import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Observability",
    title: "Distributed Tracing",
    description:
      "Every RPC call, event publish, event delivery, job run, workflow step, and HTTP request becomes an operation in a trace, automatically, over the existing gRPC connection. No OTEL collector, no Jaeger, no sidecar.",
    calloutTip1bold: "Zero-config tracing.",
    calloutTip1:
      "The SDK emits telemetry by default; pass telemetry: false to the ServiceBridge constructor to switch it off. Each built-in domain (RPC, HTTP, events, workflows, jobs) emits its own operations, the runtime stores them in PostgreSQL, and the dashboard renders them. Nothing to install, nothing to wire up.",

    autoTitle: "Automatic traces",
    autoDesc:
      "You write no tracing code. Every built-in domain emits operations on its own: a caller's RPC call, a handler run, an event publish and each delivery, a job tick, a workflow run and each step, an incoming HTTP request. Operations that belong to the same logical flow share one trace id, so caller and handler, publisher and consumers, workflow root and steps all line up in a single trace.",
    autoNote:
      "From your code you only add logs and metrics on top (see Metrics & Logs). The operations themselves come for free.",

    spanTableTitle: "Span types",
    spanTableHeader: ["channel", "kind", "Emitted by"],
    spanRows: [
      ["RPC", "call", "Caller on sb.rpc.call(); the handler run is also recorded"],
      ["EVENT", "publish / deliver", "Publisher on sb.event.publish(); one deliver op per consumer"],
      ["WORKFLOW", "run / sleep / wait_event / wait_signal", "Workflow run and each step the runtime dispatches"],
      ["JOB", "exec", "Scheduler on each job execution (cron / delayed / interval)"],
      ["HTTP", "handle", "Express / Fastify / Hono integration, one op per incoming request"],
      ["USER", "subop", "Your own sub-operations via sb.telemetry.startOp()"],
    ] as [string, string, string][],
    spanTableNote:
      "Each operation carries channel + kind, a human-readable subject (e.g. rpc.call:billing-service/charge, http.handle:GET//api/v1/users, event.publish:order.created), the actor instance, the peer service, an optional businessKey, and a status.",

    inlineLogsTitle: "Inline logs",
    inlineLogsDesc:
      "Logs and metrics you emit through sb.telemetry inside a handler are correlated to the active operation automatically. Trace context propagates through ALS (AsyncLocalStorage), so any log written while a handler runs is stitched to that handler's operation and its trace. In the dashboard you expand an operation to read its logs inline: no separate log query, no tab switching.",
    inlineLogsNote:
      "Each log line is auto-tagged with the current instance_id and the active trace / op id. sb.logger is a short alias for sb.telemetry.log.",

    traceIdHeaderTitle: "X-SB-Trace header",
    traceIdHeaderDesc1pre: "Trace context travels across services on a single wire header,",
    traceIdHeaderDesc1end:
      ". Its value is two RFC 9562 UUID strings joined by a dash:",
    traceIdHeaderItems: [
      ["The HTTP integrations (Express / Fastify / Hono) read incoming", "and continue the parent trace; on a missing or malformed value they mint a fresh root."],
      ["The RPC server reads the same header field on each incoming call, so a nested", "inherits the caller's trace."],
      ["Outgoing", ",", "and", "propagate the active context automatically; you never set the header by hand."],
    ],
    traceIdHeaderFormatNote:
      "Position 36 is the separator (a UUID itself contains dashes). A malformed header is never an error; the SDK just starts a new root trace.",

    traceContextTitle: "Trace context",
    traceContextDesc1pre:
      "Propagation is fully automatic through ALS (AsyncLocalStorage); you never read, build, or pass a trace context by hand. Inside any handler, a nested",
    traceContextDesc1mid: ",",
    traceContextDesc1end:
      "or",
    traceContextDesc1end2:
      "inherits the active trace, so caller and callee land in the same trace with no wiring. To attach your own sub-operations to that trace, see",
    traceContextDesc1link: "Manual Spans",
    traceContextDesc1end3: ".",

    grafanaTitle: "Grafana / Loki integration",
    grafanaDesc:
      "Logs are captured in a Loki-compatible structured shape — service, level, trace_id, and your structured fields. When obsexport.loki.enable is on, the runtime pushes log batches to your existing Loki instance (POST /loki/api/v1/push). ServiceBridge does not run its own Loki server; it pushes to one you already operate. In Grafana, you can correlate log lines with traces because trace_id and op_id travel as Loki structured metadata.",
    grafanaLabelsTitle: "Log labels",
    grafanaLabelsNote:
      "Stream labels on every pushed log: service, level, source. Optionally: instance (obsexport.loki.instance_label_enabled). trace_id and op_id are structured metadata. Your structured fields (the second argument to sb.telemetry.log.*) are stored in the log body as JSON.",

    otlpTitle: "OTLP export",
    otlpDesc:
      "When obsexport.otlp.enable is on, the runtime pushes completed traces to your own OTel Collector, Tempo, or Jaeger as OTLP spans. Only finished operations are exported — in-flight operations appear after they complete. The runtime does not expose an OTLP ingest endpoint; it is the source, not a collector.",
    otlpMappingTitle: "ID mapping",
    otlpMappingNote:
      "Internally, trace_id is a 16-byte UUIDv7 and maps directly to the OTLP traceId wire field. op_id is a 16-byte UUID; the 8-byte OTLP spanId is derived by XOR-folding both halves of the UUID (op_id[i] XOR op_id[i+8]). This avoids the high-timestamp collision risk of a simple first-8-bytes truncation.",
    otlpSettings: [
      { name: "obsexport.otlp.enable", type: "bool", default: "false", desc: "Enable OTLP push. Requires obsexport.otlp.endpoint." },
      { name: "obsexport.otlp.endpoint", type: "string", default: '""', desc: "gRPC or HTTP OTel endpoint, e.g. http://otelcol:4317." },
      { name: "obsexport.otlp.protocol", type: "string", default: '"grpc"', desc: "grpc or http." },
      { name: "obsexport.otlp.push_interval_ms", type: "int64 ms", default: "10000", desc: "Push cycle interval. Default 10 s." },
      { name: "obsexport.otlp.headers", type: "string", default: '""', desc: "Extra headers as key=value,key=value pairs (for auth, tenant headers, etc.)." },
      { name: "obsexport.otlp.buffer_max_batches", type: "int", default: "1000", desc: "Max queued batches; drop-oldest on overflow." },
    ],
    calloutInfo2:
      "Trace and operation retention lives in the dashboard at /settings under telemetry.*, stored as DB-backed runtime settings, not environment variables. The one value the runtime reads outside the database is the PostgreSQL connection string, baked into the binary and overridable with the -pg-url flag.",
  },
  ru: {
    badge: "Наблюдаемость",
    title: "Распределённая трассировка",
    description:
      "Каждый RPC-вызов, публикация события, доставка события, запуск задачи, шаг воркфлоу и HTTP-запрос становятся операцией в трейсе — автоматически, поверх уже открытого gRPC-соединения. Без OTEL-коллектора, Jaeger и сайдкаров.",
    calloutTip1bold: "Трассировка без настройки.",
    calloutTip1:
      "SDK эмитит телеметрию по умолчанию; чтобы выключить, передайте telemetry: false в конструктор ServiceBridge. Каждый встроенный домен (RPC, HTTP, события, воркфлоу, задачи) сам эмитит свои операции, runtime хранит их в PostgreSQL, а дашборд их рисует. Ничего устанавливать и связывать не нужно.",

    autoTitle: "Автоматические трейсы",
    autoDesc:
      "Вы не пишете код трассировки. Каждый встроенный домен сам эмитит операции: RPC-вызов вызывающего, запуск обработчика, публикацию события и каждую доставку, тик задачи, запуск воркфлоу и каждый шаг, входящий HTTP-запрос. Операции одного логического потока разделяют один trace id, поэтому вызывающий и обработчик, издатель и потребители, корень воркфлоу и шаги выстраиваются в один трейс.",
    autoNote:
      "Из своего кода вы добавляете поверх только логи и метрики (см. Метрики и логи). Сами операции достаются бесплатно.",

    spanTableTitle: "Типы спанов",
    spanTableHeader: ["channel", "kind", "Кто эмитит"],
    spanRows: [
      ["RPC", "call", "Вызывающий на sb.rpc.call(); запуск обработчика тоже фиксируется"],
      ["EVENT", "publish / deliver", "Издатель на sb.event.publish(); одна deliver-операция на потребителя"],
      ["WORKFLOW", "run / sleep / wait_event / wait_signal", "Запуск воркфлоу и каждый шаг, который диспетчеризует runtime"],
      ["JOB", "exec", "Планировщик на каждом запуске задачи (cron / delayed / interval)"],
      ["HTTP", "handle", "Интеграция Express / Fastify / Hono, одна операция на входящий запрос"],
      ["USER", "subop", "Ваши собственные под-операции через sb.telemetry.startOp()"],
    ] as [string, string, string][],
    spanTableNote:
      "Каждая операция несёт channel + kind, человекочитаемый subject (например rpc.call:billing-service/charge, http.handle:GET//api/v1/users, event.publish:order.created), инстанс-исполнитель, контрагента-сервис, опциональный businessKey и статус.",

    inlineLogsTitle: "Встроенные логи",
    inlineLogsDesc:
      "Логи и метрики, которые вы эмитите через sb.telemetry внутри обработчика, автоматически связываются с активной операцией. Контекст трейса распространяется через ALS (AsyncLocalStorage), поэтому любой лог, записанный во время работы обработчика, пришивается к операции этого обработчика и его трейсу. В дашборде вы разворачиваете операцию и читаете её логи прямо в ней — без отдельного поиска по логам, без переключения вкладок.",
    inlineLogsNote:
      "Каждая строка лога авто-тегируется текущим instance_id и активным trace / op id. sb.logger — короткий алиас sb.telemetry.log.",

    traceIdHeaderTitle: "Заголовок X-SB-Trace",
    traceIdHeaderDesc1pre: "Контекст трейса передаётся между сервисами в одном wire-заголовке —",
    traceIdHeaderDesc1end:
      ". Его значение — две UUID-строки (RFC 9562), соединённые дефисом:",
    traceIdHeaderItems: [
      ["HTTP-интеграции (Express / Fastify / Hono) читают входящий", "и продолжают родительский трейс; при отсутствии или невалидном значении минтят свежий root."],
      ["RPC-сервер читает то же поле заголовка на каждом входящем вызове, поэтому вложенный", "наследует трейс вызывающего."],
      ["Исходящие", ",", "и", "распространяют активный контекст автоматически — заголовок руками вы не ставите."],
    ],
    traceIdHeaderFormatNote:
      "Разделитель — позиция 36 (UUID сам содержит дефисы). Невалидный заголовок никогда не ошибка — SDK просто начинает новый root-трейс.",

    traceContextTitle: "Контекст трейса",
    traceContextDesc1pre:
      "Распространение полностью автоматическое через ALS (AsyncLocalStorage) — вы никогда не читаете, не собираете и не передаёте контекст трейса руками. Внутри любого обработчика вложенный",
    traceContextDesc1mid: ",",
    traceContextDesc1end:
      "или",
    traceContextDesc1end2:
      "наследует активный трейс, поэтому вызывающий и вызываемый попадают в один трейс без всякой проводки. Чтобы привязать к этому трейсу собственные под-операции — см.",
    traceContextDesc1link: "Ручные спаны",
    traceContextDesc1end3: ".",

    grafanaTitle: "Интеграция Grafana / Loki",
    grafanaDesc:
      "Логи захватываются в Loki-совместимой структурной форме — service, level, trace_id и ваши структурные поля. При включении obsexport.loki.enable рантайм пушит батчи логов в ваш существующий Loki (POST /loki/api/v1/push). ServiceBridge не поднимает собственный Loki-сервер — он пушит в тот, который уже есть у вас. В Grafana можно сопоставлять строки логов с трейсами, так как trace_id и op_id передаются как Loki structured metadata.",
    grafanaLabelsTitle: "Метки логов",
    grafanaLabelsNote:
      "Stream-метки на каждом пуше: service, level, source. Опционально: instance (obsexport.loki.instance_label_enabled). trace_id и op_id — structured metadata. Ваши структурные поля (второй аргумент sb.telemetry.log.*) хранятся в теле лога как JSON.",

    otlpTitle: "Экспорт OTLP",
    otlpDesc:
      "При включении obsexport.otlp.enable рантайм пушит завершённые трейсы в ваш OTel Collector, Tempo или Jaeger как OTLP-спаны. Экспортируются только завершённые операции — операции в процессе выполнения появляются после завершения. Эндпоинта для приёма OTLP рантайм не открывает — он является источником, а не коллектором.",
    otlpMappingTitle: "Маппинг идентификаторов",
    otlpMappingNote:
      "Внутри trace_id — 16-байтовый UUIDv7, напрямую маппируется в OTLP traceId. op_id — 16-байтовый UUID; 8-байтовый OTLP spanId получается XOR-сверткой обеих половин UUID (op_id[i] XOR op_id[i+8]). Это исключает риск коллизий при высокой пропускной способности, присущий простому усечению до первых 8 байт.",
    otlpSettings: [
      { name: "obsexport.otlp.enable", type: "bool", default: "false", desc: "Включить OTLP push. Требует obsexport.otlp.endpoint." },
      { name: "obsexport.otlp.endpoint", type: "string", default: '""', desc: "gRPC или HTTP OTel endpoint, например http://otelcol:4317." },
      { name: "obsexport.otlp.protocol", type: "string", default: '"grpc"', desc: "grpc или http." },
      { name: "obsexport.otlp.push_interval_ms", type: "int64 ms", default: "10000", desc: "Интервал push-цикла. По умолчанию 10 с." },
      { name: "obsexport.otlp.headers", type: "string", default: '""', desc: "Дополнительные заголовки в формате key=value,key=value (для auth, tenant-заголовков и т.п.)." },
      { name: "obsexport.otlp.buffer_max_batches", type: "int", default: "1000", desc: "Максимум батчей в очереди; drop-oldest при переполнении." },
    ],
    calloutInfo2:
      "Хранение трейсов и операций настраивается в дашборде на /settings, ключи telemetry.*. Это DB-backed настройки runtime, а не переменные окружения. Единственное значение, которое runtime читает вне базы, — строка подключения к PostgreSQL: она вшита в бинарь и переопределяется флагом -pg-url.",
  },
};

export function PageTracing() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <Callout type="tip">
        <strong>{t.calloutTip1bold}</strong> {t.calloutTip1}
      </Callout>

      {/* Automatic traces */}
      <H2 id="auto-tracing">{t.autoTitle}</H2>
      <P>{t.autoDesc}</P>
      <P>{t.autoNote}</P>

      {/* Span types */}
      <H2 id="span-table">{t.spanTableTitle}</H2>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">{t.spanTableHeader[0]}</th>
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">{t.spanTableHeader[1]}</th>
              <th className="text-left py-2 font-medium text-muted-foreground">{t.spanTableHeader[2]}</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {t.spanRows.map(([channel, kind, by]) => (
              <tr key={channel} className="border-b border-border/50">
                <td className="py-2 pr-6 font-mono text-foreground text-xs">{channel}</td>
                <td className="py-2 pr-6 font-mono text-xs">{kind}</td>
                <td className="py-2">{by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>{t.spanTableNote}</P>

      {/* Inline logs */}
      <H2 id="inline-logs">{t.inlineLogsTitle}</H2>
      <P>{t.inlineLogsDesc}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.rpc.handle("charge", async (payload) => {
  // These run inside the handler's trace via ALS, so both lines
  // are correlated to this RPC operation automatically:
  sb.telemetry.log.info("charge.start", { orderId: payload.orderId });
  const tx = await stripe.charge(payload);
  sb.telemetry.log.info("charge.done", { txId: tx.id });
  // → expand this operation in the dashboard to read both inline
  return { txId: tx.id };
}, { schema: { protoFile: "./payments.proto" } });`,
        }}
      />
      <P>{t.inlineLogsNote}</P>

      {/* X-SB-Trace header */}
      <H2 id="trace-id-header">{t.traceIdHeaderTitle}</H2>
      <P>
        {t.traceIdHeaderDesc1pre} <Mono>X-SB-Trace</Mono>{t.traceIdHeaderDesc1end}
      </P>
      <DocCodeBlock lang="bash" code={`X-SB-Trace: <traceId>-<parentOpId>
# both are RFC 9562 UUID strings, e.g.
X-SB-Trace: 0190f3c1-7a2b-7c3d-8e4f-1a2b3c4d5e6f-0190f3c1-7a2b-7c3d-8e4f-aaaaaaaaaaaa`} />
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          {t.traceIdHeaderItems[0][0]} <Mono>X-SB-Trace</Mono> {t.traceIdHeaderItems[0][1]}
        </li>
        <li>
          {t.traceIdHeaderItems[1][0]} <Mono>sb.rpc.call()</Mono> {t.traceIdHeaderItems[1][1]}
        </li>
        <li>
          {t.traceIdHeaderItems[2][0]} <Mono>sb.rpc.call()</Mono>{t.traceIdHeaderItems[2][1]}{" "}
          <Mono>sb.event.publish()</Mono> {t.traceIdHeaderItems[2][2]}{" "}
          <Mono>sb.workflow.start()</Mono> {t.traceIdHeaderItems[2][3]}
        </li>
      </ul>
      <Callout type="info">{t.traceIdHeaderFormatNote}</Callout>

      {/* Trace context */}
      <H2 id="trace-context">{t.traceContextTitle}</H2>
      <P>
        {t.traceContextDesc1pre} <Mono>sb.rpc.call()</Mono>{t.traceContextDesc1mid}{" "}
        <Mono>sb.event.publish()</Mono> {t.traceContextDesc1end}{" "}
        <Mono>sb.workflow.start()</Mono> {t.traceContextDesc1end2}{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("sb-nav", { detail: "manual-spans" }))
          }
        >
          {t.traceContextDesc1link}
        </button>
        {t.traceContextDesc1end3}
      </P>
      <MultiCodeBlock
        code={{
          ts: `sb.rpc.handle("checkout", async (payload) => {
  // This nested call runs inside the handler's trace via ALS. You
  // pass no context, set no header. Caller, this handler, and the
  // downstream charge all share one trace id automatically:
  const tx = await sb.rpc.call("payments", "charge", { orderId: payload.orderId });

  // Same for a publish: the event carries the active trace to every consumer.
  await sb.event.publish("order.paid", { orderId: payload.orderId, txId: tx.txId });

  return { txId: tx.txId };
}, { schema: { protoFile: "./checkout.proto" } });`,
        }}
      />

      {/* Grafana / Loki */}
      <H2 id="grafana">{t.grafanaTitle}</H2>
      <P>{t.grafanaDesc}</P>
      <H3 id="log-labels">{t.grafanaLabelsTitle}</H3>
      <P>{t.grafanaLabelsNote}</P>

      {/* OTLP export */}
      <H2 id="otlp">{t.otlpTitle}</H2>
      <P>{t.otlpDesc}</P>
      <H3 id="otlp-id-mapping">{t.otlpMappingTitle}</H3>
      <P>{t.otlpMappingNote}</P>
      <ParamTable rows={t.otlpSettings} />
      <Callout type="info">{t.calloutInfo2}</Callout>
    </div>
  );
}
