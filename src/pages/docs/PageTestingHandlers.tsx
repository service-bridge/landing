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

const RPC_BASIC = `import { createTestHarness } from "service-bridge/testing";

const harness = createTestHarness();

harness.rpc.handle("Charge", async (req: { userId: string; amount: number }) => {
  if (req.amount <= 0) throw new Error("amount must be positive");
  return { transactionId: \`tx-\${req.userId}\`, ok: true };
});

const res = await harness.rpc.invoke("Charge", { userId: "u-1", amount: 42 });
// { transactionId: "tx-u-1", ok: true }

await expect(harness.rpc.invoke("Charge", { userId: "u-2", amount: -1 }))
  .rejects.toThrow("amount must be positive");`;

const RPC_MOCK = `harness.rpc.mockResponse("fraud-svc", "Check", { blocked: false });
// or compute the response from the payload:
harness.rpc.mockResponse("fraud-svc", "Check", (req: { userId: string }) => ({
  blocked: req.userId === "banned-user",
}));

// ... the handler under test calls rpc.call("fraud-svc", "Check", { userId })

expect(harness.rpc.calls()).toEqual([
  { serviceName: "fraud-svc", methodName: "Check", payload: { userId: "u-1" } },
]);`;

const EVENT_BASIC = `harness.event.handle("payment.charged", async (payload) => {
  const { transactionId } = payload as { transactionId: string };
  await sendReceipt(transactionId); // must be idempotent — delivery is at-least-once
});

const result = await harness.event.deliver("payment.charged", { transactionId: "tx-1" });
// { outcome: "ack" }`;

const EVENT_RETRY = `let dbDown = true;
harness.event.handle("payment.charged", async () => {
  if (dbDown) throw new Error("db unavailable");
});

const first = await harness.event.deliver("payment.charged", {});
// { outcome: "nack", reason: "Error: db unavailable" }

dbDown = false;
const retried = await harness.event.deliver("payment.charged", {});
// { outcome: "ack" }`;

const EVENT_PUBLISH = `// inside the handler: await event.publish("payment.charged", { transactionId, amount });

expect(harness.event.published()).toEqual([
  { name: "payment.charged", payload: { transactionId: "tx-u-1", amount: 42 } },
]);`;

const FACTORY_PATTERN = `import type { EventDomain, RpcDomain } from "service-bridge";

function makeChargeHandler(deps: {
  rpc: Pick<RpcDomain, "call">;
  event: Pick<EventDomain, "publish">;
}) {
  return async (req: { userId: string; amount: number }) => {
    const fraud = await deps.rpc.call<{ userId: string }, { blocked: boolean }>(
      "fraud-svc", "Check", { userId: req.userId },
    );
    if (fraud.blocked) throw new Error(\`user \${req.userId} blocked\`);

    const transactionId = \`tx-\${req.userId}\`;
    await deps.event.publish("payment.charged", { transactionId, amount: req.amount });
    return { transactionId, ok: true };
  };
}

// production:
const sb = new ServiceBridge(URL, KEY);
sb.rpc.handle("Charge", makeChargeHandler(sb), {
  schema: { protoFile: "./payment.proto", input: "ChargeRequest", output: "ChargeReply" },
});

// test:
const harness = createTestHarness();
harness.rpc.mockResponse("fraud-svc", "Check", { blocked: false });
harness.rpc.handle("Charge", makeChargeHandler(harness));
const res = await harness.rpc.invoke("Charge", { userId: "u-1", amount: 42 });`;

const CHEATSHEET = `import { createTestHarness } from "service-bridge/testing";

const harness = createTestHarness();

// RPC
harness.rpc.handle("Charge", async (req) => ({ ok: true }));
const res = await harness.rpc.invoke("Charge", { amount: 1 });

harness.rpc.mockResponse("other-svc", "Method", { ok: true });
// ... call the handler under test, which itself calls rpc.call(...)
harness.rpc.calls(); // readonly RpcCallRecord[]

// Events
harness.event.handle("payment.charged", async (payload) => { /* ... */ });
await harness.event.deliver("payment.charged", { transactionId: "tx-1" });
// { outcome: "ack" } | { outcome: "nack"; reason: string }

// ... call the handler under test, which itself calls event.publish(...)
harness.event.published(); // readonly PublishedEventRecord[]

harness.reset(); // clears rpc + event`;

const T = {
  en: {
    badge: "SDK Reference",
    title: "Testing Handlers",
    description:
      "service-bridge/testing gives you createTestHarness() — an in-memory double of sb.rpc and sb.event for unit-testing registered RPC and event handlers without a live runtime, network, or SQLite.",

    overviewTitle: "Why",
    overviewDesc:
      "A registered handler normally runs behind a live runtime connection, gRPC decode, and (for events) an outbox. That's the wrong dependency for a unit test of the handler's own business logic. The test harness reproduces the exact call surface — same handler function signatures as production — entirely in the test process, with no network, SQLite, or runtime.",
    overviewCallout:
      "The harness works on decoded objects, not wire bytes. Protobuf encode/decode stays out of the handler test — that's the concern of the schema/CallServer path, not the handler's own logic.",

    installTitle: "Install & import",
    installDesc: "The testing utilities ship in the main package under a subpath export.",

    modelTitle: "Model",
    modelRows: [
      { name: "harness.rpc", type: "TestRpcDomain", desc: "handle() / invoke() for inbound RPC; call() / mockResponse() for outbound RPC" },
      { name: "harness.event", type: "TestEventDomain", desc: "handle() / deliver() for inbound events; publish() for outbound events" },
      { name: "harness.reset()", type: "() => void", desc: "Clears all handlers, mocks, and recorded calls on both domains" },
    ] as { name: string; type: string; desc: string }[],

    rpcTitle: "RPC handler: register and call",
    rpcDesc:
      "fn is the same RpcHandlerFn shape accepted by sb.rpc.handle(name, fn, opts) in production (opts.schema isn't needed here — the harness never encodes the payload). invoke() calls fn(req) directly and returns the result; if the handler throws, the error propagates unchanged.",
    rpcErrorNote: "invoke() throws no RPC handler registered for \"...\" if nothing is registered under that name.",

    rpcMockTitle: "Outbound RPC calls: mocks and recordings",
    rpcMockDesc:
      "A handler that itself calls rpc.call(...) is tested through the same harness.",
    rpcMockSig: "harness.rpc.mockResponse(serviceName, methodName, responder: Res | ((payload, opts?) => Res | Promise<Res>)): void",
    rpcMockSig2: "harness.rpc.calls(): readonly { serviceName; methodName; payload; opts? }[]",
    rpcMockCallout:
      "Without a mockResponse(...) for a (serviceName, methodName) pair, call() throws — a forgotten mock fails the test loudly instead of resolving to undefined somewhere downstream.",

    eventsTitle: "Event handler: delivery and ack/nack",
    eventsSig1: "harness.event.handle(pattern: string, fn: (payload: unknown) => Promise<void> | void): void",
    eventsSig2: "harness.event.deliver(name: string, payload: unknown): Promise<{ outcome: \"ack\" } | { outcome: \"nack\"; reason: string }>",
    eventsDesc:
      "deliver() reproduces the production contract of Subscriber.handleDelivery: no handler registered under the exact name → ack (routing lives on the server); a handler throws → nack with String(error); every handler succeeds → ack. Multiple handlers on the same name run in registration order; the first throw stops delivery.",
    eventsRetryTitle: "Modeling a retry",
    eventsRetryDesc:
      "The real EventHandlerFn contract doesn't receive an attempt number (sb.event.handle() has none either), so a test models \"second attempt\" as a second deliver() call and checks each outcome:",

    publishTitle: "Outbound event publish",
    publishSig1: "harness.event.publish<T>(name: string, payload: T, opts?: PublishOpts): Promise<{ eventId: string }>",
    publishSig2: "harness.event.published(): readonly { name; payload; opts? }[]",
    publishDesc:
      "publish() only records the call and returns a fresh eventId — the event name isn't validated and the payload isn't encoded. It's an observation point for what the handler published, not a stand-in for the real Publisher (outbox, schema, gRPC).",

    factoryTitle: "Pattern: a testable handler factory",
    factoryDesc:
      "Handlers that need an outbound channel are written as a factory over a narrow dependency slice, not a closure over a global sb instance.",
    factoryCallout:
      "Pick<RpcDomain, \"call\"> and Pick<EventDomain, \"publish\"> are structural types: harness.rpc / harness.event satisfy them without a cast, because TestRpcDomain.call / TestEventDomain.publish share the exact same method signatures as the production domains.",

    boundariesTitle: "What the harness does not do",
    boundariesRows: [
      { name: "Protobuf encode/decode of the payload", desc: "The handler receives and returns typed objects directly — the same shape its own business logic sees after decoding on the real path." },
      { name: "Wire error mapping (errorCode/errorMessage)", desc: "invoke() propagates the handler's thrown error unchanged, so rejects.toThrow(...) checks the business message." },
      { name: "Streaming RPC (handleStream)", desc: "Out of scope for the current harness; handle/invoke are unary only." },
      { name: "Workflow steps", desc: "The runner requires runtime-side checkpointing (persist/resume/replay) — without a runtime a step can't be committed or replayed honestly." },
      { name: "Event name validation, idempotency, partitioning", desc: "TestEventDomain is a recorder of outbound publishes, not a stand-in for Publisher." },
      { name: "Live gRPC, SQLite outbox", desc: "The harness runs entirely in the test process's memory." },
    ] as { name: string; desc: string }[],

    cheatsheetTitle: "Cheat sheet",
  },
  ru: {
    badge: "Справочник SDK",
    title: "Тестирование хендлеров",
    description:
      "service-bridge/testing даёт createTestHarness() — in-memory двойник sb.rpc и sb.event для юнит-тестирования зарегистрированных RPC- и event-хендлеров без живого рантайма, сети или SQLite.",

    overviewTitle: "Зачем",
    overviewDesc:
      "Зарегистрированный хендлер обычно работает за живым соединением с рантаймом, gRPC-декодированием и (для событий) outbox'ом. Это лишние зависимости для юнит-теста бизнес-логики самого хендлера. Test harness воспроизводит точную поверхность вызова — те же сигнатуры функций-хендлеров, что и в продакшене — целиком в процессе теста, без сети, SQLite или рантайма.",
    overviewCallout:
      "Harness работает с декодированными объектами, не с wire-байтами. Protobuf encode/decode остаётся за рамками теста хендлера — это забота пути schema/CallServer, не логики самого хендлера.",

    installTitle: "Установка и импорт",
    installDesc: "Утилиты тестирования поставляются в основном пакете через subpath-экспорт.",

    modelTitle: "Модель",
    modelRows: [
      { name: "harness.rpc", type: "TestRpcDomain", desc: "handle() / invoke() для входящих RPC; call() / mockResponse() для исходящих RPC" },
      { name: "harness.event", type: "TestEventDomain", desc: "handle() / deliver() для входящих событий; publish() для исходящих событий" },
      { name: "harness.reset()", type: "() => void", desc: "Очищает все хендлеры, моки и записанные вызовы на обоих доменах" },
    ] as { name: string; type: string; desc: string }[],

    rpcTitle: "RPC-хендлер: регистрация и вызов",
    rpcDesc:
      "fn — та же форма RpcHandlerFn, что принимает sb.rpc.handle(name, fn, opts) в продакшене (opts.schema здесь не нужен — harness никогда не кодирует payload). invoke() зовёт fn(req) напрямую и возвращает результат; если хендлер бросает — ошибка пробрасывается без изменений.",
    rpcErrorNote: "invoke() бросает no RPC handler registered for \"...\", если под этим именем ничего не зарегистрировано.",

    rpcMockTitle: "Исходящие RPC-вызовы: моки и записи",
    rpcMockDesc:
      "Хендлер, который сам зовёт rpc.call(...), тестируется через тот же harness.",
    rpcMockSig: "harness.rpc.mockResponse(serviceName, methodName, responder: Res | ((payload, opts?) => Res | Promise<Res>)): void",
    rpcMockSig2: "harness.rpc.calls(): readonly { serviceName; methodName; payload; opts? }[]",
    rpcMockCallout:
      "Без mockResponse(...) для пары (serviceName, methodName) вызов call() бросает — забытый мок валит тест сразу, а не превращается где-то дальше по цепочке в undefined.",

    eventsTitle: "Event-хендлер: доставка и ack/nack",
    eventsSig1: "harness.event.handle(pattern: string, fn: (payload: unknown) => Promise<void> | void): void",
    eventsSig2: "harness.event.deliver(name: string, payload: unknown): Promise<{ outcome: \"ack\" } | { outcome: \"nack\"; reason: string }>",
    eventsDesc:
      "deliver() воспроизводит продакшен-контракт Subscriber.handleDelivery: нет хендлера под точным именем → ack (маршрутизация — на сервере); хендлер бросает → nack с String(error); все хендлеры отработали успешно → ack. Несколько хендлеров на одно имя вызываются в порядке регистрации, первый throw останавливает доставку.",
    eventsRetryTitle: "Моделирование повтора",
    eventsRetryDesc:
      "Реальный контракт EventHandlerFn не получает номер попытки (его нет и в sb.event.handle()), поэтому тест моделирует «вторую попытку» вторым вызовом deliver() и проверяет каждый исход:",

    publishTitle: "Исходящая публикация событий",
    publishSig1: "harness.event.publish<T>(name: string, payload: T, opts?: PublishOpts): Promise<{ eventId: string }>",
    publishSig2: "harness.event.published(): readonly { name; payload; opts? }[]",
    publishDesc:
      "publish() только записывает вызов и возвращает свежий eventId — имя события не валидируется, payload не кодируется. Это точка наблюдения «что хендлер опубликовал», не замена реального Publisher (outbox, schema, gRPC).",

    factoryTitle: "Паттерн: тестируемая фабрика хендлера",
    factoryDesc:
      "Хендлеры, которым нужен исходящий канал, пишутся как фабрика от узкой зависимости, а не как замыкание над глобальным экземпляром sb.",
    factoryCallout:
      "Pick<RpcDomain, \"call\"> и Pick<EventDomain, \"publish\"> — структурные типы: harness.rpc / harness.event подходят под них без каста, потому что у TestRpcDomain.call / TestEventDomain.publish та же сигнатура метода, что и у продакшен-доменов.",

    boundariesTitle: "Чего harness не делает",
    boundariesRows: [
      { name: "Protobuf encode/decode payload-а", desc: "Хендлер получает и возвращает типизированные объекты напрямую — так же, как их видит его собственная бизнес-логика после декодирования на реальном пути." },
      { name: "Wire-маппинг ошибок (errorCode/errorMessage)", desc: "invoke() пробрасывает ошибку хендлера без изменений, чтобы rejects.toThrow(...) проверял бизнес-сообщение." },
      { name: "Streaming RPC (handleStream)", desc: "Не входит в текущий охват harness'а; handle/invoke — только unary." },
      { name: "Workflow-шаги", desc: "Раннеру нужен чекпоинтинг на стороне рантайма (persist/resume/replay) — без рантайма шаг нельзя честно ни закоммитить, ни реплеить." },
      { name: "Валидация имени события, идемпотентность, партиционирование", desc: "TestEventDomain — recorder исходящих публикаций, не замена Publisher." },
      { name: "Живой gRPC, SQLite outbox", desc: "Harness работает целиком в памяти процесса теста." },
    ] as { name: string; desc: string }[],

    cheatsheetTitle: "Шпаргалка",
  },
};

export function PageTestingHandlers() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="overview">{t.overviewTitle}</H2>
      <P>{t.overviewDesc}</P>
      <Callout type="info">{t.overviewCallout}</Callout>

      <H2 id="install">{t.installTitle}</H2>
      <P>{t.installDesc}</P>
      <DocCodeBlock code="bun add service-bridge" lang="bash" />
      <MultiCodeBlock code={{ ts: `import { createTestHarness } from "service-bridge/testing";` }} />

      <H3 id="model">{t.modelTitle}</H3>
      <ParamTable rows={t.modelRows} />

      <H2 id="rpc-handle">{t.rpcTitle}</H2>
      <P>{t.rpcDesc}</P>
      <MultiCodeBlock code={{ ts: RPC_BASIC }} />
      <P>{t.rpcErrorNote}</P>

      <H3 id="rpc-mock">{t.rpcMockTitle}</H3>
      <P>{t.rpcMockDesc}</P>
      <Mono>{t.rpcMockSig}</Mono>
      <div className="mt-1.5">
        <Mono>{t.rpcMockSig2}</Mono>
      </div>
      <MultiCodeBlock code={{ ts: RPC_MOCK }} />
      <Callout type="warning">{t.rpcMockCallout}</Callout>

      <H2 id="event-handle">{t.eventsTitle}</H2>
      <Mono>{t.eventsSig1}</Mono>
      <div className="mt-1.5">
        <Mono>{t.eventsSig2}</Mono>
      </div>
      <P>{t.eventsDesc}</P>
      <MultiCodeBlock code={{ ts: EVENT_BASIC }} />

      <H3 id="event-retry">{t.eventsRetryTitle}</H3>
      <P>{t.eventsRetryDesc}</P>
      <MultiCodeBlock code={{ ts: EVENT_RETRY }} />

      <H2 id="event-publish">{t.publishTitle}</H2>
      <Mono>{t.publishSig1}</Mono>
      <div className="mt-1.5">
        <Mono>{t.publishSig2}</Mono>
      </div>
      <P>{t.publishDesc}</P>
      <MultiCodeBlock code={{ ts: EVENT_PUBLISH }} />

      <H2 id="factory-pattern">{t.factoryTitle}</H2>
      <P>{t.factoryDesc}</P>
      <MultiCodeBlock code={{ ts: FACTORY_PATTERN }} />
      <Callout type="tip">{t.factoryCallout}</Callout>

      <H2 id="boundaries">{t.boundariesTitle}</H2>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <tbody className="text-muted-foreground">
            {t.boundariesRows.map((row) => (
              <tr key={row.name} className="border-b border-border/50">
                <td className="py-2 pr-4 text-foreground text-xs font-medium w-64 shrink-0">{row.name}</td>
                <td className="py-2 text-xs">{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2 id="cheatsheet">{t.cheatsheetTitle}</H2>
      <MultiCodeBlock code={{ ts: CHEATSHEET }} />
    </div>
  );
}
