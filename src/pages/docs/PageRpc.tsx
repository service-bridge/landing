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
      "The caller has to know the method's contract first. In Node you declare it once with sb.useSchema(), or let sb.client() load it for you; in Go the generated request and response types are the contract, so declaring the method with sb.NewMethod is the whole step. Either way every declaration lands before the client goes online.",
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
      "A call fails on transport failure or when the handler answers with an error. A refusal by the runtime's policy is typed: Node throws RpcAccessDeniedError and emits a policy_violation event on the client, Go returns an error that matches sb.ErrAccessDenied.",
    errorsP2:
      "Calling before the client is online fails immediately — \"rpc client not ready\" in Node, CodeState in Go. RPC is not buffered offline: unlike a published event, a call fails fast when the target is unreachable. Use events or workflows for operations that must survive an outage.",

    handleTitle: "sb.rpc.handle() — register a handler",
    handleP:
      "Register a unary handler. The handler receives the decoded request and returns (or resolves to) the response. The SDK runs an inbound mTLS gRPC server for incoming calls; only peers the runtime authorises can reach it. Register all handlers before sb.start().",
    handleSigTitle: "Signature",
    handleSchemaNote:
      "Where the contract comes from differs by SDK. A Node handler declares a schema file (.proto or .schema.json) so the dispatcher can decode the request. A Go handler's request and response types already carry the protobuf descriptor, and the SDK derives the contract hash from it. Either way the load balancer routes by that hash.",

    handleOptsTitle: "Handler options",
    handleOptsP: "RpcHandlerOpts — the third argument to sb.rpc.handle() / sb.rpc.handleStream().",
    hoSchema:
      "Required. Protobuf source for input and output. A ProtoFileSpec ({ protoFile }) or a JsonSchemaFileSpec ({ schemaFile }).",
    hoCapture:
      "Optional per-handler payload-capture override (\"all\" | \"errors\" | \"none\"). May only narrow the runtime-pushed mode, never widen it.",

    streamTitle: "sb.stream() — server streaming",
    streamP1:
      "A streaming handler produces chunks one at a time: in Node it is an async generator registered with sb.rpc.handleStream(), in Go a function that pushes each chunk through a send callback. The caller reads them as they land — a for-await loop over sb.stream() in Node, a plain range over the iterator sb.Stream returns in Go.",
    streamP2:
      "Streaming is single-pick by design: retries are not applied, because replaying mid-stream would re-deliver chunks the caller already received. Leaving the loop cancels the underlying gRPC stream.",
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
      "Where the schema lives depends on the SDK. Node reads a .proto file at runtime: point the handler and the caller at the same file, and the SDK resolves the request and response messages from the service block by method name. Go takes them from the structs protoc generated, so there is no schema file to ship next to the binary.",
    protoP2:
      "Either way the method speaks binary Protobuf on the wire, and the contract hash it produces is what the load balancer matches caller and callee on. Handlers still work with ordinary values of their language — encode/decode is transparent.",
    protoFileTitle: "payment.proto",
    protoTip:
      "Both sides have to agree on the same messages. In Node both reference the same .proto file — the caller through sb.useSchema() (or sb.client(), which does it automatically), the handler through the schema option. In Go both import the same generated package, and the compiler checks the match.",

    schemaHandlerTitle: "Schema: Handler",
    schemaHandlerP:
      "In Node, pass { protoFile } as the schema; with no explicit input/output the SDK resolves them from rpc Charge(ChargeRequest) returns (ChargeResponse) in the service block. A Go handler takes no options at all — its parameter types are the declaration.",
    schemaCallerTitle: "Schema: Caller",
    schemaCallerP:
      "The caller declares the same contract before going online. sb.client() reads the .proto once, registers every service-block method as an outgoing dependency, loads schemas, and returns a typed proxy. sb.NewMethod does that job per method in Go: one call registers the dependency and binds the schema from its type parameters.",

    contextTitle: "RpcContext",
    contextP1:
      "A handler receives the decoded request and nothing else to thread through: (req) => Res | Promise<Res> in Node, func(ctx, req) (Resp, error) in Go, where ctx is the incoming call's context.",
    contextP2:
      "Trace context is automatic. The inbound server runs your handler inside the caller's trace, so any nested call, publish, or workflow start inherits the same trace with no manual plumbing. A handler that fails returns that failure to the caller, recorded on the single RPC.CALL row owned by the caller SDK.",
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
      "Вызывающий сначала должен знать контракт метода. В Node объяви его один раз через sb.useSchema() или дай sb.client() загрузить схемы за тебя; в Go контракт — это сгенерированные типы запроса и ответа, поэтому объявление метода через sb.NewMethod и есть весь шаг. В обоих случаях все объявления делаются до подъёма клиента.",
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
      "Вызов падает при сбое транспорта или когда обработчик отвечает ошибкой. Запрет политикой рантайма типизирован: Node бросает RpcAccessDeniedError и эмиттит событие policy_violation на клиенте, Go возвращает ошибку, совпадающую с sb.ErrAccessDenied.",
    errorsP2:
      "Вызов до того, как клиент поднялся, падает сразу — \"rpc client not ready\" в Node, CodeState в Go. RPC не буферизуется офлайн: в отличие от опубликованного события, вызов падает быстро, если цель недоступна. Для операций, которые должны переживать сбой, используй события или воркфлоу.",

    handleTitle: "sb.rpc.handle() — регистрация обработчика",
    handleP:
      "Регистрирует unary-обработчик. Обработчик получает декодированный запрос и возвращает (или резолвит) ответ. SDK поднимает входящий mTLS gRPC-сервер для вызовов; до него достучатся только пиры, которых авторизует рантайм. Все обработчики регистрируй до sb.start().",
    handleSigTitle: "Сигнатура",
    handleSchemaNote:
      "Откуда берётся контракт — зависит от SDK. Обработчик в Node объявляет файл схемы (.proto или .schema.json), чтобы диспетчер декодировал запрос. У обработчика в Go типы запроса и ответа уже несут protobuf-дескриптор, и SDK выводит из него contract hash. В обоих случаях балансировщик маршрутизирует по этому хешу.",

    handleOptsTitle: "Параметры обработчика",
    handleOptsP: "RpcHandlerOpts — третий аргумент sb.rpc.handle() / sb.rpc.handleStream().",
    hoSchema:
      "Обязательно. Источник Protobuf для входа и выхода. ProtoFileSpec ({ protoFile }) или JsonSchemaFileSpec ({ schemaFile }).",
    hoCapture:
      "Необязательное переопределение захвата payload на обработчик (\"all\" | \"errors\" | \"none\"). Может только сузить режим, пушнутый рантаймом, но не расширить его.",

    streamTitle: "sb.stream() — серверный стриминг",
    streamP1:
      "Стриминговый обработчик отдаёт чанки по одному: в Node это async-генератор, зарегистрированный через sb.rpc.handleStream(), в Go — функция, которая проталкивает каждый чанк через колбэк send. Вызывающий читает их по мере прихода: циклом for-await по sb.stream() в Node и обычным range по итератору, который возвращает sb.Stream в Go.",
    streamP2:
      "Стриминг по дизайну single-pick: повторы не применяются, потому что переигрывание середины стрима ре-доставило бы уже полученные чанки. Выход из цикла отменяет нижележащий gRPC-стрим.",
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
      "Где живёт схема — зависит от SDK. Node читает файл .proto в рантайме: укажи обработчику и вызывающему один и тот же файл, и SDK найдёт сообщения запроса и ответа в блоке service по имени метода. Go берёт их из структур, сгенерированных protoc, поэтому файла схемы рядом с бинарём не нужно.",
    protoP2:
      "В обоих случаях метод говорит бинарным Protobuf на проводе, а полученный contract hash — это то, по чему балансировщик сопоставляет вызывающего и callee. Обработчик всё так же работает с обычными значениями своего языка — кодирование/декодирование прозрачно.",
    protoFileTitle: "payment.proto",
    protoTip:
      "Обе стороны должны сойтись на одних и тех же сообщениях. В Node обе ссылаются на один файл .proto: вызывающий через sb.useSchema() (или sb.client(), который делает это автоматически), обработчик — через опцию schema. В Go обе импортируют один сгенерированный пакет, и совпадение проверяет компилятор.",

    schemaHandlerTitle: "Схема: Обработчик",
    schemaHandlerP:
      "В Node передай { protoFile } как schema: без явных input/output SDK найдёт их в rpc Charge(ChargeRequest) returns (ChargeResponse) в блоке service. Обработчику в Go опции не нужны вовсе — объявление это типы его параметров.",
    schemaCallerTitle: "Схема: Вызывающий",
    schemaCallerP:
      "Вызывающий объявляет тот же контракт до подъёма клиента. sb.client() читает .proto один раз, регистрирует каждый метод service-блока как исходящую зависимость, грузит схемы и возвращает типизированный proxy. В Go ту же работу на каждый метод делает sb.NewMethod: один вызов регистрирует зависимость и связывает схему из параметров типа.",

    contextTitle: "RpcContext",
    contextP1:
      "Обработчик получает декодированный запрос и ничего лишнего: (req) => Res | Promise<Res> в Node и func(ctx, req) (Resp, error) в Go, где ctx — контекст входящего вызова.",
    contextP2:
      "Контекст трассировки — автоматический. Входящий сервер запускает обработчик внутри трейса вызывающего, поэтому любой вложенный вызов, публикация или запуск воркфлоу наследует тот же трейс без ручной возни. Если обработчик отвечает ошибкой, она возвращается вызывающему и записывается в единственную строку RPC.CALL, которой владеет SDK вызывающего.",
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
          go: `func Call[Req, Resp proto.Message](
	ctx context.Context,
	c *sb.Client,
	service, method string,
	req Req,
	opts ...sb.CallOption,
) (Resp, error)`,
        }}
      />

      <H3 id="rpc-call-example">{t.callExampleTitle}</H3>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "service-bridge";

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
          go: `package main

import (
	"context"
	"log"
	"os"
	"time"

	"example.com/gen/paymentpb"
	sb "github.com/service-bridge/sdk/go"
)

func main() {
	c, err := sb.New("localhost:14445", os.Getenv("SERVICEBRIDGE_KEY"), sb.WithCallerOnly())
	if err != nil {
		log.Fatal(err)
	}

	// Declaring the method IS declaring the dependency — before Start.
	payments := sb.NewClient(c, "payments")
	charge, err := sb.NewMethod[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](payments, "Charge")
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	if err := c.Start(ctx); err != nil {
		log.Fatal(err)
	}
	defer func() { _ = c.Stop(ctx) }()

	// Basic call.
	res, err := charge.Call(ctx, &paymentpb.ChargeRequest{UserId: "u-1", Amount: 4990})
	if err != nil {
		log.Fatal(err)
	}
	log.Println(res.GetTransactionId(), res.GetOk())

	// With options: 5s deadline plus an idempotency key.
	charged, err := sb.Call[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](
		ctx, c, "payments", "Charge",
		&paymentpb.ChargeRequest{UserId: "u-1", Amount: 4990},
		sb.WithTimeout(5*time.Second),
		sb.WithIdempotencyKey("order-42"),
	)
	if err != nil {
		log.Fatal(err)
	}
	log.Println(charged.GetOk())
}`,
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
          ts: `import { RpcAccessDeniedError, ServiceBridgeError } from "service-bridge";

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
          go: `_, err := charge.Call(ctx, &paymentpb.ChargeRequest{UserId: "u-1", Amount: 4990})

// *sb.Error is the only error type the SDK returns, so one errors.As is exhaustive.
var sbErr *sb.Error
if errors.As(err, &sbErr) {
	log.Printf("%s failed with %s: %s", sbErr.Op, sbErr.Code, sbErr.Msg)
}

switch {
case errors.Is(err, sb.ErrAccessDenied):
	// The access policy refuses this call.
case errors.Is(err, sb.ErrNoLiveInstance):
	// Nothing serves this contract right now.
case errors.Is(err, sb.ErrHandler):
	// The callee answered with a failure; errors.Unwrap(err) carries it.
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
          go: `func Handle[Req, Resp proto.Message](
	c *sb.Client,
	name string,
	fn func(ctx context.Context, req Req) (Resp, error),
) error`,
        }}
      />
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "service-bridge";

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
          go: `package main

import (
	"context"
	"log"
	"os"

	"example.com/gen/paymentpb"
	sb "github.com/service-bridge/sdk/go"
)

func main() {
	c, err := sb.New("localhost:14445", os.Getenv("SERVICEBRIDGE_KEY"))
	if err != nil {
		log.Fatal(err)
	}

	// Both type parameters are inferred from the function you pass.
	err = sb.Handle(c, "Charge",
		func(ctx context.Context, req *paymentpb.ChargeRequest) (*paymentpb.ChargeReply, error) {
			return &paymentpb.ChargeReply{
				TransactionId: "tx-" + req.GetUserId(),
				Ok:            req.GetAmount() > 0,
			}, nil
		})
	if err != nil {
		log.Fatal(err)
	}

	if err := c.Start(context.Background()); err != nil {
		log.Fatal(err)
	}
	select {}
}`,
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
          go: `// The handler sends through a callback. send blocks while the caller is
// behind — that is the backpressure — and fails once the caller is gone.
err := sb.HandleStream(c, "Stream",
	func(ctx context.Context, req *genpb.GenRequest, send func(*genpb.Token) error) error {
		for i, word := range strings.Fields(req.GetPrompt()) {
			if err := send(&genpb.Token{Text: word, Index: int32(i)}); err != nil {
				return err
			}
		}
		return nil
	})
if err != nil {
	log.Fatal(err)
}`,
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
          go: `// Consume chunks with a plain range. Leaving the loop tears the stream down.
for tok, err := range sb.Stream[*genpb.GenRequest, *genpb.Token](
	ctx, c, "provider", "Stream", &genpb.GenRequest{Prompt: "write a haiku"},
) {
	if err != nil {
		log.Println("stream failed:", err)
		break
	}
	fmt.Println(tok.GetText())
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
          go: `// No schema file and no registration step: the request and response types
// ARE the contract. The SDK reads the protobuf descriptor out of the
// generated struct and derives the JSON Schema and the contract hash from it.
err := sb.Handle(c, "Charge",
	func(ctx context.Context, req *paymentpb.ChargeRequest) (*paymentpb.ChargeReply, error) {
		return &paymentpb.ChargeReply{
			TransactionId: "tx-" + req.GetUserId(),
			Ok:            req.GetAmount() > 0,
		}, nil
	})
if err != nil {
	log.Fatal(err)
}`,
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
          go: `// NewMethod is the whole declaration: it registers the outgoing dependency
// and binds the schema from its type parameters. Both before Start.
payments := sb.NewClient(c, "payments")

charge, err := sb.NewMethod[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](payments, "Charge")
if err != nil {
	log.Fatal(err)
}
generate, err := sb.NewMethod[*genpb.GenRequest, *genpb.Token](payments, "Stream")
if err != nil {
	log.Fatal(err)
}

if err := c.Start(ctx); err != nil {
	log.Fatal(err)
}

res, err := charge.Call(ctx, &paymentpb.ChargeRequest{UserId: "u-1", Amount: 4990})
if err != nil {
	log.Fatal(err)
}
log.Println(res.GetTransactionId())

// A streaming method yields an iter.Seq2 — read it with a plain range.
for tok, err := range generate.Stream(ctx, &genpb.GenRequest{Prompt: "hello"}) {
	if err != nil {
		log.Println(err)
		break
	}
	fmt.Println(tok.GetText())
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
          go: `// The handler is (ctx, req) → (resp, error). Nested work inherits the
// caller's trace through that ctx — there is nothing to thread by hand.
err := sb.Handle(c, "Charge",
	func(ctx context.Context, req *paymentpb.ChargeRequest) (*paymentpb.ChargeReply, error) {
		// This publish runs under the same trace as the incoming call.
		_, err := sb.PublishEvent(ctx, c, "payment.charged",
			&orderpb.PaymentCharged{UserId: req.GetUserId()})
		if err != nil {
			return nil, err
		}
		return &paymentpb.ChargeReply{TransactionId: "tx-" + req.GetUserId(), Ok: true}, nil
	})
if err != nil {
	log.Fatal(err)
}`,
        }}
      />
      <P>{t.contextP2}</P>
      <Callout type="info">{t.contextInfo}</Callout>
    </div>
  );
}
