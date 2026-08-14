import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
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
    badge: "SDK Reference",
    title: "Startup & Shutdown",
    description:
      "Construct the ServiceBridge client, register everything it serves, declare what it calls out to, then bring it online with start() and tear it down with stop().",

    lifecycleTitle: "Worker lifecycle",
    lifecycleP1: "Every service follows the same order. Register handlers and declare dependencies first, then call ",
    lifecycleP2: ". Every declaration has to land ",
    lifecycleP2b: "before",
    lifecycleP2c: " start(): the SDK ships them to the runtime in the first registration frame, and anything you add later never reaches it.",
    lifecycleSteps: [
      ["Construct the client", " — ", "."],
      ["Register what it serves", " — ", ", ", ", ", ", ", " in any order."],
      ["Declare outgoing dependencies", " — call ", " for every service this one calls or publishes to (see below)."],
      ["Go online", " — ", " provisions the mTLS cert, opens the control stream, starts the inbound RPC server, and opens the event / workflow / job subscribers."],
      ["Tear down", " — ", " gracefully closes the session, servers, subscribers, telemetry, and the local outbox."],
    ],

    outgoingTitle: "sb.service() — outgoing deps",
    outgoingP1: "The runtime builds the service graph before any traffic flows, so it needs to know who calls whom up front. For each service you call, publish to, or run workflows on, declare it with ",
    outgoingP2: " before ",
    outgoingP3: ". The second argument is a plain object with optional ",
    outgoingP4: ", ",
    outgoingP5: ", and ",
    outgoingP6: " arrays.",
    outgoingTip: "Loading schemas from a .proto file? sb.client(service, protoFile) already declares every method in the file as an outgoing rpc dependency, so you skip sb.service() for those methods.",

    startTitle: "sb.start()",
    startP1:
      "Starting the client parses the bootstrap key, provisions a leaf certificate over mTLS, opens the control stream, brings up the inbound Call RPC server (unless the client is declared caller-only), and opens the event / workflow / job subscribers. It returns once the worker is registered and online.",
    startNote:
      "The inbound RPC server address comes from the client's advertise setting, not from the startup call. There is no host argument.",

    optsTitle: "ServiceBridgeOptions",
    optsP: "Construction tunes reconnect behavior, the inbound server address, and call defaults. Everything is optional — a plain options object in the Node SDK, functional options in Go. The full table lives on the SDK Options page.",
    optsRows: {
      reconnectIntervalMs: "Delay between reconnect attempts.",
      reconnectAttempts: "Max reconnect attempts before a disconnected{reason:'exhausted'} event and auto-stop. 0 = unlimited.",
      advertise: "Inbound Call RPC server address. { host, port } binds explicitly (port 0 lets the OS pick). undefined falls back to 127.0.0.1:0 with a warning. false makes the worker caller-only with no inbound server.",
      callDefaults: 'Defaults merged into every sb.rpc.call() and sb.stream() (e.g. timeout "30s"), overridden per call.',
      failOnPolicyViolation: "When true, any policy warning from the runtime makes start() emit disconnected{reason:'policy'} and stop. When false, warnings are logged and emitted as policy_violation events only.",
    },

    identityTitle: "Identity & instanceId",
    identityP1: "Once the first Welcome lands, the client reports the live session identity — ",
    identityP3:
      ". Before the connection opens, and after shutdown, it carries nothing: the Node SDK hands back null, the Go client a zero-valued struct.",
    identityP5:
      "instanceId is the 12-character Crockford-base32 replica id the dashboard shows. Read the identity per use instead of caching it — every certificate rotation mints a fresh one.",
    identityNote: "The runtime generates instanceId on each session, you never set it. The SDK gets a fresh one on every reconnect and cert rotation.",

    tlsTitle: "TLS / mTLS",
    tlsP1: "Transport security runs itself. The bootstrap key carries the CA certificate as a trust anchor; on start() the SDK swaps the key for a short-lived leaf certificate and runs every connection over mTLS. The private key never leaves your process.",
    tlsSteps: [
      "The SDK generates an EC P-256 key pair and a PKCS#10 CSR in memory.",
      ["It sends the CSR to ", " over a channel pinned to the CA from your bootstrap key."],
      "The runtime signs and returns a leaf cert plus the CA chain.",
      "Every channel runs full mTLS with that cert: control, RPC, events, workflows, jobs, telemetry.",
    ],
    tlsRotateP: "The SDK refreshes the cert about 30 minutes before expiry with an overlap rotation: it brings up a new mTLS session and waits for its Welcome before closing the old one, so there is no gap. Each rotation issues a fresh ",
    tlsRotateP2: ".",
    tlsWarn1: "Set ",
    tlsWarn2: " to a routable address when running in Docker or Kubernetes. The default ",
    tlsWarn3: " only answers on the same host, so inbound RPC delivery fails across nodes. In k8s the pod IP is the usual choice — advertise the value of ",
    tlsWarn4: ".",

    shutdownTitle: "Graceful shutdown",
    shutdownP: "Startup returns once the worker is online and your process keeps running. Wire the shutdown call into your signal handlers so teardown stays predictable: it drains the session, flushes telemetry, and closes the local outbox.",
    shutdownNodeTitle: "SIGTERM / SIGINT handler",

    stopTitle: "sb.stop()",
    stopP: "Stopping tears everything down in order: it clears the cert-refresh timer, closes the control session and inbound RPC server, stops the transports and subscribers, flushes telemetry, and closes the local SQLite outbox. It is idempotent, so calling it twice is safe.",
  },
  ru: {
    badge: "SDK Reference",
    title: "Запуск и остановка",
    description:
      "Создайте клиент ServiceBridge, зарегистрируйте всё, что он обслуживает, объявите, что он вызывает, затем поднимите его через start() и корректно завершите через stop().",

    lifecycleTitle: "Жизненный цикл воркера",
    lifecycleP1: "Каждый сервис проходит одну и ту же последовательность. Сначала регистрируете обработчики и объявляете зависимости, затем вызываете ",
    lifecycleP2: ". Все объявления должны попасть в код ",
    lifecycleP2b: "до",
    lifecycleP2c: " start(): SDK отправляет их в runtime первым кадром регистрации, а всё добавленное позже до него уже не дойдёт.",
    lifecycleSteps: [
      ["Создать клиент", " — ", "."],
      ["Зарегистрировать то, что обслуживает", " — ", ", ", ", ", ", ", " в любом порядке."],
      ["Объявить исходящие зависимости", " — вызовите ", " для каждого сервиса, который этот вызывает или которому публикует (см. ниже)."],
      ["Поднять онлайн", " — ", " выдаёт mTLS-сертификат, открывает control-стрим, поднимает входящий RPC-сервер и открывает подписчиков событий / воркфлоу / заданий."],
      ["Завершить", " — ", " корректно закрывает сессию, серверы, подписчиков, телеметрию и локальный outbox."],
    ],

    outgoingTitle: "sb.service() — исходящие зависимости",
    outgoingP1: "Runtime строит граф сервисов до начала трафика, поэтому знать «кто кого вызывает» ему нужно заранее. Для каждого сервиса, который вы вызываете, которому публикуете или чьи воркфлоу запускаете, объявите его через ",
    outgoingP2: " до ",
    outgoingP3: ". Второй аргумент — обычный объект с опциональными массивами ",
    outgoingP4: ", ",
    outgoingP5: " и ",
    outgoingP6: ".",
    outgoingTip: "Грузите схемы из .proto-файла? sb.client(service, protoFile) уже объявит каждый метод файла как исходящую rpc-зависимость, так что sb.service() для этих методов вызывать не нужно.",

    startTitle: "sb.start()",
    startP1:
      "Запуск клиента разбирает bootstrap-ключ, выдаёт leaf-сертификат через mTLS, открывает control-стрим, поднимает входящий Call RPC-сервер (если клиент не объявлен caller-only) и открывает подписчиков событий / воркфлоу / заданий. Возврат происходит, когда воркер зарегистрирован и онлайн.",
    startNote:
      "Адрес входящего RPC-сервера берётся из настройки advertise у клиента, а не из вызова запуска. Аргумента host нет.",

    optsTitle: "ServiceBridgeOptions",
    optsP: "Создание клиента настраивает reconnect, адрес входящего сервера и дефолты вызовов. Всё опционально — в Node SDK это объект опций, в Go — функциональные опции. Полная таблица — на странице «Опции SDK».",
    optsRows: {
      reconnectIntervalMs: "Задержка между попытками переподключения.",
      reconnectAttempts: "Максимум попыток до события disconnected{reason:'exhausted'} и авто-остановки. 0 = без лимита.",
      advertise: "Адрес входящего Call RPC-сервера. { host, port } — явная привязка (port 0 = ОС выберет порт). undefined — фолбэк на 127.0.0.1:0 с предупреждением. false — воркер только вызывает, входящий сервер не поднимается.",
      callDefaults: 'Дефолты, подмешиваемые в каждый sb.rpc.call() и sb.stream() (например timeout "30s"), перебиваются per-call.',
      failOnPolicyViolation: "true — любой policy-warning от runtime роняет start() через disconnected{reason:'policy'} и stop(). false — warning только логируется и эмитится как событие policy_violation.",
    },

    identityTitle: "Identity и instanceId",
    identityP1: "Как только приходит первый Welcome, клиент отдаёт идентификатор живой сессии — ",
    identityP3:
      ". До открытия соединения и после остановки в нём ничего нет: Node SDK возвращает null, Go-клиент — нулевую структуру.",
    identityP5:
      "instanceId — 12-символьный id реплики в Crockford-base32, тот же, что показывает дашборд. Читайте identity при каждом использовании, а не кешируйте: каждая ротация сертификата выдаёт новый.",
    identityNote: "instanceId генерирует runtime на каждой сессии, вы его не задаёте. SDK получает новый на каждом переподключении и ротации сертификата.",

    tlsTitle: "TLS / mTLS",
    tlsP1: "Защита транспорта работает сама. Bootstrap-ключ несёт CA-сертификат как доверенный якорь; на start() SDK обменивает ключ на короткоживущий leaf-сертификат и гоняет каждое соединение поверх mTLS. Приватный ключ никогда не покидает ваш процесс.",
    tlsSteps: [
      "SDK генерирует пару ключей EC P-256 и PKCS#10 CSR в памяти.",
      ["Отправляет CSR в ", " по каналу, привязанному (pinned) к CA из вашего bootstrap-ключа."],
      "Runtime подписывает и возвращает leaf-сертификат и цепочку CA.",
      "Каждый канал — control, RPC, события, воркфлоу, задания, телеметрия — работает с полным mTLS на этом сертификате.",
    ],
    tlsRotateP: "SDK обновляет сертификат примерно за 30 минут до истечения через overlap-ротацию: поднимает новую mTLS-сессию и ждёт её Welcome перед закрытием старой, так что разрыва нет. Каждая ротация выдаёт новый ",
    tlsRotateP2: ".",
    tlsWarn1: "Задайте ",
    tlsWarn2: " на маршрутизируемый адрес при запуске в Docker или Kubernetes. Дефолтный ",
    tlsWarn3: " отвечает только на том же хосте, поэтому доставка входящих RPC между узлами сломается. В k8s обычно берут IP пода — анонсируйте значение ",
    tlsWarn4: ".",

    shutdownTitle: "Мягкое завершение",
    shutdownP: "Запуск завершается, когда воркер онлайн, и ваш процесс продолжает работать. Подключите остановку к обработчикам сигналов, чтобы завершение было предсказуемым: она дренирует сессию, сбрасывает телеметрию и закрывает локальный outbox.",
    shutdownNodeTitle: "Обработчик SIGTERM / SIGINT",

    stopTitle: "sb.stop()",
    stopP: "Остановка гасит всё по порядку: сбрасывает таймер обновления сертификата, закрывает control-сессию и входящий RPC-сервер, останавливает транспорты и подписчиков, сбрасывает телеметрию и закрывает локальный SQLite outbox. Идемпотентна, повторный вызов безопасен.",
  },
};

export function PageStart() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="lifecycle">{t.lifecycleTitle}</H2>
      <P>
        {t.lifecycleP1}<Mono>sb.start()</Mono>{t.lifecycleP2}
        <strong className="text-foreground">{t.lifecycleP2b}</strong>{t.lifecycleP2c}
      </P>
      <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground my-4">
        <li>
          <strong className="text-foreground">{t.lifecycleSteps[0][0]}</strong>{t.lifecycleSteps[0][1]}
          <Mono>new ServiceBridge(url, key, options?)</Mono>{t.lifecycleSteps[0][2]}
        </li>
        <li>
          <strong className="text-foreground">{t.lifecycleSteps[1][0]}</strong>{t.lifecycleSteps[1][1]}
          <Mono>sb.rpc.handle()</Mono>{t.lifecycleSteps[1][2]}
          <Mono>sb.event.handle()</Mono>{t.lifecycleSteps[1][3]}
          <Mono>sb.workflow.handle()</Mono>{t.lifecycleSteps[1][4]}
          <Mono>sb.job.handle()</Mono>{t.lifecycleSteps[1][5]}
        </li>
        <li>
          <strong className="text-foreground">{t.lifecycleSteps[2][0]}</strong>{t.lifecycleSteps[2][1]}
          <Mono>sb.service()</Mono>{t.lifecycleSteps[2][2]}
        </li>
        <li>
          <strong className="text-foreground">{t.lifecycleSteps[3][0]}</strong>{t.lifecycleSteps[3][1]}
          <Mono>sb.start()</Mono>{t.lifecycleSteps[3][2]}
        </li>
        <li>
          <strong className="text-foreground">{t.lifecycleSteps[4][0]}</strong>{t.lifecycleSteps[4][1]}
          <Mono>sb.stop()</Mono>{t.lifecycleSteps[4][2]}
        </li>
      </ol>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge(
  "localhost:14445",   // gRPC control plane address
  serviceKey,          // your bootstrap service key
);

// 1. Register what this service serves (order doesn't matter)
sb.rpc.handle("charge", chargeHandler, { schema });
sb.event.handle("orders.*", onOrderEvent);

// 2. Declare what it calls out to — before start()
sb.service("inventory", { rpc: ["reserve"] });

// 3. Bring the worker online and wait until registered
await sb.start();

// later, on shutdown
await sb.stop();`,
          go: `package main

import (
	"context"
	"log"
	"os"

	sb "github.com/service-bridge/sdk/go"
)

func main() {
	c, err := sb.New(
		"localhost:14445",              // gRPC control plane address
		os.Getenv("SERVICEBRIDGE_KEY"), // your bootstrap service key
	)
	if err != nil {
		log.Fatal(err)
	}

	// 1. Register what this service serves (order doesn't matter)
	if err := sb.Handle(c, "Charge", chargeHandler); err != nil {
		log.Fatal(err)
	}
	if err := sb.SubscribeEvent(c, "orders.*", onOrderEvent); err != nil {
		log.Fatal(err)
	}

	// 2. Declare what it calls out to — before Start
	if err := c.Service("inventory", sb.ServiceDeps{RPC: []string{"Reserve"}}); err != nil {
		log.Fatal(err)
	}

	// 3. Bring the worker online and wait until registered
	ctx := context.Background()
	if err := c.Start(ctx); err != nil {
		log.Fatal(err)
	}

	// later, on shutdown
	if err := c.Stop(ctx); err != nil {
		log.Fatal(err)
	}
}`,
        }}
      />

      <H2 id="outgoing-deps">{t.outgoingTitle}</H2>
      <P>
        {t.outgoingP1}<Mono>sb.service(serviceName, deps)</Mono>{t.outgoingP2}
        <Mono>sb.start()</Mono>{t.outgoingP3}<Mono>rpc</Mono>{t.outgoingP4}
        <Mono>workflows</Mono>{t.outgoingP5}<Mono>http</Mono>{t.outgoingP6}
      </P>
      <MultiCodeBlock
        code={{
          ts: `// This service calls inventory.reserve + inventory.release,
// runs the fulfillment service's "order.flow" workflow,
// and reaches the billing service's HTTP routes.
sb.service("inventory", { rpc: ["reserve", "release"] });
sb.service("fulfillment", { workflows: ["order.flow"] });
sb.service("billing", { http: ["/invoices"] });

await sb.start();
await sb.rpc.call("inventory", "reserve", { sku: "A1", qty: 2 });`,
          go: `// This service calls inventory.Reserve + inventory.Release,
// runs the fulfillment service's "order.flow" workflow,
// and reaches the billing service's HTTP routes.
if err := c.Service("inventory", sb.ServiceDeps{RPC: []string{"Reserve", "Release"}}); err != nil {
	log.Fatal(err)
}
if err := c.Service("fulfillment", sb.ServiceDeps{Workflows: []string{"order.flow"}}); err != nil {
	log.Fatal(err)
}
if err := c.Service("billing", sb.ServiceDeps{HTTP: []string{"GET /invoices"}}); err != nil {
	log.Fatal(err)
}

if err := c.Start(ctx); err != nil {
	log.Fatal(err)
}

res, err := sb.Call[*inventorypb.ReserveRequest, *inventorypb.ReserveReply](
	ctx, c, "inventory", "Reserve",
	&inventorypb.ReserveRequest{OrderId: "o-1"},
)
if err != nil {
	log.Fatal(err)
}
log.Println("reserved:", res.GetReserved())`,
        }}
      />
      <Callout type="tip">{t.outgoingTip}</Callout>

      <H2 id="start-sig">{t.startTitle}</H2>
      <P>{t.startP1}</P>
      <MultiCodeBlock
        code={{
          ts: `start(): Promise<void>`,
          go: `func (c *sb.Client) Start(ctx context.Context) error`,
        }}
      />
      <Callout type="info">{t.startNote}</Callout>

      <H2 id="start-opts">{t.optsTitle}</H2>
      <P>{t.optsP}</P>
      <MultiCodeBlock
        code={{
          ts: `const sb = new ServiceBridge(url, key, {
  advertise: { host: process.env.POD_IP!, port: 0 }, // your app's env, fine
  reconnectAttempts: 0,            // retry forever
  callDefaults: { timeout: "10s" },
  failOnPolicyViolation: true,
});`,
          go: `c, err := sb.New(url, key,
	sb.WithAdvertise(os.Getenv("POD_IP"), 0), // your app's env, fine
	sb.WithReconnectAttempts(0),              // retry forever
	sb.WithCallDefaults(sb.WithTimeout(10*time.Second)),
	sb.WithFailOnPolicyViolation(),
)
if err != nil {
	log.Fatal(err) // CodeConfig — sb.New does no I/O
}

if err := c.Start(ctx); err != nil {
	log.Fatal(err)
}`,
        }}
      />
      <ParamTable
        rows={[
          { name: "reconnectIntervalMs", type: "number", default: "3000", desc: t.optsRows.reconnectIntervalMs },
          { name: "reconnectAttempts", type: "number", default: "3", desc: t.optsRows.reconnectAttempts },
          { name: "advertise", type: "{ host, port } | false", default: "undefined", desc: t.optsRows.advertise },
          { name: "callDefaults", type: "CallOpts", default: "{}", desc: t.optsRows.callDefaults },
          { name: "failOnPolicyViolation", type: "boolean", default: "false", desc: t.optsRows.failOnPolicyViolation },
        ]}
      />

      <H2 id="instance-weight">{t.identityTitle}</H2>
      <P>
        {t.identityP1}
        <Mono>{`{ sessionId, serviceId, serviceName, instanceId }`}</Mono>{t.identityP3}
      </P>
      <P>{t.identityP5}</P>
      <MultiCodeBlock
        code={{
          ts: `await sb.start();

const id = sb.identity();
// { sessionId, serviceId, serviceName, instanceId }
sb.logger.info("worker online", { instance: id?.instanceId });

// Short form for just the replica id shown in the dashboard:
const replica = sb.instanceIdString(); // "" before the first Welcome`,
          go: `if err := c.Start(ctx); err != nil {
	log.Fatal(err)
}

id := c.Identity() // sb.Identity{SessionID, ServiceID, ServiceName, InstanceID}
c.Telemetry.Logger().Info("worker online", "instance", id.InstanceID)

// Read it per use — every rotation mints a fresh InstanceID under one ServiceID.
log.Println("replica:", c.Identity().InstanceID)`,
        }}
      />
      <Callout type="info">{t.identityNote}</Callout>

      <H2 id="tls-behavior">{t.tlsTitle}</H2>
      <P>{t.tlsP1}</P>
      <ol className="list-decimal pl-6 space-y-1 text-muted-foreground text-sm my-3">
        <li>{t.tlsSteps[0] as string}</li>
        <li>
          {(t.tlsSteps[1] as string[])[0]}<Mono>Bootstrap.Provision</Mono>{(t.tlsSteps[1] as string[])[1]}
        </li>
        <li>{t.tlsSteps[2] as string}</li>
        <li>{t.tlsSteps[3] as string}</li>
      </ol>
      <P>
        {t.tlsRotateP}<Mono>instanceId</Mono>{t.tlsRotateP2}
      </P>
      <Callout type="warning">
        {t.tlsWarn1}<Mono>advertise.host</Mono>{t.tlsWarn2}<Mono>127.0.0.1</Mono>
        {t.tlsWarn3}<Mono>POD_IP</Mono>{t.tlsWarn4}
      </Callout>

      <H2 id="graceful-shutdown">{t.shutdownTitle}</H2>
      <P>{t.shutdownP}</P>
      <H3 id="shutdown-node">{t.shutdownNodeTitle}</H3>
      <MultiCodeBlock
        code={{
          ts: `const shutdown = async () => {
  await sb.stop();   // drains session, flushes telemetry + offline outbox
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

await sb.start();`,
          go: `if err := c.Start(context.Background()); err != nil {
	log.Fatal(err)
}

stop := make(chan os.Signal, 1)
signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
<-stop

// drains the session, flushes telemetry, closes the local outbox
shutdown, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
if err := c.Stop(shutdown); err != nil {
	log.Println("stop:", err)
}`,
        }}
      />

      <H2 id="stop-sig">{t.stopTitle}</H2>
      <P>{t.stopP}</P>
      <MultiCodeBlock
        code={{
          ts: `await sb.stop();`,
          go: `if err := c.Stop(ctx); err != nil {
	log.Println("stop:", err)
}`,
        }}
      />
    </div>
  );
}
