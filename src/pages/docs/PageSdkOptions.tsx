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
			"Everything the ServiceBridge constructor accepts. The defaults fit most workers, so override only what you need. The SDK reads no environment variables; every knob is a constructor option.",
		constructorTitle: "Constructor",
		constructorP1pre: "The SDK has one entry point, the",
		constructorP1mid: "class. You give it the runtime address, a bootstrap service key, and an optional",
		constructorP1end: "object.",
		constructorP2pre: "The",
		constructorP2mid: "is a gRPC control-plane address, usually",
		constructorP2end: ". The key is your bootstrap service key; on",
		constructorP2tail:
			"the SDK exchanges it for a short-lived mTLS leaf certificate. Nothing connects until you call",
		allOptionsTitle: "All options",
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
		advertiseCallout:
			"On a free port the loopback fallback (127.0.0.1) is unreachable from other hosts. In containers or Kubernetes pass an explicit advertise host, usually the pod IP: advertise: { host: process.env.POD_IP }, so peers can reach your inbound Call server.",
		callDefaultsCallout:
			"callDefaults only seeds RPC calls and streams. It leaves retry, event, workflow, and job behavior untouched; those carry their own option objects at the call site.",
	},
	ru: {
		badge: "Конфигурация",
		title: "Опции SDK",
		description:
			"Всё, что принимает конструктор ServiceBridge. Значения по умолчанию подходят большинству воркеров, переопределяйте только нужное. SDK не читает переменные окружения — каждая настройка задаётся опцией конструктора.",
		constructorTitle: "Конструктор",
		constructorP1pre: "У SDK одна точка входа — класс",
		constructorP1mid: ". Ему передают адрес рантайма, bootstrap service key и необязательный объект",
		constructorP1end: ".",
		constructorP2pre: "Параметр",
		constructorP2mid: "— адрес gRPC control plane, обычно",
		constructorP2end: ". Ключ — это bootstrap service key; при",
		constructorP2tail:
			"SDK обменивает его на короткоживущий mTLS leaf-сертификат. Соединение не открывается, пока вы не вызовете",
		allOptionsTitle: "Все опции",
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
		advertiseCallout:
			"На свободном порту loopback-фолбэк (127.0.0.1) недоступен с других хостов. В контейнерах и Kubernetes передайте явный advertise-host, обычно это IP пода: advertise: { host: process.env.POD_IP }, чтобы пиры дотянулись до вашего входящего Call-сервера.",
		callDefaultsCallout:
			"callDefaults задаёт дефолты только для RPC-вызовов и стримов. Повторы, события, воркфлоу и задания он не трогает — у них свои объекты опций на месте вызова.",
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
					ts: `import { ServiceBridge } from "servicebridge";

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

			<Callout type="warning">{t.advertiseCallout}</Callout>
			<Callout type="info">{t.callDefaultsCallout}</Callout>
		</div>
	);
}
