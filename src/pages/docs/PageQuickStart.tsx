// keywords: servicebridge quick-start getting-started bun add service-bridge npm i service-bridge RPC gRPC microservices Node.js TypeScript SDK distributed-tracing mTLS service-mesh zero-sidecar proto schema sb.rpc.handle sb.rpc.call sb.client

import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Getting Started",
    title: "Quick Start",
    description: "From zero to a working RPC call between two services in about five minutes.",

    installTitle: "Install the SDK",
    installP: "The Node SDK is one package. Install it with Bun or npm:",
    installNote:
      "The SDK speaks gRPC to a running runtime on port 14445. No runtime yet? See Installation. The dashboard lives at http://localhost:14444.",

    workerTitle: "Create a worker",
    workerP1:
      "A worker handles incoming RPC calls. Its contract is one .proto file with a service block, which gives you both the method signature and the payload schema in one place.",
    workerProtoCaption: "payment.proto — the shared contract",
    workerP2Pre: "Register a handler with",
    workerP2Mid: ". Every handler takes a",
    workerP2Post:
      "option pointing at the .proto file; ServiceBridge resolves the input and output messages from the service block. Then call",
    workerP2End: "to provision a cert, connect, and start taking requests.",
    workerFileCaption: "payment-svc.ts",
    workerSchemaNote:
      "Schemas come from a .proto or .schema.json file. There is no inline JSON-Schema in code. Register every handler before start(); anything declared after start() never reaches the runtime.",

    callTitle: "Call it from another service",
    callP1:
      "Any service with a valid key calls a registered method directly over mTLS, with no broker, sidecar, or proxy in the path. The shortest caller is a typed client built from the same .proto:",
    callClientCaption: "checkout-svc.ts — typed client",
    callP2Pre: "The typed client wraps",
    callP2Post:
      ". Skip the client and call by name when you don't need the types:",
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
    installP: "Node SDK — один пакет. Поставьте его через Bun или npm:",
    installNote:
      "SDK говорит с рантаймом по gRPC на порту 14445. Рантайма ещё нет? Смотрите раздел «Установка». Панель управления — на http://localhost:14444.",

    workerTitle: "Создание воркера",
    workerP1:
      "Воркер обрабатывает входящие RPC-вызовы. Его контракт — один .proto-файл с блоком service, где сразу заданы и сигнатура метода, и схема payload.",
    workerProtoCaption: "payment.proto — общий контракт",
    workerP2Pre: "Зарегистрируйте обработчик через",
    workerP2Mid: ". Каждому обработчику нужна опция",
    workerP2Post:
      ", указывающая на .proto-файл; ServiceBridge сам находит сообщения input и output в блоке service. Затем вызовите",
    workerP2End: ", чтобы выпустить сертификат, подключиться и начать принимать запросы.",
    workerFileCaption: "payment-svc.ts",
    workerSchemaNote:
      "Схемы берутся из .proto или .schema.json-файла. Инлайн JSON-Schema в коде нет. Регистрируйте все обработчики до start(); всё, что объявлено после, до рантайма не доходит.",

    callTitle: "Вызов из другого сервиса",
    callP1:
      "Любой сервис с действующим ключом вызывает зарегистрированный метод напрямую по mTLS, без брокера, sidecar и прокси на пути. Самый короткий вызывающий — типизированный клиент из того же .proto:",
    callClientCaption: "checkout-svc.ts — типизированный клиент",
    callP2Pre: "Типизированный клиент оборачивает",
    callP2Post:
      ". Без клиента можно вызвать по имени, когда типы не нужны:",
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
      <P>
        {t.workerP2Pre} <Mono>sb.rpc.handle()</Mono>
        {t.workerP2Mid} <Mono>schema</Mono> {t.workerP2Post} <Mono>sb.start()</Mono>{" "}
        {t.workerP2End}
      </P>
      <MultiCodeBlock
        filename={t.workerFileCaption}
        code={{
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
        filename={t.callClientCaption}
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
        }}
      />
      <P>
        {t.callP2Pre} <Mono>sb.rpc.call(service, method, payload, opts?)</Mono>
        {t.callP2Post}
      </P>
      <MultiCodeBlock
        filename={t.callRawCaption}
        code={{
          ts: `const result = await sb.rpc.call<
  { userId: string; amount: number },
  { transactionId: string; ok: boolean }
>("payment-svc", "Charge", { userId: "u-42", amount: 100 }, { timeout: "10s" });

console.log(result.transactionId);`,
        }}
      />
      <Callout type="info">{t.callKeyNote}</Callout>

      <Callout type="tip">{t.tipCallout}</Callout>
    </div>
  );
}
