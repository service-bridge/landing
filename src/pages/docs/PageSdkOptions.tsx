import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
	Callout,
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
		title: "SDK Options",
		description:
			"Everything the client constructor accepts. The defaults fit most workers, so override only what you need. Neither SDK reads environment variables; every knob is passed where you build the client.",
		constructorTitle: "Constructor",
		constructorP1pre: "The SDK has one entry point:",
		constructorP1mid: "in Node, sb.New in Go. You give it the runtime address, a bootstrap service key, and options — an optional",
		constructorP1end: "object in Node, functional options in Go.",
		constructorP2pre: "The",
		constructorP2mid: "is a gRPC control-plane address, usually",
		constructorP2end: ". The key is your bootstrap service key; on",
		constructorP2tail:
			"the SDK exchanges it for a short-lived mTLS leaf certificate. Nothing connects until you call",
		allOptionsTitle: "Node options",
		allOptionsP:
			"Every field is optional. Pass them as the third argument to the constructor.",
		rows: {
			reconnectInterval:
				"Delay between reconnect attempts after the control stream drops.",
			reconnectAttempts:
				"Max reconnect attempts before the SDK emits disconnected and stops. 0 means retry forever.",
			advertise:
				'Inbound Call-RPC server address. { host, port } binds an explicit endpoint (port 0 lets the OS pick). undefined falls back to 127.0.0.1, which only peers on the same host can reach. false makes the worker caller-only, with no inbound server.',
			callDefaults:
				'Default CallOpts merged into every sb.rpc.call() and sb.stream(). A per-call argument overrides it. Handy for a shared timeout, e.g. { timeout: "10s" }.',
			failOnPolicyViolation:
				'When true, any policy warning in the registry snapshot makes start() emit disconnected (reason="policy") and stop. When false (default) violations are logged and surfaced as policy_violation events only.',
			telemetry:
				"Set to false to switch off the telemetry transport entirely. Ops, logs, and metrics stop leaving the process.",
			telemetryRingSize:
				"Byte budget for the in-memory telemetry ops ring buffer. Older ops drop once the budget fills before the next flush.",
			dataDir:
				"Directory for the local SQLite outbox that backs durable event publishing.",
			maxOutboxRows:
				"Cap on rows in the local event outbox. Publishing past the cap throws OutboxFullError instead of growing unbounded.",
			eventsDrainerBatch:
				"How many outbox rows the drainer reads per iteration when pushing buffered events to the runtime.",
			eventsMaxInFlight:
				"Max concurrent event deliveries to the subscriber. Controls back-pressure on incoming events.",
			payloadMaxBytes:
				"Largest payload, in bytes, captured for telemetry. Bigger payloads are truncated so capture stays bounded.",
		},
		goOptionsTitle: "Go options",
		goOptionsP:
			"Every knob is a functional option on sb.New. A wrong bound is reported there, with CodeConfig, before any I/O — a misconfigured limit must never look like a network condition.",
		goRows: {
			advertise:
				"The address peers dial for direct RPC. Port 0 asks the OS for a free one and announces what it hands back. Pass a real address in a container: the default is announced as-is.",
			callerOnly:
				"Outbound-only instance: no inbound listener, and registering a handler is refused. Contradicts WithAdvertise.",
			callDefaults: "CallOptions applied under every call that does not override them.",
			callAttempts:
				"Total tries of one logical call, counting the first: three means one call and two retries.",
			failOnPolicy:
				"Stop the client when the runtime reports a policy violation instead of only surfacing it.",
			dataDir: "Directory holding the local outbox database.",
			maxOutboxRows:
				"Cap of the local event buffer; past it a publish returns CodeOutboxFull. 0 lifts the cap — an uncapped buffer turns a long outage into a full disk.",
			drainBatchSize: "Buffered events one drain iteration claims.",
			maxInFlightEvents:
				"Concurrently processed inbound deliveries. At the cap the delivery stream stops being read, which is what the runtime feels as backpressure.",
			inboundLimits:
				"Handlers running at once across every connection, and HTTP/2 streams per connection. Past the first bound a caller gets ResourceExhausted — load is shed, not queued.",
			reconnectAttempts:
				"Cap on consecutive reconnect attempts. A service that gives up mid rolling restart is a service that needs a human.",
			reconnectLadder:
				"Reconnect delays. The last rung repeats forever and every rung is jittered.",
			logger: "Where the SDK writes its own diagnostics.",
		},
		advertiseCallout:
			"The loopback default (127.0.0.1) is unreachable from other hosts. In containers or Kubernetes pass an explicit advertise host, usually the pod IP — advertise: { host: process.env.POD_IP } in Node, sb.WithAdvertise(os.Getenv(\"POD_IP\"), 0) in Go — so peers can reach your inbound Call server.",
		callDefaultsCallout:
			"Call defaults only seed RPC calls and streams. They leave event, workflow, and job behavior untouched; those carry their own options at the call site.",
	},
	ru: {
		badge: "Конфигурация",
		title: "Опции SDK",
		description:
			"Всё, что принимает конструктор клиента. Значения по умолчанию подходят большинству воркеров, переопределяйте только нужное. Ни один SDK не читает переменные окружения — каждая настройка передаётся там, где вы создаёте клиент.",
		constructorTitle: "Конструктор",
		constructorP1pre: "У SDK одна точка входа:",
		constructorP1mid: "в Node, sb.New в Go. Ей передают адрес рантайма, bootstrap service key и опции — необязательный объект",
		constructorP1end: "в Node, функциональные опции в Go.",
		constructorP2pre: "Параметр",
		constructorP2mid: "— адрес gRPC control plane, обычно",
		constructorP2end: ". Ключ — это bootstrap service key; при",
		constructorP2tail:
			"SDK обменивает его на короткоживущий mTLS leaf-сертификат. Соединение не открывается, пока вы не вызовете",
		allOptionsTitle: "Опции Node",
		allOptionsP:
			"Все поля необязательны. Передаются третьим аргументом конструктора.",
		rows: {
			reconnectInterval:
				"Задержка между попытками переподключения после обрыва control-стрима.",
			reconnectAttempts:
				"Максимум попыток переподключения, после чего SDK эмитит disconnected и останавливается. 0 — переподключаться бесконечно.",
			advertise:
				'Адрес входящего Call-RPC сервера. { host, port } — явный endpoint (port 0 — порт выберет ОС). undefined — фолбэк на 127.0.0.1, доступный только пирам на том же хосте. false — режим только-вызывающего: входящий сервер не поднимается.',
			callDefaults:
				'Дефолтные CallOpts, подмешиваемые в каждый sb.rpc.call() и sb.stream(). Аргумент конкретного вызова их перебивает. Удобно для общего таймаута, например { timeout: "10s" }.',
			failOnPolicyViolation:
				'При true любой policy-warning в снепшоте реестра роняет start() через disconnected (reason="policy") и останавливает SDK. При false (по умолчанию) нарушения только логируются и приходят как события policy_violation.',
			telemetry:
				"false полностью выключает transport телеметрии. Операции, логи и метрики перестают покидать процесс.",
			telemetryRingSize:
				"Байтовый бюджет ring-буфера ops-телеметрии в памяти. Когда бюджет заполнен до следующего флаша, старые операции отбрасываются.",
			dataDir:
				"Каталог локального SQLite-outbox, на котором держится durable-публикация событий.",
			maxOutboxRows:
				"Лимит строк в локальном outbox событий. Публикация сверх лимита кидает OutboxFullError, а не растёт бесконечно.",
			eventsDrainerBatch:
				"Сколько строк outbox дренер читает за итерацию, проталкивая накопленные события в runtime.",
			eventsMaxInFlight:
				"Максимум одновременных доставок событий подписчику. Управляет back-pressure на входящих событиях.",
			payloadMaxBytes:
				"Наибольший payload в байтах, захватываемый для телеметрии. Большее обрезается, чтобы захват оставался ограниченным.",
		},
		goOptionsTitle: "Опции Go",
		goOptionsP:
			"Каждая настройка — функциональная опция sb.New. Неверная граница сообщается прямо там, с CodeConfig, до любого I/O: неправильно настроенный лимит не должен выглядеть как проблема сети.",
		goRows: {
			advertise:
				"Адрес, по которому пиры звонят для прямого RPC. Порт 0 просит свободный порт у ОС и анонсирует то, что она выдала. В контейнере передавайте реальный адрес: значение по умолчанию анонсируется как есть.",
			callerOnly:
				"Инстанс только для исходящих: входящий слушатель не поднимается, регистрация обработчика отвергается. Противоречит WithAdvertise.",
			callDefaults:
				"CallOption-ы, применяемые под каждым вызовом, который их не переопределил.",
			callAttempts:
				"Всего попыток одного логического вызова, включая первую: три — это вызов и два повтора.",
			failOnPolicy:
				"Останавливать клиент, когда рантайм сообщает о нарушении политики, а не только показывать его.",
			dataDir: "Каталог с базой локального outbox.",
			maxOutboxRows:
				"Лимит локального буфера событий; сверх него публикация возвращает CodeOutboxFull. 0 снимает лимит — неограниченный буфер превращает долгий простой в переполненный диск.",
			drainBatchSize: "Сколько накопленных событий забирает одна итерация слива.",
			maxInFlightEvents:
				"Одновременно обрабатываемые входящие доставки. На пределе стрим доставок перестаёт читаться — это и есть backpressure с точки зрения рантайма.",
			inboundLimits:
				"Сколько обработчиков выполняется одновременно по всем соединениям и сколько HTTP/2-стримов на соединение. За первой границей вызывающий получает ResourceExhausted — нагрузка сбрасывается, а не копится в очереди.",
			reconnectAttempts:
				"Лимит подряд идущих попыток переподключения. Сервис, сдавшийся посреди rolling restart, — это сервис, которому нужен человек.",
			reconnectLadder:
				"Задержки переподключения. Последняя ступень повторяется вечно, каждая идёт с джиттером.",
			logger: "Куда SDK пишет собственную диагностику.",
		},
		advertiseCallout:
			"Значение по умолчанию 127.0.0.1 недоступно с других хостов. В контейнерах и Kubernetes передайте явный advertise-host, обычно IP пода — advertise: { host: process.env.POD_IP } в Node, sb.WithAdvertise(os.Getenv(\"POD_IP\"), 0) в Go — чтобы пиры дотянулись до вашего входящего Call-сервера.",
		callDefaultsCallout:
			"Дефолты вызова задают значения только для RPC-вызовов и стримов. События, воркфлоу и задания они не трогают — у них свои опции на месте вызова.",
	},
};

export function PageSdkOptions() {
	const { locale } = useDocLocale();
	const t = T[locale];

	return (
		<div className="space-y-5">
			<PageHeader badge={t.badge} title={t.title} description={t.description} />

			<H2 id="constructor">{t.constructorTitle}</H2>
			<P>
				{t.constructorP1pre} <Mono>ServiceBridge</Mono> {t.constructorP1mid}{" "}
				<Mono>ServiceBridgeOptions</Mono>
				{t.constructorP1end}
			</P>
			<MultiCodeBlock
				code={{
					ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge(
  "localhost:14445",   // gRPC control plane address
  serviceKey,          // bootstrap service key
  {
    reconnectIntervalMs: 3_000,
    reconnectAttempts: 3,            // 0 = unlimited
    advertise: { host: "10.0.0.7", port: 0 },
    callDefaults: { timeout: "10s" },
    failOnPolicyViolation: false,
  },
);

await sb.start();
// ... register handlers, make calls ...
await sb.stop();`,
					go: `c, err := sb.New(
	"localhost:14445", // gRPC control plane address
	serviceKey,        // bootstrap service key
	sb.WithAdvertise("10.0.0.7", 0),
	sb.WithCallDefaults(sb.WithTimeout(10*time.Second)),
	sb.WithCallAttempts(3),
	sb.WithReconnectLadder(time.Second, 5*time.Second, 15*time.Second),
)
if err != nil {
	log.Fatal(err)
}

if err := c.Start(ctx); err != nil {
	log.Fatal(err)
}
// ... register handlers, make calls ...
if err := c.Stop(ctx); err != nil {
	log.Fatal(err)
}`,
				}}
			/>
			<P>
				{t.constructorP2pre} <Mono>url</Mono> {t.constructorP2mid}{" "}
				<Mono>"localhost:14445"</Mono>
				{t.constructorP2end} <Mono>start()</Mono> {t.constructorP2tail}{" "}
				<Mono>sb.start()</Mono>.
			</P>

			<H2 id="options-table">{t.allOptionsTitle}</H2>
			<P>{t.allOptionsP}</P>
			<ParamTable
				rows={[
					{
						name: "reconnectIntervalMs",
						type: "number (ms)",
						default: "3000",
						desc: t.rows.reconnectInterval,
					},
					{
						name: "reconnectAttempts",
						type: "number",
						default: "3",
						desc: t.rows.reconnectAttempts,
					},
					{
						name: "advertise",
						type: "{ host: string; port: number } | false",
						default: "undefined",
						desc: t.rows.advertise,
					},
					{
						name: "callDefaults",
						type: "CallOpts",
						default: "{}",
						desc: t.rows.callDefaults,
					},
					{
						name: "failOnPolicyViolation",
						type: "boolean",
						default: "false",
						desc: t.rows.failOnPolicyViolation,
					},
					{
						name: "telemetry",
						type: "boolean",
						default: "true",
						desc: t.rows.telemetry,
					},
					{
						name: "telemetryRingSize",
						type: "number (bytes)",
						default: "262144",
						desc: t.rows.telemetryRingSize,
					},
					{
						name: "dataDir",
						type: "string",
						default: '"./.servicebridge"',
						desc: t.rows.dataDir,
					},
					{
						name: "maxOutboxRows",
						type: "number",
						default: "100000",
						desc: t.rows.maxOutboxRows,
					},
					{
						name: "eventsDrainerBatch",
						type: "number",
						default: "50",
						desc: t.rows.eventsDrainerBatch,
					},
					{
						name: "eventsMaxInFlight",
						type: "number",
						default: "32",
						desc: t.rows.eventsMaxInFlight,
					},
					{
						name: "payloadMaxBytes",
						type: "number (bytes)",
						default: "65536",
						desc: t.rows.payloadMaxBytes,
					},
				]}
			/>

			<H2 id="go-options">{t.goOptionsTitle}</H2>
			<P>{t.goOptionsP}</P>
			<ParamTable
				rows={[
					{ name: "WithAdvertise(host, port)", type: "string, int", default: '"127.0.0.1", 0', desc: t.goRows.advertise },
					{ name: "WithCallerOnly()", type: "—", default: "off", desc: t.goRows.callerOnly },
					{ name: "WithCallDefaults(opts...)", type: "...CallOption", default: "none", desc: t.goRows.callDefaults },
					{ name: "WithCallAttempts(n)", type: "int", default: "3", desc: t.goRows.callAttempts },
					{ name: "WithFailOnPolicyViolation()", type: "—", default: "off", desc: t.goRows.failOnPolicy },
					{ name: "WithDataDir(dir)", type: "string", default: '"./.servicebridge"', desc: t.goRows.dataDir },
					{ name: "WithMaxOutboxRows(n)", type: "int", default: "10000", desc: t.goRows.maxOutboxRows },
					{ name: "WithDrainBatchSize(n)", type: "int", default: "100", desc: t.goRows.drainBatchSize },
					{ name: "WithMaxInFlightEvents(n)", type: "int", default: "32", desc: t.goRows.maxInFlightEvents },
					{ name: "WithInboundLimits(calls, streams)", type: "int, int", default: "512 / 512", desc: t.goRows.inboundLimits },
					{ name: "WithReconnectAttempts(n)", type: "int", default: "0 — unlimited", desc: t.goRows.reconnectAttempts },
					{ name: "WithReconnectLadder(rungs...)", type: "...time.Duration", default: "1s, 5s, 15s, 30s, 60s", desc: t.goRows.reconnectLadder },
					{ name: "WithLogger(log)", type: "*slog.Logger", default: "slog.Default()", desc: t.goRows.logger },
				]}
			/>

			<Callout type="warning">{t.advertiseCallout}</Callout>
			<Callout type="info">{t.callDefaultsCallout}</Callout>
		</div>
	);
}
