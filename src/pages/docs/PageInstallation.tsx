// keywords: servicebridge service-bridge install installation Docker Compose self-hosted runtime PostgreSQL one-line installer mTLS gRPC control plane 14444 14445 ghcr.io one-binary zero-sidecar proxyless production-ready

import {
  Callout,
  DocCodeBlock,
  H2,
  H3,
  Mono,
  P,
  PageHeader,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Getting Started",
    title: "Installation",
    description:
      "ServiceBridge is one container plus PostgreSQL. It stands in for a service mesh, a message broker, and a workflow engine at once, and you run it on your own machines.",

    option1Title: "Option 1 — One-line installer",
    option1P1Before: "You need",
    option1P1Mid: "and the Compose plugin. Then run one command:",
    option1P2:
      "No prompts, nothing to choose: the script installs the newest published version, whatever it is — alpha, beta or stable.",
    channelOverrideP:
      "Want a specific version instead of the latest? Pin it — still no prompts:",
    channelOverrideCallout:
      "SB_VERSION installs an exact tag (e.g. 2.0.0-alpha) instead of the latest build. SB_IMAGE overrides the image reference entirely. The script prints the version it actually installed, read from the image label.",
    afterInstallP0:
      "The script writes a docker-compose file with a private Postgres and the runtime, brings both up, waits until the runtime reports ready, and prints the dashboard URL.",
    afterInstallP1: "The dashboard opens at",
    afterInstallP1Mid: "and SDKs reach the gRPC control plane at",
    afterInstallP1After: ".",
    afterInstallP2:
      "There is no default login. Open the dashboard and the Setup flow walks you through creating the first admin account. After that, every knob lives in the web UI under /settings — ports, retention, timeouts, TLS, payload capture, alerts. You never touch a config file.",
    caCallout:
      "The runtime is stateless — it keeps no files, all state (including its self-signed CA) lives in Postgres. SDKs receive the CA inside their bootstrap key, so there are no certificate files to manage and nothing to export.",

    option2Title: "Option 2 — Write the Compose file yourself",
    option2P:
      "Want full control over the deployment? Write the Compose file by hand. This is the exact file the installer generates.",
    step1Title: "Step 1 — Create docker-compose.yml",
    step1P:
      "Two services: a Postgres instance and the runtime. The runtime ships with a baked-in connection string that matches this Postgres, so it needs no configuration block at all. Postgres publishes no host port — it lives on the internal network only, reachable by the runtime and nothing else.",
    step2Title: "Step 2 — Start it",
    step2P: "Bring both containers up:",
    step2Callout: "Ports map as host:container. Change only the host side. Inside the container the runtime always listens on",
    step2CalloutMid: "for HTTP and the UI, and",
    step2CalloutAfter: "for the gRPC control plane.",
    pgCallout:
      "Point the runtime at a different database with the -pg-url flag, the only flag it takes. Everything else is configured live in the dashboard, never on the command line.",

    manageTitle: "Manage after install",
    manageP: "Run these from the install directory:",

    tipCalloutPrefix: "Runtime up?",
    tipCalloutLinkText: "Next: Quick Start →",
    tipCallout: "Install the SDK and make your first RPC call in a few minutes.",
  },
  ru: {
    badge: "Начало работы",
    title: "Установка",
    description:
      "ServiceBridge — это один контейнер плюс PostgreSQL. Он заменяет сразу service mesh, брокер сообщений и движок воркфлоу, а крутится на ваших серверах.",

    option1Title: "Вариант 1 — Установщик одной командой",
    option1P1Before: "Понадобится",
    option1P1Mid: "и плагин Compose. Дальше — одна команда:",
    option1P2:
      "Никаких вопросов и выбора: скрипт ставит самую свежую опубликованную версию — какой бы она ни была: alpha, beta или стабильной.",
    channelOverrideP:
      "Нужна конкретная версия вместо последней? Зафиксируйте — тоже без вопросов:",
    channelOverrideCallout:
      "SB_VERSION ставит точный тег (например 2.0.0-alpha) вместо последней сборки. SB_IMAGE полностью переопределяет образ. Скрипт печатает версию, которую реально поставил, прочитав её из метки образа.",
    afterInstallP0:
      "Скрипт пишет docker-compose с приватным Postgres и рантаймом, поднимает оба контейнера, ждёт готовности рантайма и печатает адрес панели.",
    afterInstallP1: "Панель открывается на",
    afterInstallP1Mid: "а SDK ходят в gRPC плоскость управления на",
    afterInstallP1After: ".",
    afterInstallP2:
      "Логина по умолчанию нет. Откройте панель — флоу Setup проведёт через создание первой учётки администратора. После этого все настройки живут в веб-интерфейсе на /settings: порты, retention, таймауты, TLS, захват payload, алерты. Конфиг-файлы трогать не нужно.",
    caCallout:
      "Рантайм stateless — не держит файлов, всё состояние (включая само-подписанный CA) живёт в Postgres. SDK получают CA прямо из своего bootstrap-ключа, поэтому никаких сертификат-файлов вести и выгружать не нужно.",

    option2Title: "Вариант 2 — Compose-файл вручную",
    option2P:
      "Нужен полный контроль над развёртыванием? Напишите Compose-файл сами. Это ровно тот файл, что генерирует установщик.",
    step1Title: "Шаг 1 — Создайте docker-compose.yml",
    step1P:
      "Два сервиса: Postgres и рантайм. У рантайма строка подключения уже вшита в бинарь под этот Postgres, поэтому блок конфигурации ему вообще не нужен. Postgres не публикует хостовый порт — живёт только во внутренней сети, доступен рантайму и больше никому.",
    step2Title: "Шаг 2 — Запуск",
    step2P: "Поднимите оба контейнера:",
    step2Callout: "Порты задаются как host:container — меняйте только хостовую часть. Внутри контейнера рантайм всегда слушает",
    step2CalloutMid: "для HTTP и UI, и",
    step2CalloutAfter: "для gRPC плоскости управления.",
    pgCallout:
      "Указать другую базу можно флагом -pg-url — единственным, который принимает рантайм. Всё остальное настраивается вживую в панели, а не в командной строке.",

    manageTitle: "Управление после установки",
    manageP: "Команды выполняются из директории установки:",

    tipCalloutPrefix: "Рантайм поднят?",
    tipCalloutLinkText: "Далее: Быстрый старт →",
    tipCallout: "Установите SDK и сделайте первый RPC-вызов за пару минут.",
  },
};

export function PageInstallation() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="option-1">{t.option1Title}</H2>
      <P>
        {t.option1P1Before} <Mono>docker</Mono> {t.option1P1Mid}
      </P>
      <DocCodeBlock lang="bash" code={`bash <(curl -fsSL https://servicebridge.dev/install.sh)`} />
      <P>{t.option1P2}</P>

      <P>{t.channelOverrideP}</P>
      <DocCodeBlock
        lang="bash"
        code={`SB_VERSION=2.0.0-alpha bash <(curl -fsSL https://servicebridge.dev/install.sh)   # pin an exact version
SB_IMAGE=ghcr.io/service-bridge/service-bridge:edge bash <(curl -fsSL https://servicebridge.dev/install.sh)   # full override`}
      />
      <Callout type="info">{t.channelOverrideCallout}</Callout>

      <P>{t.afterInstallP0}</P>

      <P>
        {t.afterInstallP1} <Mono>http://localhost:14444</Mono> {t.afterInstallP1Mid}{" "}
        <Mono>localhost:14445</Mono>
        {t.afterInstallP1After}
      </P>
      <P>{t.afterInstallP2}</P>
      <Callout type="info">{t.caCallout}</Callout>

      <H2 id="option-2">{t.option2Title}</H2>
      <P>{t.option2P}</P>

      <H3 id="compose-file">{t.step1Title}</H3>
      <P>{t.step1P}</P>
      <DocCodeBlock
        lang="yaml"
        code={`services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: service-bridge
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - service-bridge-pg:/var/lib/postgresql
    networks:
      - service-bridge-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d service-bridge"]
      interval: 10s
      timeout: 3s
      retries: 10

  service-bridge:
    image: ghcr.io/service-bridge/service-bridge:alpha
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "14444:14444"
      - "14445:14445"
    networks:
      - service-bridge-internal
      - service-bridge-external

networks:
  service-bridge-internal:
    driver: bridge
  service-bridge-external:
    driver: bridge

volumes:
  service-bridge-pg:`}
      />
      <Callout type="info">
        {t.pgCallout}
      </Callout>

      <H3 id="start">{t.step2Title}</H3>
      <P>{t.step2P}</P>
      <DocCodeBlock lang="bash" code={`docker compose up -d`} />
      <Callout type="info">
        <Mono>ports</Mono> {t.step2Callout} <Mono>14444</Mono> {t.step2CalloutMid}{" "}
        <Mono>14445</Mono> {t.step2CalloutAfter}
      </Callout>

      <H2 id="manage">{t.manageTitle}</H2>
      <P>{t.manageP}</P>
      <DocCodeBlock
        lang="bash"
        code={`cd ~/servicebridge
docker compose logs -f service-bridge          # follow logs
docker compose restart service-bridge          # restart
docker compose pull && docker compose up -d   # update
docker compose down                           # stop`}
      />

      <Callout type="tip">
        {t.tipCalloutPrefix}{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer font-medium"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("sb-nav", { detail: "quick-start" }))
          }
        >
          {t.tipCalloutLinkText}
        </button>{" "}
        {t.tipCallout}
      </Callout>
    </div>
  );
}
