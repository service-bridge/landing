import {
  Callout,
  DocCodeBlock,
  H2,
  Mono,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Configuration",
    title: "Server Settings",
    description:
      "How you configure the ServiceBridge runtime. There is exactly one bootstrap value (the Postgres connection) and no environment variables at all. Every other knob is a row in the database that you edit live in the console under Settings.",

    introP:
      "The runtime is one Go binary plus PostgreSQL. It reads no environment variables and takes no config file. The Postgres DSN is baked into the binary to match the bundled database, and a single CLI flag overrides it. Everything else lives in the runtime_settings table and is editable in the web console at /settings on port 14444. Most changes apply live; a handful that touch listen sockets need a restart.",
    introCallout:
      "There are no SERVICEBRIDGE_*, SB_*, or POSTGRES_* environment variables, and no .env file. If you saw them anywhere, they no longer exist. The only input the runtime takes from outside the database is the -pg-url flag.",

    requiredTitle: "Bootstrap: the Postgres connection",
    requiredP:
      "The runtime cannot store the address of its own database inside that same database, so the DSN is the one value that comes from outside. It is baked into the binary as a default that points at the bundled Postgres. Override it with the -pg-url flag when you run your own database. PostgreSQL 18 or newer is required.",
    requiredFlagExample: `# default DSN baked into the binary — run as-is for the bundled Postgres
service-bridge

# point at your own database
service-bridge -pg-url "postgres://sb:secret@db.internal:5432/service-bridge?sslmode=require"`,
    requiredFlag: [
      {
        name: "-pg-url",
        type: "string",
        default: "(baked DSN)",
        desc: "PostgreSQL connection string. Overrides the baked default. Standard libpq URL: user, password, host, port, dbname, and query params such as sslmode and pool_max_conns.",
      },
    ],
    requiredNote:
      "The DSN carries everything Postgres needs, including TLS mode and pool sizing, as standard query parameters. There is no separate flag or setting for host, port, user, password, or pool size.",

    settingsNote:
      "The tables below are rows in runtime_settings, edited in the console under Settings, not environment variables. Each key has a value type and a default. Durations are integer milliseconds (suffix _ms); a few use seconds or days where that reads more naturally. Most keys apply the moment you save; the ones marked restart take effect only after you restart the runtime.",

    retentionTitle: "Retention",
    retentionP:
      "How long the runtime keeps observability and delivery history before a cleanup worker deletes it. Set a TTL to 0 to keep that store forever.",
    retention: [
      { name: "telemetry.ops_retention_ms", type: "int64 ms", default: "604800000", desc: "Keep operation (trace) rows this long. Default 7 days." },
      { name: "telemetry.logs_retention_ms", type: "int64 ms", default: "604800000", desc: "Keep captured logs this long. Default 7 days." },
      { name: "telemetry.metrics_retention_ms", type: "int64 ms", default: "86400000", desc: "Keep metrics samples this long. Default 1 day." },
      { name: "telemetry.payload_retention_days", type: "int", default: "3", desc: "Keep captured RPC and event payloads this many days." },
      { name: "events.dlq_retention_ms", type: "int64 ms", default: "2592000000", desc: "Keep dead-lettered deliveries this long. Default 30 days." },
      { name: "registry.gc_retention_days", type: "int", default: "30", desc: "Drop stale service-registry rows after this many days (1–36500)." },
    ],

    networkTitle: "Network & ports",
    networkP:
      "Where the runtime listens. The gRPC control plane carries SDK traffic over mTLS; the UI gateway serves the console and SSE over HTTP. Changing any of these rebinds a socket, so each one needs a restart.",
    network: [
      { name: "network.grpc_host", type: "string", default: "0.0.0.0", desc: "gRPC bind address. Leave 0.0.0.0 in Docker. Restart." },
      { name: "network.grpc_port", type: "int", default: "14445", desc: "gRPC control-plane port; the SDK connects here over mTLS. Restart." },
      { name: "network.ui_port", type: "int", default: "14444", desc: "UI gateway / HTTP port (console, SSE, health). Restart." },
    ],

    authTitle: "Auth & session",
    authP:
      "The admin console is separate from service keys. Console login uses a username and password stored in uigw_users; you create the first account through the Setup flow on first launch. The session cookie lifetime is the one tunable here.",
    authDev:
      "For local development the console account is admin / admin. In production you create the first account through the Setup flow, so there are no default credentials.",
    auth: [
      { name: "ui.session_ttl_ms", type: "int64 ms", default: "86400000", desc: "Console session cookie lifetime. Default 24 hours. Restart." },
    ],

    advancedTitle: "Advanced",
    advancedP:
      "Idempotency windows, delivery retry behavior, job quotas, payload-capture limits, the shutdown grace period, and pprof. The defaults suit most workloads; change them only with a measured reason.",
    advanced: [
      { name: "rpc.idempotency_rpc_ttl_ms", type: "int64 ms", default: "300000", desc: "How long a CallOpts.idempotencyKey replay returns the cached RPC response. Default 5 min." },
      { name: "rpc.idempotency_event_ttl_ms", type: "int64 ms", default: "86400000", desc: "Idempotency window for event delivery. Default 24 hours." },
      { name: "events.visibility_timeout_ms", type: "int64 ms", default: "30000", desc: "How long a claimed delivery is locked before another worker may retry it." },
      { name: "events.max_attempts", type: "int", default: "5", desc: "Delivery attempts before a message is dead-lettered (1–100)." },
      { name: "events.backoff_ladder_ms", type: "string", default: "1000,5000,30000,120000,600000", desc: "Comma-separated retry backoff steps in ms, one per attempt; the last value repeats." },
      { name: "jobs.max_per_service", type: "int", default: "100", desc: "Max registered jobs per service." },
      { name: "jobs.min_interval_ms", type: "int64 ms", default: "100", desc: "Smallest allowed interval-trigger period." },
      { name: "telemetry.payload_max_bytes", type: "int", default: "65536", desc: "Max captured payload size per op in bytes; larger payloads are truncated." },
      { name: "grpc.shutdown_timeout_ms", type: "int64 ms", default: "10000", desc: "Graceful-shutdown grace period. Restart." },
      { name: "debug.pprof_addr", type: "string", default: "(empty)", desc: 'pprof listen address, e.g. 127.0.0.1:6060. Empty disables pprof. Restart.' },
    ],

    endpointsTitle: "System endpoints",
    endpointsP1pre: "The runtime exposes a few operational HTTP endpoints on the UI port (default",
    endpointsP1end: "). They take no authentication, so a load balancer or orchestrator can poll them freely.",
    endpoints: [
      { name: "GET /healthz", type: "liveness", default: "", desc: "Returns 200 while the process is up." },
      { name: "GET /readyz", type: "readiness", default: "", desc: "200 when PostgreSQL is reachable, 503 otherwise." },
      { name: "GET /api/sse", type: "stream", default: "", desc: "Server-Sent Events feed that powers the live console (dashboard, service map)." },
    ],
    endpointsNote:
      "Metrics and logs arrive over the SDK control plane and the console renders them. When obsexport.prometheus.enable is on, the runtime also exposes a Prometheus scrape endpoint at :14446/metrics on a dedicated port.",

    obsexportTitle: "Observability export",
    obsexportP:
      "Optional push/pull channels to external monitoring stacks. All exporters are disabled by default and can be enabled live in the dashboard under /settings without a runtime restart (except network.obsexport_port, which rebinds a socket).",
    obsexport: [
      { name: "network.obsexport_port", type: "int", default: "14446", desc: "TCP port for the obsexport HTTP listener (:14446/metrics). Restart." },
      { name: "obsexport.prometheus.enable", type: "bool", default: "false", desc: "Enable Prometheus pull endpoint at :14446/metrics." },
      { name: "obsexport.metrics_bearer_token", type: "string", default: '""', desc: "Optional Bearer token protecting the /metrics scrape endpoint." },
      { name: "obsexport.metrics_window_ms", type: "int64 ms", default: "60000", desc: "Lookback window for latest metric sample per series. Default 60 s." },
      { name: "obsexport.metrics_series_cap", type: "int", default: "100000", desc: "Maximum series per scrape response." },
      { name: "obsexport.loki.enable", type: "bool", default: "false", desc: "Enable Loki push (logs). Requires obsexport.loki.endpoint." },
      { name: "obsexport.loki.endpoint", type: "string", default: '""', desc: "Loki push API URL (POST /loki/api/v1/push)." },
      { name: "obsexport.loki.bearer_token", type: "string", default: '""', desc: "Bearer token for Loki authentication." },
      { name: "obsexport.loki.instance_label_enabled", type: "bool", default: "false", desc: "Add instance stream label to Loki log entries." },
      { name: "obsexport.loki.push_interval_ms", type: "int64 ms", default: "10000", desc: "Loki push cycle interval. Default 10 s." },
      { name: "obsexport.loki.buffer_max_batches", type: "int", default: "1000", desc: "Max buffered batches; drop-oldest on overflow." },
      { name: "obsexport.otlp.enable", type: "bool", default: "false", desc: "Enable OTLP push (traces). Requires obsexport.otlp.endpoint." },
      { name: "obsexport.otlp.endpoint", type: "string", default: '""', desc: "OTel Collector / Tempo / Jaeger endpoint." },
      { name: "obsexport.otlp.protocol", type: "string", default: '"grpc"', desc: "grpc or http." },
      { name: "obsexport.otlp.push_interval_ms", type: "int64 ms", default: "10000", desc: "OTLP push cycle interval. Default 10 s." },
      { name: "obsexport.otlp.headers", type: "string", default: '""', desc: "Extra headers as key=value,key=value pairs." },
      { name: "obsexport.otlp.buffer_max_batches", type: "int", default: "1000", desc: "Max buffered batches; drop-oldest on overflow." },
    ],
  },
  ru: {
    badge: "Конфигурация",
    title: "Настройки сервера",
    description:
      "Как настраивается runtime ServiceBridge. Есть ровно одно bootstrap-значение (подключение к Postgres) и ни одной переменной окружения. Все остальные параметры — это строки в базе, которые вы правите вживую в консоли в разделе Settings.",

    introP:
      "Runtime — это один Go-бинарь плюс PostgreSQL. Он не читает переменные окружения и не берёт конфиг-файл. DSN Postgres вшит в бинарь и совпадает со встроенной базой, а перекрыть его можно одним CLI-флагом. Всё остальное лежит в таблице runtime_settings и редактируется в веб-консоли на /settings (порт 14444). Большинство изменений применяется вживую; те, что трогают слушающие сокеты, требуют рестарта.",
    introCallout:
      "Переменных окружения SERVICEBRIDGE_*, SB_* и POSTGRES_* нет, как и .env-файла. Если вы видели их где-то — их больше нет. Единственный вход рантайма извне базы — флаг -pg-url.",

    requiredTitle: "Bootstrap: подключение к Postgres",
    requiredP:
      "Runtime не может хранить адрес своей базы внутри этой же базы, поэтому DSN — единственное значение извне. Он вшит в бинарь как дефолт, указывающий на встроенный Postgres. Перекройте его флагом -pg-url, когда поднимаете собственную базу. Требуется PostgreSQL 18 или новее.",
    requiredFlagExample: `# дефолтный DSN вшит в бинарь — для встроенного Postgres запускайте как есть
service-bridge

# указать собственную базу
service-bridge -pg-url "postgres://sb:secret@db.internal:5432/service-bridge?sslmode=require"`,
    requiredFlag: [
      {
        name: "-pg-url",
        type: "string",
        default: "(вшитый DSN)",
        desc: "Строка подключения к PostgreSQL. Перекрывает вшитый дефолт. Стандартный libpq-URL: user, password, host, port, dbname и query-параметры вроде sslmode и pool_max_conns.",
      },
    ],
    requiredNote:
      "DSN несёт всё, что нужно Postgres, включая режим TLS и размер пула, как стандартные query-параметры. Отдельных флагов или настроек для host, port, user, password или размера пула нет.",

    settingsNote:
      "Таблицы ниже — это строки в runtime_settings, которые правят в консоли в разделе Settings, а не переменные окружения. У каждого ключа есть тип значения и дефолт. Длительности — целые миллисекунды (суффикс _ms); несколько ключей в секундах или днях там, где так читается естественнее. Большинство ключей применяется сразу при сохранении; помеченные «рестарт» вступают в силу только после перезапуска рантайма.",

    retentionTitle: "Хранение данных",
    retentionP:
      "Как долго runtime держит историю наблюдаемости и доставки до того, как воркер очистки её удалит. TTL равный 0 хранит данные вечно.",
    retention: [
      { name: "telemetry.ops_retention_ms", type: "int64 ms", default: "604800000", desc: "Хранить строки операций (трейсов) столько времени. По умолчанию 7 дней." },
      { name: "telemetry.logs_retention_ms", type: "int64 ms", default: "604800000", desc: "Хранить захваченные логи столько времени. По умолчанию 7 дней." },
      { name: "telemetry.metrics_retention_ms", type: "int64 ms", default: "86400000", desc: "Хранить сэмплы метрик столько времени. По умолчанию 1 день." },
      { name: "telemetry.payload_retention_days", type: "int", default: "3", desc: "Хранить захваченные payload RPC и событий столько дней." },
      { name: "events.dlq_retention_ms", type: "int64 ms", default: "2592000000", desc: "Хранить мёртвые доставки столько времени. По умолчанию 30 дней." },
      { name: "registry.gc_retention_days", type: "int", default: "30", desc: "Удалять устаревшие строки реестра сервисов через столько дней (1–36500)." },
    ],

    networkTitle: "Сеть и порты",
    networkP:
      "Где слушает runtime. Control plane gRPC несёт трафик SDK по mTLS; UI-шлюз отдаёт консоль и SSE по HTTP. Изменение любого из них перепривязывает сокет, поэтому каждый требует рестарта.",
    network: [
      { name: "network.grpc_host", type: "string", default: "0.0.0.0", desc: "Адрес привязки gRPC. В Docker оставляйте 0.0.0.0. Рестарт." },
      { name: "network.grpc_port", type: "int", default: "14445", desc: "Порт control plane gRPC; SDK подключается сюда по mTLS. Рестарт." },
      { name: "network.ui_port", type: "int", default: "14444", desc: "Порт UI-шлюза / HTTP (консоль, SSE, health). Рестарт." },
    ],

    authTitle: "Авторизация и сессии",
    authP:
      "Админ-консоль отделена от сервисных ключей. Вход в консоль — логин и пароль из таблицы uigw_users; первую учётку вы создаёте через Setup-флоу при первом запуске. Здесь настраивается только время жизни cookie-сессии.",
    authDev:
      "Для локальной разработки учётка консоли — admin / admin. В продакшене первую учётку создают через Setup-флоу, поэтому учётных данных по умолчанию нет.",
    auth: [
      { name: "ui.session_ttl_ms", type: "int64 ms", default: "86400000", desc: "Время жизни cookie-сессии консоли. По умолчанию 24 часа. Рестарт." },
    ],

    advancedTitle: "Дополнительные",
    advancedP:
      "Окна идемпотентности, поведение повторов доставки, квоты заданий, лимиты захвата payload, льготный период остановки и pprof. Дефолты подходят большинству нагрузок; меняйте их только с измеренным основанием.",
    advanced: [
      { name: "rpc.idempotency_rpc_ttl_ms", type: "int64 ms", default: "300000", desc: "Сколько повтор по CallOpts.idempotencyKey возвращает кешированный ответ RPC. По умолчанию 5 минут." },
      { name: "rpc.idempotency_event_ttl_ms", type: "int64 ms", default: "86400000", desc: "Окно идемпотентности для доставки событий. По умолчанию 24 часа." },
      { name: "events.visibility_timeout_ms", type: "int64 ms", default: "30000", desc: "Сколько взятая доставка заблокирована, прежде чем другой воркер сможет её повторить." },
      { name: "events.max_attempts", type: "int", default: "5", desc: "Попыток доставки до перемещения в DLQ (1–100)." },
      { name: "events.backoff_ladder_ms", type: "string", default: "1000,5000,30000,120000,600000", desc: "Шаги backoff повторов в мс через запятую, по одному на попытку; последнее значение повторяется." },
      { name: "jobs.max_per_service", type: "int", default: "100", desc: "Максимум зарегистрированных заданий на сервис." },
      { name: "jobs.min_interval_ms", type: "int64 ms", default: "100", desc: "Минимально допустимый период интервального триггера." },
      { name: "telemetry.payload_max_bytes", type: "int", default: "65536", desc: "Максимальный размер захваченного payload на операцию в байтах; большее обрезается." },
      { name: "grpc.shutdown_timeout_ms", type: "int64 ms", default: "10000", desc: "Льготный период мягкой остановки. Рестарт." },
      { name: "debug.pprof_addr", type: "string", default: "(пусто)", desc: "Адрес pprof, например 127.0.0.1:6060. Пусто — pprof выключен. Рестарт." },
    ],

    endpointsTitle: "Системные эндпоинты",
    endpointsP1pre: "Runtime отдаёт несколько операционных HTTP-эндпоинтов на UI-порту (по умолчанию",
    endpointsP1end: "). Аутентификация им не нужна, поэтому балансировщик или оркестратор может опрашивать их свободно.",
    endpoints: [
      { name: "GET /healthz", type: "liveness", default: "", desc: "Возвращает 200, пока процесс жив." },
      { name: "GET /readyz", type: "readiness", default: "", desc: "200 когда PostgreSQL доступен, иначе 503." },
      { name: "GET /api/sse", type: "stream", default: "", desc: "Поток Server-Sent Events для живой консоли (дашборд, карта сервисов)." },
    ],
    endpointsNote:
      "Метрики и логи приходят по control plane SDK, консоль их рисует. При включении obsexport.prometheus.enable рантайм также открывает Prometheus scrape-эндпоинт на :14446/metrics на отдельном порту.",

    obsexportTitle: "Экспорт observability",
    obsexportP:
      "Опциональные push/pull-каналы во внешние стеки мониторинга. Все экспортёры выключены по умолчанию и включаются вживую в дашборде на /settings без рестарта рантайма (кроме network.obsexport_port, который перепривязывает сокет).",
    obsexport: [
      { name: "network.obsexport_port", type: "int", default: "14446", desc: "TCP-порт HTTP-слушателя obsexport (:14446/metrics). Рестарт." },
      { name: "obsexport.prometheus.enable", type: "bool", default: "false", desc: "Включить Prometheus pull-эндпоинт на :14446/metrics." },
      { name: "obsexport.metrics_bearer_token", type: "string", default: '""', desc: "Опциональный Bearer-токен для защиты /metrics scrape." },
      { name: "obsexport.metrics_window_ms", type: "int64 ms", default: "60000", desc: "Окно последнего сэмпла на серию. По умолчанию 60 с." },
      { name: "obsexport.metrics_series_cap", type: "int", default: "100000", desc: "Максимум серий в одном scrape-ответе." },
      { name: "obsexport.loki.enable", type: "bool", default: "false", desc: "Включить Loki push (логи). Требует obsexport.loki.endpoint." },
      { name: "obsexport.loki.endpoint", type: "string", default: '""', desc: "URL Loki push API (POST /loki/api/v1/push)." },
      { name: "obsexport.loki.bearer_token", type: "string", default: '""', desc: "Bearer-токен для аутентификации в Loki." },
      { name: "obsexport.loki.instance_label_enabled", type: "bool", default: "false", desc: "Добавлять stream-метку instance в Loki-записи." },
      { name: "obsexport.loki.push_interval_ms", type: "int64 ms", default: "10000", desc: "Интервал push-цикла Loki. По умолчанию 10 с." },
      { name: "obsexport.loki.buffer_max_batches", type: "int", default: "1000", desc: "Максимум батчей в буфере; drop-oldest при переполнении." },
      { name: "obsexport.otlp.enable", type: "bool", default: "false", desc: "Включить OTLP push (трейсы). Требует obsexport.otlp.endpoint." },
      { name: "obsexport.otlp.endpoint", type: "string", default: '""', desc: "Endpoint OTel Collector / Tempo / Jaeger." },
      { name: "obsexport.otlp.protocol", type: "string", default: '"grpc"', desc: "grpc или http." },
      { name: "obsexport.otlp.push_interval_ms", type: "int64 ms", default: "10000", desc: "Интервал push-цикла OTLP. По умолчанию 10 с." },
      { name: "obsexport.otlp.headers", type: "string", default: '""', desc: "Дополнительные заголовки в формате key=value,key=value." },
      { name: "obsexport.otlp.buffer_max_batches", type: "int", default: "1000", desc: "Максимум батчей в буфере; drop-oldest при переполнении." },
    ],
  },
};

export function PageServerConfig() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <P>{t.introP}</P>
      <Callout type="warning">{t.introCallout}</Callout>

      <H2 id="required">{t.requiredTitle}</H2>
      <P>{t.requiredP}</P>
      <DocCodeBlock code={t.requiredFlagExample} lang="bash" />
      <ParamTable rows={t.requiredFlag} />
      <Callout type="info">{t.requiredNote}</Callout>

      <Callout type="info">{t.settingsNote}</Callout>

      <H2 id="retention">{t.retentionTitle}</H2>
      <P>{t.retentionP}</P>
      <ParamTable rows={t.retention} />

      <H2 id="network">{t.networkTitle}</H2>
      <P>{t.networkP}</P>
      <ParamTable rows={t.network} />

      <H2 id="auth">{t.authTitle}</H2>
      <P>{t.authP}</P>
      <ParamTable rows={t.auth} />
      <Callout type="tip">{t.authDev}</Callout>

      <H2 id="advanced">{t.advancedTitle}</H2>
      <P>{t.advancedP}</P>
      <ParamTable rows={t.advanced} />

      <H2 id="endpoints">{t.endpointsTitle}</H2>
      <P>
        {t.endpointsP1pre} <Mono>14444</Mono>
        {t.endpointsP1end}
      </P>
      <ParamTable rows={t.endpoints} />
      <Callout type="info">{t.endpointsNote}</Callout>

      <H2 id="obsexport">{t.obsexportTitle}</H2>
      <P>{t.obsexportP}</P>
      <ParamTable rows={t.obsexport} />
    </div>
  );
}
