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

const RPC_BASIC_GO = `package orders_test

import (
	"context"
	"errors"
	"testing"

	"example.com/orders/paymentpb"
	"github.com/service-bridge/sdk/go/sbtest"
)

var errNonPositiveAmount = errors.New("amount must be positive")

func chargeHandler(ctx context.Context, req *paymentpb.ChargeRequest) (*paymentpb.ChargeReply, error) {
	if req.GetAmount() <= 0 {
		return nil, errNonPositiveAmount
	}
	return &paymentpb.ChargeReply{TransactionId: "tx-" + req.GetUserId(), Ok: true}, nil
}

func TestCharge(t *testing.T) {
	h := sbtest.New()
	if err := sbtest.Handle(h.RPC, "Charge", chargeHandler); err != nil {
		t.Fatal(err)
	}

	res, err := sbtest.Invoke[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](
		context.Background(), h.RPC, "Charge",
		&paymentpb.ChargeRequest{UserId: "u-1", Amount: 42})
	if err != nil {
		t.Fatal(err)
	}
	if !res.GetOk() || res.GetTransactionId() != "tx-u-1" {
		t.Fatalf("unexpected reply: %+v", res)
	}

	// The handler's own error comes back unwrapped.
	_, err = sbtest.Invoke[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](
		context.Background(), h.RPC, "Charge",
		&paymentpb.ChargeRequest{UserId: "u-2", Amount: -1})
	if !errors.Is(err, errNonPositiveAmount) {
		t.Fatalf("want errNonPositiveAmount, got %v", err)
	}
}`;

const RPC_MOCK_GO = `// A fixed answer for an outbound call...
if err := sbtest.RespondWith(h.RPC, "fraud-svc", "Check",
	&fraudpb.CheckReply{Blocked: false}); err != nil {
	t.Fatal(err)
}
// ...or one computed from the request.
if err := sbtest.Respond(h.RPC, "fraud-svc", "Check",
	func(ctx context.Context, req *fraudpb.CheckRequest) (*fraudpb.CheckReply, error) {
		return &fraudpb.CheckReply{Blocked: req.GetUserId() == "banned-user"}, nil
	}); err != nil {
	t.Fatal(err)
}

// ... the handler under test calls sbtest.Call(ctx, h.RPC, "fraud-svc", "Check", req)

calls := h.RPC.Calls()
if len(calls) != 1 || calls[0].Service != "fraud-svc" || calls[0].Method != "Check" {
	t.Fatalf("unexpected calls: %+v", calls)
}

// An unarranged call is a refusal, not a zero value.
_, err := sbtest.Call[*fraudpb.CheckRequest, *fraudpb.CheckReply](
	ctx, h.RPC, "fraud-svc", "Score", &fraudpb.CheckRequest{})
if !errors.Is(err, sbtest.ErrNoResponse) {
	t.Fatalf("want ErrNoResponse, got %v", err)
}`;

const EVENT_BASIC_GO = `h := sbtest.New()

// Define is mandatory before Publish.
if err := sbtest.Define[*orderpb.PaymentCharged](h.Event, "payment.charged"); err != nil {
	t.Fatal(err)
}

if err := sbtest.Subscribe(h.Event, "payment.charged",
	func(ctx context.Context, e *orderpb.PaymentCharged) error {
		// must be idempotent — delivery is at-least-once
		return sendReceipt(ctx, e.GetTransactionId())
	}); err != nil {
	t.Fatal(err)
}

delivery, err := sbtest.Publish(ctx, h.Event, "payment.charged",
	&orderpb.PaymentCharged{TransactionId: "tx-1"})
if err != nil {
	t.Fatal(err)
}
if !delivery.Acked {
	t.Fatalf("delivery nacked: %v", delivery.Err)
}`;

const EVENT_RETRY_GO = `h := sbtest.New()
if err := sbtest.Define[*orderpb.PaymentCharged](h.Event, "payment.charged"); err != nil {
	t.Fatal(err)
}

dbDown := true
errDBDown := errors.New("db unavailable")
if err := sbtest.Subscribe(h.Event, "payment.charged",
	func(ctx context.Context, e *orderpb.PaymentCharged) error {
		if dbDown {
			return errDBDown
		}
		return nil
	}); err != nil {
	t.Fatal(err)
}

first, err := sbtest.Publish(ctx, h.Event, "payment.charged", &orderpb.PaymentCharged{})
if err != nil {
	t.Fatal(err)
}
if first.Acked || !errors.Is(first.Err, errDBDown) {
	t.Fatalf("want a nack carrying errDBDown, got %+v", first)
}

dbDown = false
retried, err := sbtest.Publish(ctx, h.Event, "payment.charged", &orderpb.PaymentCharged{})
if err != nil {
	t.Fatal(err)
}
if !retried.Acked {
	t.Fatalf("want an ack, got %+v", retried)
}`;

const EVENT_PUBLISH_GO = `// inside the handler: sbtest.Publish(ctx, h.Event, "payment.charged", charged)

published := h.Event.Published()
if len(published) != 1 || published[0].Name != "payment.charged" {
	t.Fatalf("unexpected publications: %+v", published)
}`;

const FACTORY_PATTERN_GO = `type Ledger interface {
	Debit(ctx context.Context, user string, amount int64) error
}

// The handler is a plain function over a narrow dependency, not a closure over
// a global client — production and the test register the very same function.
func NewChargeHandler(ledger Ledger) func(context.Context, *paymentpb.ChargeRequest) (*paymentpb.ChargeReply, error) {
	return func(ctx context.Context, req *paymentpb.ChargeRequest) (*paymentpb.ChargeReply, error) {
		if err := ledger.Debit(ctx, req.GetUserId(), req.GetAmount()); err != nil {
			return nil, err
		}
		return &paymentpb.ChargeReply{TransactionId: "tx-" + req.GetUserId(), Ok: true}, nil
	}
}

// production
func Register(c *sb.Client, ledger Ledger) error {
	return sb.Handle(c, "Charge", NewChargeHandler(ledger))
}

// test
type stubLedger struct{}

func (stubLedger) Debit(ctx context.Context, user string, amount int64) error { return nil }

func TestChargeAccepts(t *testing.T) {
	h := sbtest.New()
	if err := sbtest.Handle(h.RPC, "Charge", NewChargeHandler(stubLedger{})); err != nil {
		t.Fatal(err)
	}
	res, err := sbtest.Invoke[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](
		context.Background(), h.RPC, "Charge",
		&paymentpb.ChargeRequest{UserId: "u-1", Amount: 42})
	if err != nil {
		t.Fatal(err)
	}
	if !res.GetOk() {
		t.Fatal("expected the charge to be accepted")
	}
}`;

const CHEATSHEET_GO = `h := sbtest.New()

// RPC
if err := sbtest.Handle(h.RPC, "Charge", chargeHandler); err != nil {
	t.Fatal(err)
}
res, err := sbtest.Invoke[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](
	ctx, h.RPC, "Charge", &paymentpb.ChargeRequest{Amount: 1})
if err != nil {
	t.Fatal(err)
}
log.Println(res.GetOk())

if err := sbtest.RespondWith(h.RPC, "other-svc", "Method",
	&fraudpb.CheckReply{Blocked: false}); err != nil {
	t.Fatal(err)
}
// ... the code under test calls sbtest.Call(...)
log.Println(h.RPC.Calls()) // []sbtest.CallRecord

// Events
if err := sbtest.Define[*orderpb.PaymentCharged](h.Event, "payment.charged"); err != nil {
	t.Fatal(err)
}
if err := sbtest.Subscribe(h.Event, "payment.charged", onCharged); err != nil {
	t.Fatal(err)
}
delivery, err := sbtest.Publish(ctx, h.Event, "payment.charged",
	&orderpb.PaymentCharged{TransactionId: "tx-1"})
if err != nil {
	t.Fatal(err)
}
log.Println(delivery.Acked, delivery.Err)

log.Println(h.Event.Published()) // []sbtest.PublishRecord

h.Reset() // clears rpc + event`;

const T = {
  en: {
    badge: "SDK Reference",
    title: "Testing Handlers",
    description:
      "An in-memory double of the RPC and event surfaces, for unit-testing registered handlers without a live runtime, network, or local storage. createTestHarness() from service-bridge/testing in Node, sbtest.New() from the sbtest package in Go.",

    overviewTitle: "Why",
    overviewDesc:
      "A registered handler normally runs behind a live runtime connection, gRPC decode, and (for events) an outbox. That's the wrong dependency for a unit test of the handler's own business logic. The test harness reproduces the exact call surface — same handler function signatures as production — entirely in the test process, with no network, SQLite, or runtime.",
    overviewCallout:
      "The harness works on decoded objects, not wire bytes. Protobuf encode/decode stays out of the handler test — that's the concern of the schema/CallServer path, not the handler's own logic.",

    installTitle: "Install & import",
    installDesc: "The testing utilities ship next to the SDK: a subpath export of the Node package, a sibling package of the Go module.",

    modelTitle: "Model",
    modelRows: [
      { name: "harness.rpc · h.RPC", type: "TestRpcDomain · *sbtest.RPC", desc: "Register and invoke an inbound handler; arrange and record outbound calls" },
      { name: "harness.event · h.Event", type: "TestEventDomain · *sbtest.Event", desc: "Register a subscriber and deliver to it; record outbound publications" },
      { name: "harness.reset() · h.Reset()", type: "() => void", desc: "Clears all handlers, arrangements, and recorded calls on both doubles" },
    ] as { name: string; type: string; desc: string }[],

    rpcTitle: "RPC handler: register and call",
    rpcDesc:
      "The handler is the exact function production registers — sb.rpc.handle(name, fn, opts) in Node, sb.Handle(c, name, fn) in Go. No schema is needed here: the double never encodes the payload. Invoking calls the handler directly and returns its result; a failure propagates unchanged, so the test asserts the business error it wrote.",
    rpcErrorNote: "Invoking a name nothing is registered under fails loudly: no RPC handler registered for \"...\" in Node, sbtest.ErrNoHandler in Go. Go also refuses a duplicate registration with sbtest.ErrDuplicate, the way the runtime refuses a duplicate declaration.",

    rpcMockTitle: "Outbound RPC calls: mocks and recordings",
    rpcMockDesc:
      "A handler that itself calls rpc.call(...) is tested through the same harness.",
    rpcMockSig: "harness.rpc.mockResponse(serviceName, methodName, responder: Res | ((payload, opts?) => Res | Promise<Res>)): void",
    rpcMockSig2: "harness.rpc.calls(): readonly { serviceName; methodName; payload; opts? }[]",
    rpcMockSigGo: "sbtest.RespondWith[Res](r *RPC, service, method string, res Res) error · sbtest.Respond[Req, Res](r *RPC, service, method string, fn Responder[Req, Res]) error",
    rpcMockSigGo2: "func (r *RPC) Calls() []CallRecord{Service, Method, Input}",
    rpcMockCallout:
      "With nothing arranged for a (service, method) pair the outbound call fails — a throw in Node, sbtest.ErrNoResponse in Go. A forgotten arrangement breaks the test loudly instead of turning into an undefined or a zero value somewhere downstream. Go also names a wrong-typed value with ErrTypeMismatch rather than coercing it.",

    eventsTitle: "Event handler: delivery and ack/nack",
    eventsSig1: "harness.event.handle(pattern: string, fn: (payload: unknown) => Promise<void> | void): void",
    eventsSig2: "harness.event.deliver(name: string, payload: unknown): Promise<{ outcome: \"ack\" } | { outcome: \"nack\"; reason: string }>",
    eventsSigGo1: "sbtest.Define[T](e *Event, name string) error · sbtest.Subscribe[T](e *Event, name string, fn Subscriber[T]) error",
    eventsSigGo2: "sbtest.Publish[T](ctx, e *Event, name string, payload T) (Delivery{Name, Acked, Err}, error)",
    eventsDesc:
      "Delivering reproduces the production contract: no handler registered under the exact name → ack, because routing lives on the server; a handler fails → nack carrying that failure; every handler succeeds → ack. Multiple handlers on the same name run in registration order and the first failure stops the delivery. In Go a publish is the delivery, and declaring the name with Define first is mandatory — the runtime rejects a publish for an event that was never registered.",
    eventsRetryTitle: "Modeling a retry",
    eventsRetryDesc:
      "A subscriber never receives an attempt number — the real handler contract has none — so a test models the second attempt as a second delivery and checks each outcome:",

    publishTitle: "Outbound event publish",
    publishSig1: "harness.event.publish<T>(name: string, payload: T, opts?: PublishOpts): Promise<{ eventId: string }>",
    publishSig2: "harness.event.published(): readonly { name; payload; opts? }[]",
    publishSigGo1: "sbtest.Publish[T](ctx, e *Event, name string, payload T) (Delivery, error)",
    publishSigGo2: "func (e *Event) Published() []PublishRecord{Name, Payload} · func (e *Event) Deliveries() []Delivery",
    publishDesc:
      "Publishing on the double records the call and hands the payload to the local subscribers — nothing is encoded and no outbox is involved. It is an observation point for what the handler published, not a stand-in for the real publisher.",

    factoryTitle: "Pattern: a testable handler factory",
    factoryDesc:
      "Handlers that need an outbound channel are written as a factory over a narrow dependency, not a closure over a global client. Production and the test then register the very same function.",
    factoryCallout:
      "In Node the dependency is a structural type — Pick<RpcDomain, \"call\"> and Pick<EventDomain, \"publish\"> — which harness.rpc and harness.event satisfy without a cast, because the doubles share the production method signatures. In Go the dependency is an interface of your own, and the compiler checks that production and the test both satisfy it.",

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
      "In-memory двойник RPC- и event-поверхностей для юнит-тестирования зарегистрированных хендлеров без живого рантайма, сети и локального хранилища. createTestHarness() из service-bridge/testing в Node и sbtest.New() из пакета sbtest в Go.",

    overviewTitle: "Зачем",
    overviewDesc:
      "Зарегистрированный хендлер обычно работает за живым соединением с рантаймом, gRPC-декодированием и (для событий) outbox'ом. Это лишние зависимости для юнит-теста бизнес-логики самого хендлера. Test harness воспроизводит точную поверхность вызова — те же сигнатуры функций-хендлеров, что и в продакшене — целиком в процессе теста, без сети, SQLite или рантайма.",
    overviewCallout:
      "Harness работает с декодированными объектами, не с wire-байтами. Protobuf encode/decode остаётся за рамками теста хендлера — это забота пути schema/CallServer, не логики самого хендлера.",

    installTitle: "Установка и импорт",
    installDesc: "Утилиты тестирования лежат рядом с SDK: subpath-экспорт в Node-пакете и соседний пакет в Go-модуле.",

    modelTitle: "Модель",
    modelRows: [
      { name: "harness.rpc · h.RPC", type: "TestRpcDomain · *sbtest.RPC", desc: "Регистрация и вызов входящего хендлера; заготовка ответов и запись исходящих вызовов" },
      { name: "harness.event · h.Event", type: "TestEventDomain · *sbtest.Event", desc: "Регистрация подписчика и доставка ему; запись исходящих публикаций" },
      { name: "harness.reset() · h.Reset()", type: "() => void", desc: "Очищает все хендлеры, заготовки и записанные вызовы на обоих двойниках" },
    ] as { name: string; type: string; desc: string }[],

    rpcTitle: "RPC-хендлер: регистрация и вызов",
    rpcDesc:
      "Хендлер — ровно та функция, которую регистрирует продакшен: sb.rpc.handle(name, fn, opts) в Node и sb.Handle(c, name, fn) в Go. Схема здесь не нужна — двойник не кодирует payload. Вызов зовёт хендлер напрямую и возвращает результат; сбой пробрасывается без изменений, так что тест проверяет ту бизнес-ошибку, которую вы написали.",
    rpcErrorNote: "Вызов имени, под которым ничего не зарегистрировано, падает громко: no RPC handler registered for \"...\" в Node и sbtest.ErrNoHandler в Go. Go к тому же отвергает повторную регистрацию через sbtest.ErrDuplicate — так же, как рантайм отвергает дубликат декларации.",

    rpcMockTitle: "Исходящие RPC-вызовы: моки и записи",
    rpcMockDesc:
      "Хендлер, который сам зовёт rpc.call(...), тестируется через тот же harness.",
    rpcMockSig: "harness.rpc.mockResponse(serviceName, methodName, responder: Res | ((payload, opts?) => Res | Promise<Res>)): void",
    rpcMockSig2: "harness.rpc.calls(): readonly { serviceName; methodName; payload; opts? }[]",
    rpcMockSigGo: "sbtest.RespondWith[Res](r *RPC, service, method string, res Res) error · sbtest.Respond[Req, Res](r *RPC, service, method string, fn Responder[Req, Res]) error",
    rpcMockSigGo2: "func (r *RPC) Calls() []CallRecord{Service, Method, Input}",
    rpcMockCallout:
      "Если для пары (service, method) ничего не заготовлено, исходящий вызов падает: исключение в Node и sbtest.ErrNoResponse в Go. Забытая заготовка валит тест сразу, а не превращается где-то дальше по цепочке в undefined или нулевое значение. Go к тому же называет значение неверного типа через ErrTypeMismatch, а не приводит его молча.",

    eventsTitle: "Event-хендлер: доставка и ack/nack",
    eventsSig1: "harness.event.handle(pattern: string, fn: (payload: unknown) => Promise<void> | void): void",
    eventsSig2: "harness.event.deliver(name: string, payload: unknown): Promise<{ outcome: \"ack\" } | { outcome: \"nack\"; reason: string }>",
    eventsSigGo1: "sbtest.Define[T](e *Event, name string) error · sbtest.Subscribe[T](e *Event, name string, fn Subscriber[T]) error",
    eventsSigGo2: "sbtest.Publish[T](ctx, e *Event, name string, payload T) (Delivery{Name, Acked, Err}, error)",
    eventsDesc:
      "Доставка воспроизводит продакшен-контракт: нет хендлера под точным именем → ack, потому что маршрутизация живёт на сервере; хендлер упал → nack с этим сбоем; все хендлеры отработали успешно → ack. Несколько хендлеров на одно имя вызываются в порядке регистрации, первый сбой останавливает доставку. В Go доставкой является сама публикация, а объявление имени через Define обязательно: рантайм отвергает публикацию события, которое никогда не регистрировали.",
    eventsRetryTitle: "Моделирование повтора",
    eventsRetryDesc:
      "Подписчик никогда не получает номер попытки — его нет в реальном контракте хендлера, — поэтому тест моделирует «вторую попытку» второй доставкой и проверяет каждый исход:",

    publishTitle: "Исходящая публикация событий",
    publishSig1: "harness.event.publish<T>(name: string, payload: T, opts?: PublishOpts): Promise<{ eventId: string }>",
    publishSig2: "harness.event.published(): readonly { name; payload; opts? }[]",
    publishSigGo1: "sbtest.Publish[T](ctx, e *Event, name string, payload T) (Delivery, error)",
    publishSigGo2: "func (e *Event) Published() []PublishRecord{Name, Payload} · func (e *Event) Deliveries() []Delivery",
    publishDesc:
      "Публикация на двойнике записывает вызов и отдаёт payload локальным подписчикам — ничего не кодируется и outbox не участвует. Это точка наблюдения «что хендлер опубликовал», а не замена реального Publisher.",

    factoryTitle: "Паттерн: тестируемая фабрика хендлера",
    factoryDesc:
      "Хендлеры, которым нужен исходящий канал, пишутся как фабрика от узкой зависимости, а не как замыкание над глобальным клиентом. Тогда продакшен и тест регистрируют одну и ту же функцию.",
    factoryCallout:
      "В Node зависимость — структурный тип: Pick<RpcDomain, \"call\"> и Pick<EventDomain, \"publish\">, под которые harness.rpc и harness.event подходят без каста, потому что у двойников те же сигнатуры методов, что у продакшен-доменов. В Go зависимость — ваш собственный интерфейс, и компилятор проверяет, что и продакшен, и тест ему удовлетворяют.",

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
      <MultiCodeBlock
        code={{
          ts: `import { createTestHarness } from "service-bridge/testing";`,
          go: `import "github.com/service-bridge/sdk/go/sbtest"`,
        }}
      />

      <H3 id="model">{t.modelTitle}</H3>
      <ParamTable rows={t.modelRows} />

      <H2 id="rpc-handle">{t.rpcTitle}</H2>
      <P>{t.rpcDesc}</P>
      <MultiCodeBlock code={{ ts: RPC_BASIC, go: RPC_BASIC_GO }} />
      <P>{t.rpcErrorNote}</P>

      <H3 id="rpc-mock">{t.rpcMockTitle}</H3>
      <P>{t.rpcMockDesc}</P>
      <Mono>{t.rpcMockSig}</Mono>
      <div className="mt-1.5">
        <Mono>{t.rpcMockSig2}</Mono>
      </div>
      <div className="mt-1.5">
      </div>
      <div className="mt-1.5">
      </div>
      <MultiCodeBlock code={{ ts: RPC_MOCK, go: RPC_MOCK_GO }} />
      <Callout type="warning">{t.rpcMockCallout}</Callout>

      <H2 id="event-handle">{t.eventsTitle}</H2>
      <Mono>{t.eventsSig1}</Mono>
      <div className="mt-1.5">
        <Mono>{t.eventsSig2}</Mono>
      </div>
      <div className="mt-1.5">
      </div>
      <div className="mt-1.5">
      </div>
      <P>{t.eventsDesc}</P>
      <MultiCodeBlock code={{ ts: EVENT_BASIC, go: EVENT_BASIC_GO }} />

      <H3 id="event-retry">{t.eventsRetryTitle}</H3>
      <P>{t.eventsRetryDesc}</P>
      <MultiCodeBlock code={{ ts: EVENT_RETRY, go: EVENT_RETRY_GO }} />

      <H2 id="event-publish">{t.publishTitle}</H2>
      <Mono>{t.publishSig1}</Mono>
      <div className="mt-1.5">
        <Mono>{t.publishSig2}</Mono>
      </div>
      <div className="mt-1.5">
      </div>
      <div className="mt-1.5">
      </div>
      <P>{t.publishDesc}</P>
      <MultiCodeBlock code={{ ts: EVENT_PUBLISH, go: EVENT_PUBLISH_GO }} />

      <H2 id="factory-pattern">{t.factoryTitle}</H2>
      <P>{t.factoryDesc}</P>
      <MultiCodeBlock code={{ ts: FACTORY_PATTERN, go: FACTORY_PATTERN_GO }} />
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
      <MultiCodeBlock code={{ ts: CHEATSHEET, go: CHEATSHEET_GO }} />
    </div>
  );
}
