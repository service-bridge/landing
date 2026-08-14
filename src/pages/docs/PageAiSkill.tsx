// keywords: servicebridge service-bridge AI skill Claude Code coding agent LLM Node SDK Go SDK skill install .claude/skills degit RPC events workflows jobs Express Fastify Hono chi gin codegen
import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Getting Started",
    title: "AI Coding Skill",
    description:
      "ServiceBridge ships an official skill for AI coding agents — one per language SDK. Drop it into your agent and it writes correct ServiceBridge code on the first try — grounded in the real SDK, not a guess.",

    whatTitle: "What it is",
    whatP:
      "A self-contained skill (a SKILL.md plus per-domain reference files) that teaches an agent the exact ServiceBridge SDK for its language: the two-phase lifecycle (declare handlers and dependencies, then start, then act), RPC, durable events, workflows, jobs, and the HTTP integrations — Express, Fastify and Hono in Node, chi, net/http and Gin in Go. Every signature and snippet is taken from the shipped SDK and was type-checked and run against a live runtime.",
    livesP: "Each one ships inside its SDK at",
    livesPAfter: "and loads like any other agent skill.",

    installTitle: "Install",
    installP:
      "The skill ships inside the package. Install the SDK, then copy the skill into your agent's skills directory — .claude/skills/ for Claude Code, or ~/.claude/skills/ for all projects:",
    installCaption:
      "Not installed yet? Pull it straight from the repo with degit (or git clone). Restart the agent afterwards so it picks up the skill:",

    coversTitle: "What the agent learns",
    coversP:
      "The hub teaches the golden rules — the package to import, the bootstrap key comes from the dashboard, no env vars for url/key, idempotent event and job handlers, explicit teardown. Reference files go deep on each domain:",
    bullets: [
      "RPC — handle, call, a typed client, streaming, schema resolution",
      "Events — define, handle, publish, at-least-once delivery and DLQ",
      "Workflows — DAG steps, waitFor, compensation, signals, replay",
      "Jobs — cron, delayed and interval triggers, idempotency by key",
      "HTTP — attach Express, Fastify, Hono, chi or Gin into the Service Map",
      "Configuration — every construction option, error types, lifecycle",
    ],
    browse: "Browse the skill on GitHub →",
  },
  ru: {
    badge: "Начало работы",
    title: "Навык для AI-агентов",
    description:
      "ServiceBridge поставляет официальный навык для AI-кодинг-агентов — свой на каждый языковой SDK. Положите его в агента — и он с первого раза пишет корректный код ServiceBridge на основе реального SDK, а не догадок.",

    whatTitle: "Что это",
    whatP:
      "Самодостаточный навык (SKILL.md плюс reference-файлы по доменам), который обучает агента точному SDK ServiceBridge для его языка: жизненному циклу из двух фаз (объявить хендлеры и зависимости, затем start, затем вызовы), RPC, надёжным событиям, воркфлоу, джобам и HTTP-интеграциям — Express, Fastify и Hono в Node, chi, net/http и Gin в Go. Каждая сигнатура и сниппет взяты из реального SDK, проверены типами и прогнаны против живого рантайма.",
    livesP: "Каждый навык лежит внутри своего SDK по пути",
    livesPAfter: "и загружается как любой другой навык агента.",

    installTitle: "Установка",
    installP:
      "Навык лежит внутри пакета. Установите SDK и скопируйте навык в директорию навыков агента — .claude/skills/ для Claude Code или ~/.claude/skills/ для всех проектов:",
    installCaption:
      "Ещё не установили SDK? Заберите навык прямо из репозитория через degit (или git clone). После — перезапустите агента, чтобы он подхватил навык:",

    coversTitle: "Чему учится агент",
    coversP:
      "Хаб задаёт золотые правила — какой пакет импортировать, bootstrap-ключ берётся из дашборда, нет env для url/key, идемпотентные хендлеры событий и джоб, явное завершение. Reference-файлы детально раскрывают каждый домен:",
    bullets: [
      "RPC — handle, call, типизированный клиент, стримы, резолв схем",
      "События — define, handle, publish, at-least-once доставка и DLQ",
      "Воркфлоу — шаги DAG, waitFor, компенсация, сигналы, replay",
      "Джобы — триггеры cron, delayed и interval, идемпотентность по ключу",
      "HTTP — подключение Express, Fastify, Hono, chi или Gin в Service Map",
      "Конфигурация — все опции создания клиента, типы ошибок, жизненный цикл",
    ],
    browse: "Открыть навык на GitHub →",
  },
};

export function PageAiSkill() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="what">{t.whatTitle}</H2>
      <P>{t.whatP}</P>
      <P>
        {t.livesP} <Mono>sdk/node/skill/</Mono>, <Mono>sdk/go/skill/</Mono> {t.livesPAfter}
      </P>

      <H2 id="install">{t.installTitle}</H2>
      <P>{t.installP}</P>
      <MultiCodeBlock
        code={{
          ts: `npm i service-bridge
cp -r node_modules/service-bridge/skill .claude/skills/servicebridge-node`,
          go: `go get github.com/service-bridge/sdk/go
cp -r "$(go env GOMODCACHE)"/github.com/service-bridge/sdk/go@*/skill \\
  .claude/skills/servicebridge-go`,
        }}
      />
      <Callout type="info">{t.installCaption}</Callout>
      <MultiCodeBlock
        code={{
          ts: `# degit — pulls just the skill folder
npx degit service-bridge/sdk/node/skill .claude/skills/servicebridge-node

# or git clone
git clone --depth 1 https://github.com/service-bridge/sdk
cp -r sdk/node/skill .claude/skills/servicebridge-node`,
          go: `# degit — pulls just the skill folder
npx degit service-bridge/sdk/go/skill .claude/skills/servicebridge-go

# or git clone
git clone --depth 1 https://github.com/service-bridge/sdk
cp -r sdk/go/skill .claude/skills/servicebridge-go`,
        }}
      />

      <H2 id="covers">{t.coversTitle}</H2>
      <P>{t.coversP}</P>
      <ul className="ml-5 list-disc space-y-1.5 text-muted-foreground">
        {t.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <P>
        <a
          href="https://github.com/service-bridge/sdk/tree/main/node/skill"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline font-medium"
        >
          {t.browse}
        </a>
      </P>
    </div>
  );
}
