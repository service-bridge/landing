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
    badge: "Transport & Resilience",
    title: "Session Lifecycle",
    description:
      "A session is one live SDK→runtime connection. It opens on start(), survives drops by reconnecting, and tears down cleanly on stop() or a server Drain.",

    statesTitle: "States",
    statesP1:
      "A session is the live link between your worker and the runtime over the gRPC control plane (port 14445). The SDK keeps a single session at a time and walks it through a small, deterministic set of states. There is no big enterprise FSM to learn — the four observable states below cover everything.",
    statesP2: "You observe transitions through events on the client:",
    stateCol: "State",
    eventCol: "Event",
    descCol: "What it means",
    states: [
      [
        "Connecting",
        "—",
        "start() parses the key, provisions an mTLS cert, and opens Control.Open. No identity yet.",
      ],
      [
        "Connected",
        "connected",
        "Runtime sent Welcome on Control.Open. identity() is populated, calls and handlers are live.",
      ],
      [
        "Reconnecting",
        "reconnecting",
        "The stream ended or errored. The SDK schedules a retry; identity() is null until the next Welcome.",
      ],
      [
        "Disconnected",
        "disconnected",
        "Reconnect attempts exhausted, a server Drain, or a fatal cert/policy error. The SDK has stopped.",
      ],
    ] as [string, string, string][],
    statesCode: `const sb = new ServiceBridge("localhost:14445", key);

sb.on("connected", ({ sessionId, serviceName }) => {
  console.log("session up", serviceName, sessionId);
});
sb.on("reconnecting", ({ attempt, delayMs, reason }) => {
  console.log(\`reconnecting #\${attempt} in \${delayMs}ms: \${reason}\`);
});
sb.on("disconnected", ({ reason, error }) => {
  console.log("session down:", reason, error?.message);
});

await sb.start();          // Connecting → Connected
console.log(sb.identity()); // { sessionId, serviceId, serviceName, instanceId }
await sb.stop();           // graceful teardown`,
    statesCodeGo: `c, err := sb.New("localhost:14445", key)
if err != nil {
	log.Fatal(err)
}

c.OnConnected(func(id sb.Identity) {
	log.Println("session up", id.ServiceName, id.SessionID)
})
c.OnReconnecting(func(attempt int, cause error) {
	log.Printf("reconnecting #%d: %v", attempt, cause)
})
c.OnDisconnected(func(cause error) {
	log.Println("session down:", cause)
})

if err := c.Start(ctx); err != nil { // Connecting → Connected
	log.Fatal(err)
}
log.Println(c.Identity()) // {SessionID ServiceID ServiceName InstanceID}

if err := c.Stop(ctx); err != nil { // graceful teardown
	log.Fatal(err)
}`,
    statesNote:
      "Declare everything — RPC handlers, event definitions and subscriptions, workflows, jobs, outgoing dependencies — before start. The first registration sent to the runtime is built from those declarations.",

    epochTitle: "Epoch Fencing",
    epochP1:
      "Fencing makes sure only one instance acts as the live holder of an identity or a unit of durable work, so a stale instance can never double-process. ServiceBridge fences at two levels.",
    epochP2a:
      "Session identity. Every successful Welcome — on start() and on each cert rotation — carries a fresh",
    epochP2b:
      "(12-char Crockford-base32). During a rotation the SDK opens a new mTLS channel, waits for Welcome on it, and only then closes the old session. The old stream is never left running alongside the new one.",
    epochP3a: "Durable work. Workflow runs and job executions are leased to one instance with a",
    epochP3b:
      ". Every checkpoint, complete, and fail call carries that epoch; the runtime rejects writes from a stale epoch. If a lease is reassigned (the holder went away), the epoch bumps and the old holder is fenced out.",
    epochCode: `// instance_id of the current session; "" before the first Welcome
const id = sb.instanceIdString();

// full identity, or null during reconnect / after stop()
const me = sb.identity();
// { sessionId, serviceId, serviceName, instanceId }`,
    epochCodeGo: `// Identity is read per use, never cached: every certificate rotation mints a
// fresh InstanceID for the same ServiceID.
id := c.Identity()

log.Println(id.InstanceID) // "" before the first Welcome
log.Println(id.SessionID, id.ServiceID, id.ServiceName) // stable across a cert rotation`,
    epochWarning:
      "A cert rotation gives you a new instanceId and re-emits connected. sessionId and serviceName are stable across the rotation; cache identity() per session, not for the lifetime of the process.",

    suspendedTitle: "Suspended Recovery",
    suspendedP1:
      "When the control stream drops (network blip, runtime restart), the SDK does not fail fast. The session enters Reconnecting and a retry is scheduled. The Node SDK waits a fixed reconnectIntervalMs and gives up after reconnectAttempts tries, emitting disconnected with reason \"exhausted\". The Go SDK walks a jittered ladder — 1s, 5s, 15s, 30s, 60s, the last rung repeating — and never gives up unless you cap it with WithReconnectAttempts.",
    suspendedP2:
      "Recovery re-provisions a fresh cert and re-sends the registration built from your declarations — you do not re-register handlers. In-flight RPCs are not replayed automatically: the caller retries them (RPC has its own retry policy). Durable events sit in the local outbox and drain once the session is back.",
    suspendedParams: [
      {
        name: "reconnectIntervalMs (Node)",
        type: "number (ms)",
        default: "3000",
        desc: "Fixed delay between reconnect attempts.",
      },
      {
        name: "reconnectAttempts (Node)",
        type: "number",
        default: "3",
        desc: "Max attempts before disconnected{reason:'exhausted'} + auto-stop. 0 = unlimited.",
      },
      {
        name: "WithReconnectLadder (Go)",
        type: "...time.Duration",
        default: "1s, 5s, 15s, 30s, 60s",
        desc: "Reconnect delays. The last rung repeats forever and every rung is jittered.",
      },
      {
        name: "WithReconnectAttempts (Go)",
        type: "int",
        default: "0 — unlimited",
        desc: "Cap on consecutive reconnect attempts. 0 keeps retrying forever.",
      },
    ],
    suspendedCode: `const sb = new ServiceBridge("localhost:14445", key, {
  reconnectIntervalMs: 3000,
  reconnectAttempts: 0, // retry forever, never give up
});`,
    suspendedCodeGo: `c, err := sb.New("localhost:14445", key,
	sb.WithReconnectLadder(time.Second, 5*time.Second, 30*time.Second),
	sb.WithReconnectAttempts(0), // 0 = retry forever; it is already the Go default
)
if err != nil {
	log.Fatal(err)
}`,
    suspendedTip:
      "Durable publishes survive a reconnect: sb.event.publish writes to a local SQLite outbox first, so a transient runtime outage does not lose events — the drainer flushes them after the session recovers.",

    drainTitle: "Drain Path",
    drainP1a: "For a planned shutdown the runtime sends a",
    drainP1b:
      "signal on Control.Open with a reason. The SDK does not reconnect on a drain — it emits",
    drainP1c: "with reason",
    drainP1d:
      "so your process can finish in-flight work and exit on its own terms.",
    drainP2a: "On your side, call",
    drainP2b:
      "to tear down gracefully: it stops the cert-refresh timer, closes the session and inbound Call server, flushes the event drainer, and disposes telemetry and local storage. stop() is idempotent.",
    drainCode: `sb.on("disconnected", async ({ reason }) => {
  if (reason.startsWith("drain:")) {
    // runtime asked us to leave; finish what we can, then exit
    await sb.stop();
    process.exit(0);
  }
});

// also wire your own shutdown to stop() for clean teardown
process.on("SIGTERM", async () => {
  await sb.stop();
  process.exit(0);
});`,
    drainCodeGo: `c.OnDraining(func(reason string) {
	// the runtime asked us to leave; finish what we can, then exit
	log.Println("runtime is draining:", reason)
})

// wire your own shutdown to Stop for clean teardown
ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM)
defer stop()

<-ctx.Done()
if err := c.Stop(context.Background()); err != nil {
	log.Fatal(err)
}`,
  },
  ru: {
    badge: "Транспорт и отказоустойчивость",
    title: "Жизненный цикл сессии",
    description:
      "Сессия — это одно живое соединение SDK→runtime. Она открывается на start(), переживает обрывы через переподключение и чисто закрывается на stop() или по Drain от сервера.",

    statesTitle: "Состояния",
    statesP1:
      "Сессия — это живая связь между вашим воркером и runtime по gRPC control plane (порт 14445). SDK держит одну сессию за раз и проводит её через небольшой детерминированный набор состояний. Никакого большого FSM учить не нужно — четырёх наблюдаемых состояний ниже хватает на всё.",
    statesP2: "Переходы отслеживаются через события на клиенте:",
    stateCol: "Состояние",
    eventCol: "Событие",
    descCol: "Что значит",
    states: [
      [
        "Connecting",
        "—",
        "start() разбирает ключ, провижионит mTLS-сертификат и открывает Control.Open. Идентичности ещё нет.",
      ],
      [
        "Connected",
        "connected",
        "Runtime прислал Welcome по Control.Open. identity() заполнен, вызовы и хендлеры работают.",
      ],
      [
        "Reconnecting",
        "reconnecting",
        "Стрим завершился или упал. SDK планирует повтор; identity() равен null до следующего Welcome.",
      ],
      [
        "Disconnected",
        "disconnected",
        "Попытки переподключения исчерпаны, пришёл Drain от сервера или фатальная ошибка cert/policy. SDK остановлен.",
      ],
    ] as [string, string, string][],
    statesCode: `const sb = new ServiceBridge("localhost:14445", key);

sb.on("connected", ({ sessionId, serviceName }) => {
  console.log("сессия поднята", serviceName, sessionId);
});
sb.on("reconnecting", ({ attempt, delayMs, reason }) => {
  console.log(\`переподключение #\${attempt} через \${delayMs}ms: \${reason}\`);
});
sb.on("disconnected", ({ reason, error }) => {
  console.log("сессия упала:", reason, error?.message);
});

await sb.start();          // Connecting → Connected
console.log(sb.identity()); // { sessionId, serviceId, serviceName, instanceId }
await sb.stop();           // плавное завершение`,
    statesCodeGo: `c, err := sb.New("localhost:14445", key)
if err != nil {
	log.Fatal(err)
}

c.OnConnected(func(id sb.Identity) {
	log.Println("сессия поднята", id.ServiceName, id.SessionID)
})
c.OnReconnecting(func(attempt int, cause error) {
	log.Printf("reconnecting #%d: %v", attempt, cause)
})
c.OnDisconnected(func(cause error) {
	log.Println("сессия упала:", cause)
})

if err := c.Start(ctx); err != nil { // Connecting → Connected
	log.Fatal(err)
}
log.Println(c.Identity()) // {SessionID ServiceID ServiceName InstanceID}

if err := c.Stop(ctx); err != nil { // плавное завершение
	log.Fatal(err)
}`,
    statesNote:
      "Объявляйте всё — RPC-хендлеры, определения и подписки событий, воркфлоу, задания, исходящие зависимости — до старта. Первая регистрация, отправленная в runtime, собирается из этих объявлений.",

    epochTitle: "Ограждение по epoch",
    epochP1:
      "Ограждение (fencing) гарантирует, что только один экземпляр является живым держателем идентичности или единицы durable-работы, чтобы устаревший экземпляр никогда не обработал её дважды. ServiceBridge ограждает на двух уровнях.",
    epochP2a:
      "Идентичность сессии. Каждый успешный Welcome — на start() и при каждой ротации сертификата — несёт свежий",
    epochP2b:
      "(12 символов Crockford-base32). Во время ротации SDK открывает новый mTLS-канал, ждёт на нём Welcome и только потом закрывает старую сессию. Старый стрим никогда не остаётся работать рядом с новым.",
    epochP3a:
      "Durable-работа. Запуски workflow и исполнения job выдаются одному экземпляру по лизингу с",
    epochP3b:
      ". Каждый вызов checkpoint, complete и fail несёт этот epoch; runtime отклоняет записи с устаревшим epoch. Если лиз переназначается (держатель пропал), epoch увеличивается и старый держатель ограждается.",
    epochCode: `// instance_id текущей сессии; "" до первого Welcome
const id = sb.instanceIdString();

// полная идентичность, или null во время reconnect / после stop()
const me = sb.identity();
// { sessionId, serviceId, serviceName, instanceId }`,
    epochCodeGo: `// Identity читается на каждое обращение и никогда не кешируется: каждая
// ротация сертификата даёт новый InstanceID при том же ServiceID.
id := c.Identity()

log.Println(id.InstanceID) // "" до первого Welcome
log.Println(id.SessionID, id.ServiceID, id.ServiceName) // стабильны при ротации сертификата`,
    epochWarning:
      "Ротация сертификата даёт новый instanceId и повторно эмитит connected. sessionId и serviceName стабильны при ротации; кэшируйте identity() на сессию, а не на всю жизнь процесса.",

    suspendedTitle: "Восстановление после обрыва",
    suspendedP1:
      "Когда control-стрим падает (сбой сети, перезапуск runtime), SDK не падает сразу. Сессия переходит в Reconnecting и планируется повтор. Node SDK ждёт фиксированный reconnectIntervalMs и сдаётся после reconnectAttempts попыток, эмитя disconnected с причиной \"exhausted\". Go SDK идёт по лестнице с джиттером — 1с, 5с, 15с, 30с, 60с, последняя ступень повторяется — и не сдаётся, пока вы не ограничите его через WithReconnectAttempts.",
    suspendedP2:
      "Восстановление провижионит свежий сертификат и заново шлёт регистрацию, собранную из ваших объявлений — хендлеры перерегистрировывать не нужно. Незавершённые RPC автоматически не повторяются: их повторяет вызывающая сторона (у RPC своя retry-политика). Durable-события лежат в локальном outbox и уходят после возврата сессии.",
    suspendedParams: [
      {
        name: "reconnectIntervalMs (Node)",
        type: "number (мс)",
        default: "3000",
        desc: "Фиксированная задержка между попытками переподключения.",
      },
      {
        name: "reconnectAttempts (Node)",
        type: "number",
        default: "3",
        desc: "Максимум попыток до disconnected{reason:'exhausted'} + авто-стоп. 0 = без лимита.",
      },
      {
        name: "WithReconnectLadder (Go)",
        type: "...time.Duration",
        default: "1с, 5с, 15с, 30с, 60с",
        desc: "Задержки переподключения. Последняя ступень повторяется вечно, каждая идёт с джиттером.",
      },
      {
        name: "WithReconnectAttempts (Go)",
        type: "int",
        default: "0 — без лимита",
        desc: "Лимит подряд идущих попыток переподключения. 0 — повторять вечно.",
      },
    ],
    suspendedCode: `const sb = new ServiceBridge("localhost:14445", key, {
  reconnectIntervalMs: 3000,
  reconnectAttempts: 0, // повторять вечно, никогда не сдаваться
});`,
    suspendedCodeGo: `c, err := sb.New("localhost:14445", key,
	sb.WithReconnectLadder(time.Second, 5*time.Second, 30*time.Second),
	sb.WithReconnectAttempts(0), // 0 = повторять вечно; в Go это и есть значение по умолчанию
)
if err != nil {
	log.Fatal(err)
}`,
    suspendedTip:
      "Durable-публикации переживают reconnect: sb.event.publish сначала пишет в локальный SQLite outbox, поэтому кратковременный сбой runtime не теряет события — drainer сливает их после восстановления сессии.",

    drainTitle: "Путь drain",
    drainP1a: "При плановом завершении runtime шлёт сигнал",
    drainP1b:
      "по Control.Open с причиной. На drain SDK не переподключается — он эмитит",
    drainP1c: "с причиной",
    drainP1d:
      "чтобы ваш процесс довёл незавершённую работу и вышел на своих условиях.",
    drainP2a: "Со своей стороны вызовите",
    drainP2b:
      "для плавного завершения: он гасит таймер ротации сертификата, закрывает сессию и входящий Call-сервер, сливает event-drainer и освобождает telemetry и локальное хранилище. stop() идемпотентен.",
    drainCode: `sb.on("disconnected", async ({ reason }) => {
  if (reason.startsWith("drain:")) {
    // runtime попросил уйти; доделаем что можем и выходим
    await sb.stop();
    process.exit(0);
  }
});

// также привяжите свой shutdown к stop() для чистого завершения
process.on("SIGTERM", async () => {
  await sb.stop();
  process.exit(0);
});`,
    drainCodeGo: `c.OnDraining(func(reason string) {
	// runtime попросил уйти; доделаем что можем и выходим
	log.Println("runtime is draining:", reason)
})

// привяжите свой shutdown к Stop для чистого завершения
ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM)
defer stop()

<-ctx.Done()
if err := c.Stop(context.Background()); err != nil {
	log.Fatal(err)
}`,
  },
};

export function PageSessionLifecycle() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="states">{t.statesTitle}</H2>
      <P>{t.statesP1}</P>
      <P>{t.statesP2}</P>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">{t.stateCol}</th>
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">{t.eventCol}</th>
              <th className="text-left py-2 font-medium text-muted-foreground">{t.descCol}</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {t.states.map(([state, event, desc]) => (
              <tr key={state} className="border-b border-border/50">
                <td className="py-2 pr-6 font-mono text-foreground">{state}</td>
                <td className="py-2 pr-6 font-mono">{event}</td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MultiCodeBlock code={{ ts: t.statesCode, go: t.statesCodeGo }} />
      <Callout type="info">{t.statesNote}</Callout>

      <H2 id="epoch-fencing">{t.epochTitle}</H2>
      <P>{t.epochP1}</P>
      <P>
        {t.epochP2a} <Mono>instanceId</Mono> {t.epochP2b}
      </P>
      <P>
        {t.epochP3a} <Mono>leaseEpoch</Mono>
        {t.epochP3b}
      </P>
      <MultiCodeBlock code={{ ts: t.epochCode, go: t.epochCodeGo }} />
      <Callout type="warning">{t.epochWarning}</Callout>

      <H2 id="suspended-recovery">{t.suspendedTitle}</H2>
      <P>{t.suspendedP1}</P>
      <P>{t.suspendedP2}</P>
      <ParamTable rows={t.suspendedParams} />
      <MultiCodeBlock code={{ ts: t.suspendedCode, go: t.suspendedCodeGo }} />
      <Callout type="tip">{t.suspendedTip}</Callout>

      <H2 id="drain-path">{t.drainTitle}</H2>
      <P>
        {t.drainP1a} <Mono>Drain</Mono> {t.drainP1b} <Mono>disconnected</Mono>{" "}
        {t.drainP1c} <Mono>"drain: ..."</Mono> {t.drainP1d}
      </P>
      <P>
        {t.drainP2a} <Mono>sb.stop()</Mono> {t.drainP2b}
      </P>
      <MultiCodeBlock code={{ ts: t.drainCode, go: t.drainCodeGo }} />
    </div>
  );
}

export default PageSessionLifecycle;
