import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, DocCodeBlock, H2, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const WORKFLOW_YAML = `name: e2e

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_USER: servicebridge
          POSTGRES_PASSWORD: servicebridge
          POSTGRES_DB: service-bridge
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10

    steps:
      - uses: actions/checkout@v4

      - name: Start the ServiceBridge runtime
        run: |
          docker run -d --name sb-runtime --network host \\
            -v "\${{ github.workspace }}:/workspace" \\
            ghcr.io/service-bridge/service-bridge:edge \\
            -pg-url "postgres://servicebridge:servicebridge@localhost:5432/service-bridge?sslmode=disable"

      - name: Wait for :14444 / :14445
        run: |
          until curl -sf http://localhost:14444/ >/dev/null; do sleep 1; done

      - name: Bootstrap admin and provision services
        env:
          SB_PASSWORD: \${{ secrets.SB_CI_PASSWORD }}
        run: |
          docker exec -e SB_PASSWORD sb-runtime sb setup -u admin
          docker exec -e SB_PASSWORD sb-runtime sb apply \\
            -f /workspace/services.yaml --keys-out /workspace/keys.json

      - name: Run SDK tests against the ephemeral runtime
        env:
          SERVICEBRIDGE_URL: localhost:14445
        run: |
          export SERVICE_KEY=$(jq -r '.[] | select(.name=="orders") | .api_key' keys.json)
          bun install
          bun test tests/e2e/

      - name: Teardown
        if: always()
        run: docker rm -f sb-runtime`;

const SERVICES_YAML = `apiVersion: servicebridge.io/v1
kind: ServiceSet
services:
  - name: orders
    capabilities: [RPC_CALL, RPC_HANDLE, EVENTS_HANDLE]
    allow_caller_services: [gateway]
    allow_subscribe_topics: [order.*]

  - name: payments
    capabilities: [RPC_HANDLE, EVENTS_PUBLISH]
    allow_caller_services: [orders]
    allow_publish_topics: [order.*]`;

const TEST_HARNESS_CODE = `import { describe, expect, test } from "bun:test";
import { createTestHarness } from "service-bridge/testing";

describe("Charge handler", () => {
  test("blocks a flagged user", async () => {
    const harness = createTestHarness();
    harness.rpc.mockResponse("fraud-svc", "Check", { blocked: true });
    harness.rpc.handle("Charge", makeChargeHandler(harness));

    await expect(harness.rpc.invoke("Charge", { userId: "u-1", amount: 42 }))
      .rejects.toThrow("user u-1 blocked");
  });

  test("publishes payment.charged on success", async () => {
    const harness = createTestHarness();
    harness.rpc.mockResponse("fraud-svc", "Check", { blocked: false });
    harness.rpc.handle("Charge", makeChargeHandler(harness));

    await harness.rpc.invoke("Charge", { userId: "u-1", amount: 42 });

    expect(harness.event.published()).toEqual([
      { name: "payment.charged", payload: { transactionId: "tx-u-1", amount: 42 } },
    ]);
  });
});`;

const T = {
  en: {
    badge: "CI recipe",
    title: "CI: an ephemeral runtime per pipeline",
    description:
      "Run a real ServiceBridge runtime — one container plus Postgres — for the length of a CI job: provision services declaratively, hand fresh keys to the test step, run the suite against a live gRPC control plane, then throw the whole thing away. No shared staging runtime, no key rotation between runs.",

    overviewTitle: "What it does",
    overviewP1:
      "The recipe below is four pieces: a Postgres service container (GitHub Actions' native services: block), a runtime container started with docker run so it can take the -pg-url flag services: entries can't pass, sb setup + sb apply to bootstrap an admin account and provision services declaratively, and a teardown step that always runs.",
    overviewP2:
      "sb ships in the same image as the runtime binary (see the runtime Dockerfile) — docker exec sb-runtime sb ... runs the CLI inside the already-running container, which defaults to http://127.0.0.1:14444, the runtime's own UI gateway port. No separate CLI image to pull.",
    overviewCallout:
      "A freshly started runtime has zero admin accounts, so SetupStatus reports setup required. There is no dev-only admin/admin seed outside local development — sb setup -u admin (reading the password from SB_PASSWORD) is the CI equivalent, and it logs in as a side effect.",

    workflowTitle: "GitHub Actions workflow",
    workflowP:
      "network: host on the runtime container lets it reach the Postgres service container's published port via localhost — the standard pattern on GitHub's Linux runners. -v mounts the checked-out repo into the container so sb apply -f /workspace/services.yaml can see the manifest, and --keys-out writes generated keys back into the same mount for the test step to read.",

    provisioningTitle: "Provisioning services",
    provisioningP:
      "services.yaml is the same ServiceSet manifest format used by sb apply outside CI — see GitOps & sb apply for the full semantics. --keys-out writes newly created keys to a JSON file instead of stdout, in the shape [{\"name\":...,\"api_key\":...}]:",
    provisioningNote:
      "sb apply is atomic and idempotent: a second run against the same manifest with no changes produces zero writes and zero new keys, so re-running the workflow on a rebuilt Postgres always starts clean, and running it twice against the same runtime without a schema change is a no-op.",

    unitTestsTitle: "Unit tests without a runtime",
    unitTestsP1:
      "The e2e job above spins up a real runtime because it's testing the wire contract. For testing your own handler logic — the RPC/event business logic without a live gRPC connection, SQLite outbox, or Postgres — use service-bridge/testing instead. It's a separate build target (service-bridge/testing in the package's exports map) with no network, no SQLite, no runtime.",
    unitTestsP2:
      "createTestHarness() gives you harness.rpc (handle/invoke for inbound RPC, mockResponse/calls for outbound) and harness.event (handle/deliver for inbound events, publish/published for outbound). Handlers run exactly as registered in production — no Protobuf encode/decode in the loop, since that's the serde layer's job, not the handler's:",
    unitTestsNote:
      "This path needs no CI service containers, no Postgres, no Docker — it runs in the same bun test invocation as any other unit test, which is why it's worth keeping separate from the e2e job: fast feedback on handler logic in every PR, the full ephemeral-runtime job reserved for what actually needs the wire.",
  },
  ru: {
    badge: "Рецепт CI",
    title: "CI: эфемерный рантайм на пайплайн",
    description:
      "Поднимите реальный рантайм ServiceBridge — один контейнер плюс Postgres — на время CI-задачи: декларативно провижиньте сервисы, передайте свежие ключи тестовому шагу, прогоните набор против живого gRPC control plane, затем выбросьте всё целиком. Никакого общего staging-рантайма, никакой ротации ключей между запусками.",

    overviewTitle: "Что делает",
    overviewP1:
      "Рецепт ниже — четыре части: контейнер-сервис Postgres (нативный блок services: GitHub Actions), контейнер рантайма, запущенный через docker run, чтобы можно было передать флаг -pg-url, который блок services: передать не может, sb setup + sb apply для создания admin-аккаунта и декларативного провижининга сервисов, и шаг teardown, который выполняется всегда.",
    overviewP2:
      "sb поставляется в том же образе, что и бинарь рантайма (см. Dockerfile рантайма) — docker exec sb-runtime sb ... запускает CLI внутри уже работающего контейнера, который по умолчанию идёт на http://127.0.0.1:14444, собственный порт UI gateway рантайма. Отдельный образ CLI тянуть не нужно.",
    overviewCallout:
      "У свежезапущенного рантайма ноль admin-аккаунтов, поэтому SetupStatus сообщает о необходимости setup. Dev-only учётки admin/admin вне локальной разработки нет — sb setup -u admin (читает пароль из SB_PASSWORD) — эквивалент для CI, и он же логинится как побочный эффект.",

    workflowTitle: "Workflow GitHub Actions",
    workflowP:
      "network: host на контейнере рантайма даёт ему доступ к опубликованному порту контейнера-сервиса Postgres через localhost — стандартный паттерн на Linux-раннерах GitHub. -v монтирует чекаутнутый репозиторий в контейнер, чтобы sb apply -f /workspace/services.yaml видел манифест, а --keys-out пишет сгенерированные ключи обратно в тот же mount для тестового шага.",

    provisioningTitle: "Провижининг сервисов",
    provisioningP:
      "services.yaml — тот же формат манифеста ServiceSet, что использует sb apply вне CI — полная семантика в GitOps и sb apply. --keys-out пишет новые ключи в JSON-файл вместо stdout, в форме [{\"name\":...,\"api_key\":...}]:",
    provisioningNote:
      "sb apply атомарен и идемпотентен: повторный прогон того же манифеста без изменений даёт ноль записей и ноль новых ключей, поэтому повторный запуск workflow на пересозданном Postgres всегда стартует с чистого состояния, а повторный прогон против того же рантайма без изменения схемы — no-op.",

    unitTestsTitle: "Юнит-тесты без рантайма",
    unitTestsP1:
      "Задача e2e выше поднимает реальный рантайм, потому что тестирует wire-контракт. Для тестирования логики собственных handler'ов — бизнес-логики RPC/event без живого gRPC-соединения, SQLite outbox или Postgres — используйте вместо этого service-bridge/testing. Это отдельная точка сборки (service-bridge/testing в exports пакета) без сети, без SQLite, без рантайма.",
    unitTestsP2:
      "createTestHarness() даёт harness.rpc (handle/invoke для входящих RPC, mockResponse/calls для исходящих) и harness.event (handle/deliver для входящих событий, publish/published для исходящих). Handler'ы выполняются ровно как зарегистрированы в продакшене — без Protobuf encode/decode в цикле, это забота serde-слоя, не handler'а:",
    unitTestsNote:
      "Этот путь не требует CI-сервис-контейнеров, Postgres, Docker — выполняется в том же вызове bun test, что и любой другой юнит-тест, поэтому его стоит держать отдельно от задачи e2e: быстрая обратная связь по логике handler'ов на каждый PR, полная задача с эфемерным рантаймом — только для того, что реально требует wire.",
  },
};

export function PageCi() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="overview">{t.overviewTitle}</H2>
      <P>{t.overviewP1}</P>
      <P>{t.overviewP2}</P>
      <Callout type="info">{t.overviewCallout}</Callout>

      <H2 id="workflow-yaml">{t.workflowTitle}</H2>
      <P>{t.workflowP}</P>
      <DocCodeBlock lang="yaml" code={WORKFLOW_YAML} />

      <H2 id="provisioning">{t.provisioningTitle}</H2>
      <P>{t.provisioningP}</P>
      <DocCodeBlock lang="yaml" code={SERVICES_YAML} />
      <P>{t.provisioningNote}</P>
      <ParamTable
        rows={[
          { name: "sb setup -u admin", type: "CLI", desc: "Creates the first admin account (reads password from SB_PASSWORD or -p) and persists a session." },
          { name: "sb apply -f services.yaml --keys-out FILE", type: "CLI", desc: "Applies the manifest atomically; writes newly created service API keys to FILE as JSON." },
          { name: "-pg-url", type: "runtime flag", desc: "PostgreSQL DSN the runtime binary connects to on boot; not settable via a services: block, hence docker run instead." },
        ]}
      />

      <H2 id="unit-tests">{t.unitTestsTitle}</H2>
      <P>{t.unitTestsP1}</P>
      <P>{t.unitTestsP2}</P>
      <MultiCodeBlock code={{ ts: TEST_HARNESS_CODE }} />
      <Callout type="tip">{t.unitTestsNote}</Callout>
      <P>
        <Mono>createTestHarness()</Mono> · <Mono>service-bridge/testing</Mono> · <Mono>sb apply --keys-out</Mono>
      </P>
    </div>
  );
}
