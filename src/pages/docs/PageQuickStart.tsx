// keywords: servicebridge quick-start getting-started bun add service-bridge npm i service-bridge RPC gRPC microservices Node.js TypeScript SDK distributed-tracing mTLS service-mesh zero-sidecar proto schema sb.rpc.handle sb.rpc.call sb.client

import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, DocCodeBlock, H2, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Getting Started",
    title: "Quick Start",
    description: "From zero to a working RPC call between two services in about five minutes.",

    installTitle: "Install the SDK",
    installP: "The SDK is one package. Add it to your project:",
    installNote:
      "The SDK speaks gRPC to a running runtime on port 14445. No runtime yet? See Installation. The dashboard lives at http://localhost:14444.",

    workerTitle: "Create a worker",
    workerP1:
      "A worker handles incoming RPC calls. Its contract is the pair of Protobuf messages the handler takes and returns — write them in one .proto file and share it between the services that speak to each other.",
    workerProtoCaption: "payment.proto — the shared contract",
    workerP2:
      "Register a handler under a method name, then start the client to provision a certificate, connect, and begin taking requests. The request and response messages are the schema the runtime routes by.",
    workerFileCaption: "payment-svc.ts",
    workerSchemaNote:
      "Register every handler before you start the client; anything declared after start never reaches the runtime. The Node SDK reads the schema from the .proto or .schema.json file you point it at; the Go SDK reads it from the generated message types, so there is no file to ship and no service block to write.",

    callTitle: "Call it from another service",
    callP1:
      "Any service with a valid key calls a registered method directly over mTLS, with no broker, sidecar, or proxy in the path. The shortest caller is a typed client bound to the same contract:",
    callClientCaption: "checkout-svc.ts — typed client",
    callClientCaptionGo: "checkout-svc.go — typed client",
    callP2:
      "The typed client wraps one by-name call. Address the method by name directly when a declared client is more than you need:",
    callRawCaption: "Call by name",
    callKeyNote:
      "Each service authenticates with its own bootstrap key. Create one per service in the dashboard, then pass it to the constructor. Read it from your app's own environment, never hard-code it.",
    tipCallout:
      "Every call here is traced for you. Open the dashboard at http://localhost:14444 to see the full timeline: RPC spans, durations, and captured payloads.",
  },
  ru: {
    badge: "Начало работы",
    title: "Быстрый старт",
    description: "От нуля до рабочего RPC-вызова между двумя сервисами примерно за пять минут.",

    installTitle: "Установка SDK",
    installP: "SDK — один пакет. Добавьте его в проект:",
    installNote:
      "SDK говорит с рантаймом по gRPC на порту 14445. Рантайма ещё нет? Смотрите раздел «Установка». Панель управления — на http://localhost:14444.",

    workerTitle: "Создание воркера",
    workerP1:
      "Воркер обрабатывает входящие RPC-вызовы. Его контракт — пара Protobuf-сообщений, которые обработчик принимает и возвращает. Опишите их в одном .proto-файле и разделяйте между сервисами, которые общаются друг с другом.",
    workerProtoCaption: "payment.proto — общий контракт",
    workerP2:
      "Зарегистрируйте обработчик под именем метода, затем запустите клиент: он выпустит сертификат, подключится и начнёт принимать запросы. Сообщения запроса и ответа — это и есть схема, по которой рантайм маршрутизирует.",
    workerFileCaption: "payment-svc.ts",
    workerSchemaNote:
      "Регистрируйте все обработчики до запуска клиента; всё, что объявлено после, до рантайма не доходит. Node SDK читает схему из .proto или .schema.json-файла, на который вы указываете; Go SDK берёт её из сгенерированных типов сообщений — файл рядом с бинарём не нужен, блок service писать не нужно.",

    callTitle: "Вызов из другого сервиса",
    callP1:
      "Любой сервис с действующим ключом вызывает зарегистрированный метод напрямую по mTLS, без брокера, sidecar и прокси на пути. Самый короткий вызывающий — типизированный клиент, привязанный к тому же контракту:",
    callClientCaption: "checkout-svc.ts — типизированный клиент",
    callClientCaptionGo: "checkout-svc.go — типизированный клиент",
    callP2:
      "Типизированный клиент оборачивает один вызов по имени. Обращайтесь к методу по имени напрямую, когда объявленный клиент избыточен:",
    callRawCaption: "Вызов по имени",
    callKeyNote:
      "Каждый сервис аутентифицируется своим bootstrap-ключом. Создайте по ключу на сервис в панели и передайте его в конструктор. Читайте ключ из окружения своего приложения, не зашивайте в код.",
    tipCallout:
      "Каждый вызов здесь трассируется сам. Откройте панель на http://localhost:14444 и увидите всю временную шкалу: RPC-спаны, длительности и захваченные payload.",
  },
};

export function PageQuickStart() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="install-sdk">{t.installTitle}</H2>
      <P>{t.installP}</P>
      <MultiCodeBlock
        code={{
          ts: `bun add service-bridge
# or
npm i service-bridge`,
          go: `go get github.com/service-bridge/sdk/go`,
        }}
      />
      <Callout type="info">{t.installNote}</Callout>

      <H2 id="create-worker">{t.workerTitle}</H2>
      <P>{t.workerP1}</P>
      <DocCodeBlock
        lang="ts"
        code={`// payment.proto
syntax = "proto3";

service PaymentService {
  rpc Charge(ChargeRequest) returns (ChargeResponse);
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
      <P>{t.workerP2}</P>
      <MultiCodeBlock
        filename={t.workerFileCaption}
        code={{
          go: `package main

import (
	"context"
	"log"
	"os"

	"example.com/gen/paymentpb"
	sb "github.com/service-bridge/sdk/go"
)

func main() {
	c, err := sb.New(
		"localhost:14445",
		os.Getenv("PAYMENT_KEY"), // this service's own bootstrap key
	)
	if err != nil {
		log.Fatal(err)
	}

	// The request and response types are the contract: the SDK reads the
	// protobuf descriptor straight out of the generated struct.
	err = sb.Handle(c, "Charge",
		func(ctx context.Context, req *paymentpb.ChargeRequest) (*paymentpb.ChargeResponse, error) {
			return &paymentpb.ChargeResponse{
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
	log.Println("payment online:", c.Identity().ServiceName)
}`,
          ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge(
  "localhost:14445",
  process.env.PAYMENT_KEY!, // this service's own bootstrap key
);

sb.rpc.handle<
  { userId: string; amount: number },
  { transactionId: string; ok: boolean }
>(
  "Charge",
  async (req) => ({
    transactionId: \`tx-\${req.userId}\`,
    ok: req.amount > 0,
  }),
  { schema: { protoFile: "./payment.proto" } }, // input/output auto from the service block
);

await sb.start();
console.log("payment online:", sb.identity()?.serviceName);`,
        }}
      />
      <Callout type="warning">{t.workerSchemaNote}</Callout>

      <H2 id="call-rpc">{t.callTitle}</H2>
      <P>{t.callP1}</P>
      <MultiCodeBlock
        filename={{ ts: t.callClientCaption, go: t.callClientCaptionGo }}
        code={{
          ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge(
  "localhost:14445",
  process.env.CHECKOUT_KEY!, // this service's own bootstrap key
);

// One line: declares the outgoing dep, loads the schema, returns a typed proxy.
// Must run before start().
const payment = await sb.client("payment-svc", "./payment.proto");

await sb.start();

const result = await payment.Charge({ userId: "u-42", amount: 100 });
console.log(result); // { transactionId: "tx-u-42", ok: true }

await sb.stop();`,
          go: `package main

import (
	"context"
	"log"
	"os"

	"example.com/gen/paymentpb"
	sb "github.com/service-bridge/sdk/go"
)

func main() {
	c, err := sb.New(
		"localhost:14445",
		os.Getenv("CHECKOUT_KEY"), // this service's own bootstrap key
		sb.WithCallerOnly(),       // outbound only: no inbound handlers here
	)
	if err != nil {
		log.Fatal(err)
	}

	// Two lines: declare the outgoing dependency and bind the schema from the
	// type parameters. Both must run before Start.
	payment := sb.NewClient(c, "payment-svc")
	charge, err := sb.NewMethod[*paymentpb.ChargeRequest, *paymentpb.ChargeResponse](payment, "Charge")
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	if err := c.Start(ctx); err != nil {
		log.Fatal(err)
	}
	defer func() { _ = c.Stop(ctx) }()

	res, err := charge.Call(ctx, &paymentpb.ChargeRequest{UserId: "u-42", Amount: 100})
	if err != nil {
		log.Fatal(err)
	}
	log.Println(res.GetTransactionId(), res.GetOk()) // tx-u-42 true
}`,
        }}
      />
      <P>{t.callP2}</P>
      <MultiCodeBlock
        filename={t.callRawCaption}
        code={{
          ts: `const result = await sb.rpc.call<
  { userId: string; amount: number },
  { transactionId: string; ok: boolean }
>("payment-svc", "Charge", { userId: "u-42", amount: 100 }, { timeout: "10s" });

console.log(result.transactionId);`,
          go: `res, err := sb.Call[*paymentpb.ChargeRequest, *paymentpb.ChargeResponse](
	ctx, c, "payment-svc", "Charge",
	&paymentpb.ChargeRequest{UserId: "u-42", Amount: 100},
	sb.WithTimeout(10*time.Second),
)
if err != nil {
	log.Fatal(err)
}
log.Println(res.GetTransactionId())`,
        }}
      />
      <Callout type="info">{t.callKeyNote}</Callout>

      <Callout type="tip">{t.tipCallout}</Callout>
    </div>
  );
}
