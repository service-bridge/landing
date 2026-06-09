import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  DocCodeBlock,
  H2,
  H3,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "SDK Reference",
    title: "RPC",
    description:
      "Direct service-to-service calls over mTLS gRPC. The runtime resolves the target from its in-memory registry, balances across live instances, and retries transient failures — no broker, no sidecar proxy.",

    callTitle: "sb.rpc.call() — call a handler",
    callP1:
      "Call a unary handler registered on another service by its method name. You pass the target service, the method, and a JSON-serialisable payload. The SDK encodes the payload, picks a live instance, and returns the decoded response.",
    callP2:
      "Before a method can be called, the caller must know its schema. Declare it once with sb.useSchema() (or use sb.client(), which loads schemas for you). All declarations happen before sb.start().",
    callSigTitle: "Signature",
    callExampleTitle: "Example",
    callInfo:
      "Service discovery is in-memory — there is no SQL on the call path. If the target has no live instance that matches the caller's contract, the call fails immediately rather than hanging until the timeout.",

    optsTitle: "CallOpts",
    optsP:
      "Per-call options, merged over the client-wide callDefaults. Every field is optional.",
    optTimeout:
      "Per-attempt deadline. Format: digits + ms / s / m, e.g. \"500ms\", \"10s\", \"2m\". An invalid string throws.",
    optRequestId: "Request id propagated to the transport. Auto-generated UUID v4 if omitted.",
    optTransport:
      "\"direct\" = caller → callee mTLS (errors if the callee has no endpoint); \"proxy\" = routed via the runtime Invoke; \"auto\" = direct when the endpoint is known, else proxy.",
    optIdempotency:
      "Opts into runtime-side dedup. Replays of the same key within its TTL return the cached response. With a key set, INTERNAL / ABORTED / UNKNOWN errors also become retryable.",
    optRetry: "Retry-policy override (Partial<RetryOpts>). Not applied to streaming.",
    retryTitle: "RetryOpts defaults",
    retryP:
      "Retries use exponential backoff with jitter. Defaults below; override per call via opts.retry. Set maxAttempts: 1 to disable retries.",
    retMaxAttempts: "Max attempts. 1 disables retry.",
    retBaseDelay: "Base backoff delay, ms.",
    retFactor: "Exponential multiplier: baseDelayMs × factor^attempt.",
    retMaxDelay: "Backoff ceiling, ms.",
    retJitter: "Random jitter fraction in [0, 1].",
    retryNote:
      "Retryable codes: UNAVAILABLE, RESOURCE_EXHAUSTED, DEADLINE_EXCEEDED are always retried. INTERNAL, ABORTED, UNKNOWN are retried only when an idempotencyKey is set. Errors thrown by the handler itself are never retried.",

    errorsTitle: "Error handling",
    errorsP1:
      "A call rejects with a normal Error on transport failure or when the handler throws. If the runtime's policy denies the call, the SDK throws a typed RpcAccessDeniedError and emits a policy_violation event on the client.",
    errorsP2:
      "Calling before sb.start() has connected throws \"rpc client not ready\". RPC is not buffered offline — unlike sb.event.publish(), a call fails fast when the target is unreachable. Use events or workflows for operations that must survive an outage.",

    handleTitle: "sb.rpc.handle() — register a handler",
    handleP:
      "Register a unary handler. The handler receives the decoded request and returns (or resolves to) the response. The SDK runs an inbound mTLS gRPC server for incoming calls; only peers the runtime authorises can reach it. Register all handlers before sb.start().",
    handleSigTitle: "Signature",
    handleSchemaNote:
      "schema is required: every RPC handler declares a schema (a .proto file or a .schema.json file) so the dispatcher can decode the request and the load balancer can route by contract hash.",

    handleOptsTitle: "Handler options",
    handleOptsP: "RpcHandlerOpts — the third argument to sb.rpc.handle() / sb.rpc.handleStream().",
    hoSchema:
      "Required. Protobuf source for input and output. A ProtoFileSpec ({ protoFile }) or a JsonSchemaFileSpec ({ schemaFile }).",
    hoCapture:
      "Optional per-handler payload-capture override (\"all\" | \"errors\" | \"none\"). May only narrow the runtime-pushed mode, never widen it.",

    streamTitle: "sb.stream() — server streaming",
    streamP1:
      "A streaming handler is registered with sb.rpc.handleStream() and returns an async generator that yields chunks. The caller consumes them with sb.stream() and a for-await loop.",
    streamP2:
      "Streaming is single-pick by design: retries are not applied, because replaying mid-stream would re-deliver chunks the caller already received. Breaking the for-await loop cancels the underlying gRPC stream.",
    streamHandlerTitle: "Handler side",
    streamCallerTitle: "Caller side",

    aclTitle: "Access control",
    aclP1:
      "Who may call a handler is decided by the runtime from service-key policy, not by a handler option. There are two gates: an egress gate on the caller (rpc.call) and an acceptance gate on the callee (rpc.handle). Both default to allow; narrowing a key's allow-list restricts it.",
    aclP2:
      "Direct calls are also checked on the callee: the inbound server extracts the caller's identity from its verified mTLS certificate and enforces the acceptance rule locally before the handler runs. A denied call surfaces as RpcAccessDeniedError on the caller.",
    aclNote:
      "Configure allow-lists per service key in the dashboard or via the service-keys API — see the Service Keys & RBAC page. There is no allowedCallers field on sb.rpc.handle().",

    protoTitle: "Protobuf schema",
    protoP1:
      "Schemas come from a file, not from inline objects in code. Point a handler (and the caller) at the same .proto file. The SDK resolves the request and response messages from the service block by method name.",
    protoP2:
      "A schema switches that method to binary Protobuf on the wire; the contract hash it produces is what the load balancer matches caller and callee on. The handler still works with plain JS objects — encode/decode is transparent.",
    protoFileTitle: "payment.proto",
    protoTip:
      "Both sides reference the same .proto file. The caller declares the schema with sb.useSchema() (or sb.client(), which does it automatically); the handler declares it via the schema option.",

    schemaHandlerTitle: "Schema: Handler",
    schemaHandlerP:
      "Pass { protoFile } as the schema. With no explicit input/output, the SDK resolves them from rpc Charge(ChargeRequest) returns (ChargeResponse) in the service block.",
    schemaCallerTitle: "Schema: Caller",
    schemaCallerP:
      "The caller declares the same schema before start(). sb.client() reads the .proto once, registers every service-block method as an outgoing dependency, loads schemas, and returns a typed proxy.",

    contextTitle: "RpcContext",
    contextP1:
      "A handler receives a single argument: the decoded request. There is no context object to thread through — RpcHandlerFn is (req) => Res | Promise<Res>.",
    contextP2:
      "Trace context is automatic. The inbound server runs your handler inside the caller's trace, so any nested sb.rpc.call(), sb.event.publish(), or sb.workflow.start() inherits the same trace with no manual plumbing. If a handler throws, the error is returned to the caller and recorded on the single RPC.CALL row owned by the caller SDK.",
    contextInfo:
      "Need to emit your own spans or logs inside a handler? Use sb.telemetry — see the Manual Spans and Distributed Tracing pages.",
  },
  ru: {
    badge: "SDK Reference",
    title: "RPC",
    description:
      "Прямые вызовы сервис-к-сервису по mTLS gRPC. Рантайм находит цель в реестре в памяти, балансирует по живым инстансам и повторяет временные сбои — без брокера, без sidecar-прокси.",

    callTitle: "sb.rpc.call() — вызов обработчика",
    callP1:
      "Вызывает unary-обработчик другого сервиса по имени метода. Передаёшь целевой сервис, метод и JSON-сериализуемый payload. SDK кодирует payload, выбирает живой инстанс и возвращает декодированный ответ.",
    callP2:
      "Чтобы вызвать метод, вызывающий должен знать его схему. Объяви её один раз через sb.useSchema() (или используй sb.client(), который грузит схемы за тебя). Все объявления — до sb.start().",
    callSigTitle: "Сигнатура",
    callExampleTitle: "Пример",
    callInfo:
      "Обнаружение сервисов работает в памяти — на пути вызова нет SQL. Если у цели нет живого инстанса, подходящего под контракт вызывающего, вызов падает сразу, а не висит до тайм-аута.",

    optsTitle: "CallOpts",
    optsP:
      "Опции на вызов, накладываются поверх клиентских callDefaults. Все поля необязательны.",
    optTimeout:
      "Дедлайн на попытку. Формат: цифры + ms / s / m, например \"500ms\", \"10s\", \"2m\". Невалидная строка бросает ошибку.",
    optRequestId: "Идентификатор запроса, прокидывается в транспорт. Авто UUID v4, если не задан.",
    optTransport:
      "\"direct\" = вызывающий → callee по mTLS (ошибка, если у callee нет endpoint); \"proxy\" = через runtime Invoke; \"auto\" = direct, если endpoint известен, иначе proxy.",
    optIdempotency:
      "Включает дедуп на стороне рантайма. Повтор с тем же ключом в пределах TTL возвращает кешированный ответ. С заданным ключом коды INTERNAL / ABORTED / UNKNOWN тоже становятся retryable.",
    optRetry: "Переопределение retry-политики (Partial<RetryOpts>). К стримингу не применяется.",
    retryTitle: "Дефолты RetryOpts",
    retryP:
      "Повторы используют экспоненциальный backoff с jitter. Дефолты ниже; переопределяй на вызов через opts.retry. maxAttempts: 1 отключает повторы.",
    retMaxAttempts: "Максимум попыток. 1 отключает retry.",
    retBaseDelay: "Базовая задержка backoff, мс.",
    retFactor: "Экспоненциальный множитель: baseDelayMs × factor^attempt.",
    retMaxDelay: "Потолок задержки, мс.",
    retJitter: "Доля случайного jitter в [0, 1].",
    retryNote:
      "Retryable-коды: UNAVAILABLE, RESOURCE_EXHAUSTED, DEADLINE_EXCEEDED повторяются всегда. INTERNAL, ABORTED, UNKNOWN — только если задан idempotencyKey. Ошибки, брошенные самим обработчиком, не повторяются никогда.",

    errorsTitle: "Обработка ошибок",
    errorsP1:
      "Вызов реджектится обычной Error при сбое транспорта или когда обработчик бросает ошибку. Если политика рантайма запрещает вызов, SDK бросает типизированную RpcAccessDeniedError и эмиттит событие policy_violation на клиенте.",
    errorsP2:
      "Вызов до того, как sb.start() подключился, бросает \"rpc client not ready\". RPC не буферизуется офлайн — в отличие от sb.event.publish(), вызов падает быстро, если цель недоступна. Для операций, которые должны переживать сбой, используй события или воркфлоу.",

    handleTitle: "sb.rpc.handle() — регистрация обработчика",
    handleP:
      "Регистрирует unary-обработчик. Обработчик получает декодированный запрос и возвращает (или резолвит) ответ. SDK поднимает входящий mTLS gRPC-сервер для вызовов; до него достучатся только пиры, которых авторизует рантайм. Все обработчики регистрируй до sb.start().",
    handleSigTitle: "Сигнатура",
    handleSchemaNote:
      "schema обязательна: каждый RPC-обработчик объявляет схему (файл .proto или .schema.json), чтобы диспетчер декодировал запрос, а балансировщик маршрутизировал по contract hash.",

    handleOptsTitle: "Параметры обработчика",
    handleOptsP: "RpcHandlerOpts — третий аргумент sb.rpc.handle() / sb.rpc.handleStream().",
    hoSchema:
      "Обязательно. Источник Protobuf для входа и выхода. ProtoFileSpec ({ protoFile }) или JsonSchemaFileSpec ({ schemaFile }).",
    hoCapture:
      "Необязательное переопределение захвата payload на обработчик (\"all\" | \"errors\" | \"none\"). Может только сузить режим, пушнутый рантаймом, но не расширить его.",

    streamTitle: "sb.stream() — серверный стриминг",
    streamP1:
      "Стриминговый обработчик регистрируется через sb.rpc.handleStream() и возвращает async-генератор, отдающий чанки. Вызывающий потребляет их через sb.stream() и цикл for-await.",
    streamP2:
      "Стриминг по дизайну single-pick: повторы не применяются, потому что переигрывание середины стрима ре-доставило бы уже полученные чанки. Выход из цикла for-await отменяет нижележащий gRPC-стрим.",
    streamHandlerTitle: "Сторона обработчика",
    streamCallerTitle: "Сторона вызывающего",

    aclTitle: "Контроль доступа",
    aclP1:
      "Кто может вызвать обработчик, решает рантайм по политике сервисного ключа, а не опция обработчика. Есть два гейта: egress-гейт на вызывающем (rpc.call) и acceptance-гейт на callee (rpc.handle). Оба по умолчанию разрешают; сужение allow-листа ключа ограничивает доступ.",
    aclP2:
      "Direct-вызовы дополнительно проверяются на callee: входящий сервер извлекает identity вызывающего из его проверенного mTLS-сертификата и применяет acceptance-правило локально до запуска обработчика. Запрещённый вызов прилетает к вызывающему как RpcAccessDeniedError.",
    aclNote:
      "Allow-листы настраиваются на сервисный ключ в дашборде или через API сервисных ключей — см. страницу Сервисные ключи и RBAC. Поля allowedCallers у sb.rpc.handle() нет.",

    protoTitle: "Protobuf-схема",
    protoP1:
      "Схемы берутся из файла, а не из inline-объектов в коде. Укажи обработчику (и вызывающему) один и тот же файл .proto. SDK резолвит сообщения запроса и ответа из блока service по имени метода.",
    protoP2:
      "Схема переключает метод на бинарный Protobuf на проводе; полученный contract hash — это то, по чему балансировщик сопоставляет вызывающего и callee. Обработчик всё так же работает с обычными JS-объектами — кодирование/декодирование прозрачно.",
    protoFileTitle: "payment.proto",
    protoTip:
      "Обе стороны ссылаются на один файл .proto. Вызывающий объявляет схему через sb.useSchema() (или sb.client(), который делает это автоматически); обработчик — через опцию schema.",

    schemaHandlerTitle: "Схема: Обработчик",
    schemaHandlerP:
      "Передай { protoFile } как schema. Без явных input/output SDK резолвит их из rpc Charge(ChargeRequest) returns (ChargeResponse) в блоке service.",
    schemaCallerTitle: "Схема: Вызывающий",
    schemaCallerP:
      "Вызывающий объявляет ту же схему до start(). sb.client() читает .proto один раз, регистрирует каждый метод service-блока как исходящую зависимость, грузит схемы и возвращает типизированный proxy.",

    contextTitle: "RpcContext",
    contextP1:
      "Обработчик получает один аргумент — декодированный запрос. Прокидывать объект контекста не нужно: RpcHandlerFn — это (req) => Res | Promise<Res>.",
    contextP2:
      "Контекст трассировки — автоматический. Входящий сервер запускает обработчик внутри трейса вызывающего, поэтому любой вложенный sb.rpc.call(), sb.event.publish() или sb.workflow.start() наследует тот же трейс без ручной возни. Если обработчик бросает ошибку, она возвращается вызывающему и записывается в единственную строку RPC.CALL, которой владеет SDK вызывающего.",
    contextInfo:
      "Нужно эмиттить собственные спаны или логи внутри обработчика? Используй sb.telemetry — см. страницы Ручные спаны и Распределённая трассировка.",
  },
};

export function PageRpc() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      {/* ── sb.rpc.call() ─────────────────────────────────────────── */}
      <H2 id="rpc-call">{t.callTitle}</H2>
      <P>{t.callP1}</P>
      <P>{t.callP2}</P>

      <H3 id="rpc-call-sig">{t.callSigTitle}</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.rpc.call<Req, Res>(
  service: string,
  method: string,
  payload: Req,
  opts?: CallOpts,
): Promise<Res>`,
        }}
      />

      <H3 id="rpc-call-example">{t.callExampleTitle}</H3>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "servicebridge";

const sb = new ServiceBridge("localhost:14445", serviceKey);

// Declare the target schema before start().
await sb.useSchema("payments", "Charge", { protoFile: "./payment.proto" });
await sb.start();

// Basic call.
const res = await sb.rpc.call<
  { userId: string; amount: number },
  { transactionId: string; ok: boolean }
>("payments", "Charge", { userId: "u-1", amount: 4990 });

// With options: 1 retry total (no retry), 5s deadline, idempotency key.
const charged = await sb.rpc.call(
  "payments",
  "Charge",
  { userId: "u-1", amount: 4990 },
  {
    timeout: "5s",
    idempotencyKey: "order-42",
    retry: { maxAttempts: 1 },
  },
);`,
        }}
      />
      <Callout type="info">{t.callInfo}</Callout>

      {/* ── CallOpts ──────────────────────────────────────────────── */}
      <H2 id="rpc-opts">{t.optsTitle}</H2>
      <P>{t.optsP}</P>
      <ParamTable
        rows={[
          { name: "timeout", type: "string", default: '"30s"', desc: t.optTimeout },
          { name: "requestId", type: "string", default: "auto UUID v4", desc: t.optRequestId },
          {
            name: "transport",
            type: '"direct" | "proxy" | "auto"',
            default: '"auto"',
            desc: t.optTransport,
          },
          { name: "idempotencyKey", type: "string", default: '""', desc: t.optIdempotency },
          { name: "retry", type: "Partial<RetryOpts>", default: "defaults", desc: t.optRetry },
        ]}
      />

      <H3 id="rpc-retry-opts">{t.retryTitle}</H3>
      <P>{t.retryP}</P>
      <ParamTable
        rows={[
          { name: "maxAttempts", type: "number", default: "3", desc: t.retMaxAttempts },
          { name: "baseDelayMs", type: "number", default: "200", desc: t.retBaseDelay },
          { name: "factor", type: "number", default: "2", desc: t.retFactor },
          { name: "maxDelayMs", type: "number", default: "5000", desc: t.retMaxDelay },
          { name: "jitter", type: "number", default: "0.3", desc: t.retJitter },
        ]}
      />
      <Callout type="info">{t.retryNote}</Callout>

      {/* ── Error handling ────────────────────────────────────────── */}
      <H2 id="rpc-errors">{t.errorsTitle}</H2>
      <P>{t.errorsP1}</P>
      <MultiCodeBlock
        code={{
          ts: `import { RpcAccessDeniedError, ServiceBridgeError } from "servicebridge";

try {
  await sb.rpc.call("payments", "Charge", { userId: "u-1", amount: 4990 });
} catch (err) {
  if (err instanceof RpcAccessDeniedError) {
    // Policy denied the call. err.serviceName / err.methodName / err.reason.
    console.error("denied", err.serviceName, err.methodName, err.reason);
  } else if (err instanceof ServiceBridgeError) {
    console.error("call failed", err.message);
  }
  throw err;
}`,
        }}
      />
      <P>{t.errorsP2}</P>

      {/* ── sb.rpc.handle() ───────────────────────────────────────── */}
      <H2 id="handle-rpc">{t.handleTitle}</H2>
      <P>{t.handleP}</P>

      <H3 id="handle-rpc-sig">{t.handleSigTitle}</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.rpc.handle<Req, Res>(
  name: string,
  fn: (req: Req) => Res | Promise<Res>,
  opts: RpcHandlerOpts,   // { schema } — required
): void`,
        }}
      />
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "servicebridge";

const sb = new ServiceBridge("localhost:14445", serviceKey);

sb.rpc.handle<
  { userId: string; amount: number },
  { transactionId: string; ok: boolean }
>(
  "Charge",
  async (req) => ({
    transactionId: \`tx-\${req.userId}\`,
    ok: req.amount > 0,
  }),
  { schema: { protoFile: "./payment.proto" } },
);

await sb.start();`,
        }}
      />
      <Callout type="info">{t.handleSchemaNote}</Callout>

      {/* ── Handler options ───────────────────────────────────────── */}
      <H2 id="handle-opts">{t.handleOptsTitle}</H2>
      <P>{t.handleOptsP}</P>
      <ParamTable
        rows={[
          { name: "schema", type: "SchemaSpec", desc: t.hoSchema },
          {
            name: "captureMode",
            type: '"all" | "errors" | "none"',
            default: "runtime-pushed",
            desc: t.hoCapture,
          },
        ]}
      />

      {/* ── sb.stream() — server streaming ────────────────────────── */}
      <H2 id="handle-streaming">{t.streamTitle}</H2>
      <P>{t.streamP1}</P>
      <P>{t.streamP2}</P>

      <H3 id="handle-streaming-handler">{t.streamHandlerTitle}</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.rpc.handleStream<{ count: number }, { i: number }>(
  "Stream",
  async function* (req) {
    for (let i = 0; i < req.count; i++) {
      yield { i };
    }
  },
  { schema: { protoFile: "./payment.proto" } },
);`,
        }}
      />

      <H3 id="handle-streaming-caller">{t.streamCallerTitle}</H3>
      <MultiCodeBlock
        code={{
          ts: `// Consume chunks with for-await. Breaking the loop cancels the stream.
for await (const chunk of sb.stream<{ count: number }, { i: number }>(
  "provider",
  "Stream",
  { count: 5 },
)) {
  console.log(chunk.i);
}`,
        }}
      />

      {/* ── Access control ────────────────────────────────────────── */}
      <H2 id="handle-acl">{t.aclTitle}</H2>
      <P>{t.aclP1}</P>
      <P>{t.aclP2}</P>
      <Callout type="info">{t.aclNote}</Callout>

      {/* ── Protobuf schema ───────────────────────────────────────── */}
      <H2 id="protobuf-schema">{t.protoTitle}</H2>
      <P>{t.protoP1}</P>
      <P>{t.protoP2}</P>

      <H3 id="protobuf-schema-file">{t.protoFileTitle}</H3>
      <DocCodeBlock
        lang="ts"
        code={`syntax = "proto3";

service PaymentService {
  rpc Charge(ChargeRequest) returns (ChargeResponse);
  rpc Stream(StreamRequest) returns (stream StreamChunk);
}

message ChargeRequest {
  string user_id = 1;
  double amount   = 2;
}

message ChargeResponse {
  string transaction_id = 1;
  bool   ok             = 2;
}`}
      />
      <Callout type="tip">{t.protoTip}</Callout>

      {/* ── Schema: Handler ───────────────────────────────────────── */}
      <H2 id="schema-handler">{t.schemaHandlerTitle}</H2>
      <P>{t.schemaHandlerP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.rpc.handle(
  "Charge",
  async (req: { userId: string; amount: number }) => ({
    transactionId: \`tx-\${req.userId}\`,
    ok: req.amount > 0,
  }),
  // No input/output — resolved from the service block by method name.
  { schema: { protoFile: "./payment.proto" } },
);`,
        }}
      />

      {/* ── Schema: Caller ────────────────────────────────────────── */}
      <H2 id="schema-caller">{t.schemaCallerTitle}</H2>
      <P>{t.schemaCallerP}</P>
      <MultiCodeBlock
        code={{
          ts: `// Option A: declare one method's schema explicitly.
await sb.useSchema("payments", "Charge", { protoFile: "./payment.proto" });

// Option B: typed proxy — loads all methods, registers deps, returns callables.
const payments = await sb.client("payments", "./payment.proto");
await sb.start();

const res = await payments.Charge({ userId: "u-1", amount: 4990 });

// A streaming method (returns stream …) becomes an AsyncIterable automatically.
for await (const chunk of payments.Stream({ count: 5 })) {
  console.log(chunk.i);
}`,
        }}
      />

      {/* ── RpcContext ────────────────────────────────────────────── */}
      <H2 id="rpc-context">{t.contextTitle}</H2>
      <P>{t.contextP1}</P>
      <MultiCodeBlock
        code={{
          ts: `// The handler signature is just (req) => Res. Nested calls inherit the trace.
sb.rpc.handle(
  "Charge",
  async (req: { userId: string; amount: number }) => {
    // This nested call runs under the same trace as the incoming call.
    await sb.event.publish("payment.charged", { userId: req.userId });
    return { transactionId: \`tx-\${req.userId}\`, ok: true };
  },
  { schema: { protoFile: "./payment.proto" } },
);`,
        }}
      />
      <P>{t.contextP2}</P>
      <Callout type="info">{t.contextInfo}</Callout>
    </div>
  );
}
