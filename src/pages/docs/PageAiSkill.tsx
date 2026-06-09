// keywords: servicebridge service-bridge AI skill Claude Code coding agent LLM Node SDK skill install .claude/skills degit RPC events workflows jobs Express Fastify Hono codegen
import { Callout, DocCodeBlock, H2, Mono, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Getting Started",
    title: "AI Coding Skill",
    description:
      "ServiceBridge ships an official skill for AI coding agents. Drop it into your agent and it writes correct ServiceBridge code on the first try — grounded in the real Node SDK, not a guess.",

    whatTitle: "What it is",
    whatP:
      "A self-contained skill (a SKILL.md plus per-domain reference files) that teaches an agent the exact ServiceBridge Node SDK: the two-phase lifecycle (declare handlers and dependencies, then start, then act), RPC, durable events, workflows, jobs, and the Express, Fastify, and Hono integrations. Every signature and snippet is taken from the shipped SDK and was type-checked and run against a live runtime.",
    livesP: "It lives in the public SDK repo at",
    livesPAfter: "and loads like any other agent skill.",

    installTitle: "Install",
    installP:
      "Copy the skill folder into your agent's skills directory. For Claude Code that is .claude/skills/ in your project (or ~/.claude/skills/ for all projects). The degit one-liner pulls just the skill subfolder:",
    installCaption:
      "Restart the agent after installing so it picks up the new skill. No degit? Use git clone and copy the folder by hand:",

    coversTitle: "What the agent learns",
    coversP:
      "The hub teaches the golden rules — package name service-bridge, the bootstrap key comes from the dashboard, no env vars for url/key, idempotent event and job handlers, teardown with stop(). Reference files go deep on each domain:",
    bullets: [
      "RPC — handle, call, typed client(), streaming, schema resolution",
      "Events — define, handle, publish, at-least-once delivery and DLQ",
      "Workflows — DAG steps, waitFor, compensation, signals, replay",
      "Jobs — cron, delayed and interval triggers, idempotency by key",
      "HTTP — attach Express, Fastify, and Hono into the Service Map",
      "Configuration — every constructor option, error types, lifecycle",
    ],
    browse: "Browse the skill on GitHub →",
  },
  ru: {
    badge: "Начало работы",
    title: "Навык для AI-агентов",
    description:
      "ServiceBridge поставляет официальный навык для AI-кодинг-агентов. Положите его в агента — и он с первого раза пишет корректный код ServiceBridge на основе реального Node SDK, а не догадок.",

    whatTitle: "Что это",
    whatP:
      "Самодостаточный навык (SKILL.md плюс reference-файлы по доменам), который обучает агента точному Node SDK ServiceBridge: жизненному циклу из двух фаз (объявить хендлеры и зависимости, затем start, затем вызовы), RPC, надёжным событиям, воркфлоу, джобам и интеграциям с Express, Fastify и Hono. Каждая сигнатура и сниппет взяты из реального SDK, проверены типами и прогоны против живого рантайма.",
    livesP: "Навык лежит в публичном репозитории SDK по пути",
    livesPAfter: "и загружается как любой другой навык агента.",

    installTitle: "Установка",
    installP:
      "Скопируйте папку навыка в директорию навыков вашего агента. Для Claude Code это .claude/skills/ в проекте (или ~/.claude/skills/ для всех проектов). Однострочник degit тянет только подпапку навыка:",
    installCaption:
      "После установки перезапустите агента, чтобы он подхватил навык. Нет degit? Склонируйте через git и скопируйте папку вручную:",

    coversTitle: "Чему учится агент",
    coversP:
      "Хаб задаёт золотые правила — имя пакета service-bridge, bootstrap-ключ берётся из дашборда, нет env для url/key, идемпотентные хендлеры событий и джоб, завершение через stop(). Reference-файлы детально раскрывают каждый домен:",
    bullets: [
      "RPC — handle, call, типизированный client(), стримы, резолв схем",
      "События — define, handle, publish, at-least-once доставка и DLQ",
      "Воркфлоу — шаги DAG, waitFor, компенсация, сигналы, replay",
      "Джобы — триггеры cron, delayed и interval, идемпотентность по ключу",
      "HTTP — подключение Express, Fastify и Hono в Service Map",
      "Конфигурация — все опции конструктора, типы ошибок, жизненный цикл",
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
        {t.livesP} <Mono>service-bridge/skills/servicebridge-node/</Mono> {t.livesPAfter}
      </P>

      <H2 id="install">{t.installTitle}</H2>
      <P>{t.installP}</P>
      <DocCodeBlock
        lang="bash"
        code={`npx degit service-bridge/sdk/skills/servicebridge-node .claude/skills/servicebridge-node`}
      />
      <Callout type="info">{t.installCaption}</Callout>
      <DocCodeBlock
        lang="bash"
        code={`git clone --depth 1 https://github.com/service-bridge/sdk
cp -r sdk/skills/servicebridge-node .claude/skills/`}
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
          href="https://github.com/service-bridge/sdk/tree/main/skills/servicebridge-node"
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
