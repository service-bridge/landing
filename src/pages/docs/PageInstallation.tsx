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
      "The script probes the registry for the channels that currently have an image and, in a terminal, shows a numbered menu: stable (latest), rc, beta, alpha, edge — each tag always points at the newest build in its lane. Pressing Enter takes the default (stable if published). Piped through curl with no terminal, it picks that default silently and keeps the one-command flow.",
    channelOverrideP:
      "Skip the menu with environment variables, never prompted:",
    channelOverrideCallout:
      "SB_CHANNEL pins a moving lane (latest, rc, beta, alpha, edge) — you keep getting its newest build on every pull. SB_VERSION pins an exact tag and never moves. After the pull the script prints the resolved version read from the image label.",
    afterInstallP0:
      "Once an image is chosen the script writes a docker-compose file with a Postgres sibling and the runtime, brings both up, exports the control-plane CA for local SDKs, and prints the dashboard URL.",
    afterInstallP1: "The dashboard opens at",
    afterInstallP1Mid: "and SDKs reach the gRPC control plane at",
    afterInstallP1After: ".",
    afterInstallP2:
      "There is no default login. Open the dashboard and the Setup flow walks you through creating the first admin account. After that, every knob lives in the web UI under /settings — ports, retention, timeouts, TLS, payload capture, alerts. You never touch a config file.",
    caCallout:
      "The installer drops the control-plane CA at ~/.servicebridge/ca.crt so SDKs on the same host trust the runtime certificate. If the export gets skipped, the script prints the copy command for you.",

    option2Title: "Option 2 — Write the Compose file yourself",
    option2P:
      "Want full control over the deployment? Write the Compose file by hand. This is the exact file the installer generates.",
    step1Title: "Step 1 — Create docker-compose.yml",
    step1P:
      "Two services: a Postgres instance and the runtime. The runtime ships with a baked-in connection string that matches this Postgres, so it needs no configuration block at all.",
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
      "Скрипт опрашивает реестр и узнаёт, у каких каналов сейчас есть образ, и в терминале показывает нумерованное меню: stable (latest), rc, beta, alpha, edge — каждый тег всегда указывает на свежайшую сборку своей дорожки. Enter выбирает значение по умолчанию (stable, если опубликован). Если запущено через curl без терминала, скрипт молча берёт этот дефолт и сохраняет установку одной командой.",
    channelOverrideP:
      "Пропустить меню можно переменными окружения — без вопросов:",
    channelOverrideCallout:
      "SB_CHANNEL фиксирует подвижную дорожку (latest, rc, beta, alpha, edge) — при каждом pull прилетает её свежайшая сборка. SB_VERSION фиксирует точный тег, который не двигается. После pull скрипт печатает реальную версию, прочитанную из метки образа.",
    afterInstallP0:
      "Когда образ выбран, скрипт пишет docker-compose с Postgres и рантаймом рядом, поднимает оба контейнера, выгружает CA плоскости управления для локальных SDK и печатает адрес панели.",
    afterInstallP1: "Панель открывается на",
    afterInstallP1Mid: "а SDK ходят в gRPC плоскость управления на",
    afterInstallP1After: ".",
    afterInstallP2:
      "Логина по умолчанию нет. Откройте панель — флоу Setup проведёт через создание первой учётки администратора. После этого все настройки живут в веб-интерфейсе на /settings: порты, retention, таймауты, TLS, захват payload, алерты. Конфиг-файлы трогать не нужно.",
    caCallout:
      "Установщик кладёт CA плоскости управления в ~/.servicebridge/ca.crt, чтобы SDK на том же хосте доверяли сертификату рантайма. Если выгрузка не прошла, скрипт печатает команду для ручного копирования.",

    option2Title: "Вариант 2 — Compose-файл вручную",
    option2P:
      "Нужен полный контроль над развёртыванием? Напишите Compose-файл сами. Это ровно тот файл, что генерирует установщик.",
    step1Title: "Шаг 1 — Создайте docker-compose.yml",
    step1P:
      "Два сервиса: Postgres и рантайм. У рантайма строка подключения уже вшита в бинарь под этот Postgres, поэтому блок конфигурации ему вообще не нужен.",
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
        code={`SB_CHANNEL=alpha bash <(curl -fsSL https://servicebridge.dev/install.sh)   # newest alpha
SB_VERSION=2.0.0-alpha bash <(curl -fsSL https://servicebridge.dev/install.sh)   # exact pin`}
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
      POSTGRES_DB: servicebridge
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - servicebridge-pg:/var/lib/postgresql/data
    networks:
      - servicebridge-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d servicebridge"]
      interval: 10s
      timeout: 3s
      retries: 10

  servicebridge:
    image: ghcr.io/service-bridge/servicebridge:alpha
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "14444:14444"
      - "14445:14445"
    networks:
      - servicebridge-internal
      - servicebridge-external
    volumes:
      - servicebridge-tls:/app/certs
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O- http://localhost:14444/readyz || exit 1"]
      interval: 15s
      timeout: 3s
      retries: 5
      start_period: 20s

networks:
  servicebridge-internal:
    driver: bridge
  servicebridge-external:
    driver: bridge

volumes:
  servicebridge-pg:
  servicebridge-tls:`}
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
docker compose logs -f servicebridge          # follow logs
docker compose restart servicebridge          # restart
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
