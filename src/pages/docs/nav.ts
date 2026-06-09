export type TocItem = { id: string; label: string; ru?: string };
export type NavItem = { id: string; label: string; ru: string; toc: TocItem[] };
export type NavGroup = { group: string; ru: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    group: "Getting Started",
    ru: "Начало работы",
    items: [
      {
        id: "installation",
        label: "Installation",
        ru: "Установка",
        toc: [
          { id: "option-1", label: "One-line installer", ru: "Однострочный установщик" },
          { id: "option-2", label: "Docker Compose manually", ru: "Docker Compose вручную" },
          { id: "manage", label: "Manage after install", ru: "Управление после установки" },
        ],
      },
      {
        id: "quick-start",
        label: "Quick Start",
        ru: "Быстрый старт",
        toc: [
          { id: "install-sdk", label: "Install SDK", ru: "Установка SDK" },
          { id: "create-worker", label: "Create a worker", ru: "Создание воркера" },
          { id: "call-rpc", label: "Call it from another service", ru: "Вызов из другого сервиса" },
        ],
      },
      {
        id: "end-to-end",
        label: "End-to-End Example",
        ru: "Полный пример",
        toc: [
          { id: "payments-worker", label: "Payments worker", ru: "Воркер платежей" },
          { id: "orders-caller", label: "Orders caller", ru: "Вызывающий заказы" },
          { id: "notifications", label: "Notifications consumer", ru: "Потребитель уведомлений" },
          { id: "workflow", label: "Orchestrate as workflow", ru: "Оркестрация как воркфлоу" },
        ],
      },
    ],
  },
  {
    group: "SDK Reference",
    ru: "Справочник SDK",
    items: [
      {
        id: "rpc",
        label: "RPC",
        ru: "RPC",
        toc: [
          { id: "rpc-call", label: "sb.rpc.call()" },
          { id: "rpc-opts", label: "CallOpts", ru: "CallOpts" },
          { id: "rpc-errors", label: "Error handling", ru: "Обработка ошибок" },
          { id: "handle-rpc", label: "sb.rpc.handle()" },
          { id: "handle-opts", label: "Handler options", ru: "Опции обработчика" },
          { id: "handle-streaming", label: "sb.stream() — server streaming", ru: "sb.stream() — серверный стриминг" },
          { id: "handle-acl", label: "Access control", ru: "Контроль доступа" },
          { id: "protobuf-schema", label: "Protobuf schema", ru: "Protobuf схема" },
          { id: "schema-handler", label: "Schema: Handler", ru: "Схема: Обработчик" },
          { id: "schema-caller", label: "Schema: Caller", ru: "Схема: Вызывающий" },
          { id: "rpc-context", label: "RpcContext" },
        ],
      },
      {
        id: "events",
        label: "Events",
        ru: "События",
        toc: [
          { id: "event-publish", label: "sb.event.publish()" },
          { id: "event-opts", label: "PublishOpts", ru: "PublishOpts" },
          { id: "handle-event", label: "sb.event.handle()" },
          { id: "handle-event-ctx", label: "sb.event.define()", ru: "sb.event.define()" },
          { id: "handle-event-retry", label: "Retry & DLQ", ru: "Повторы и DLQ" },
          { id: "retry-policy", label: "Retry policy", ru: "Политика повторов" },
          { id: "handle-event-filter", label: "Server-side filter", ru: "Серверный фильтр" },
          { id: "wildcard-depth", label: "Wildcard depth", ru: "Глубина wildcard" },
        ],
      },
      {
        id: "jobs",
        label: "Jobs & Scheduling",
        ru: "Задания и планировщик",
        toc: [
          { id: "handler-side", label: "How it works", ru: "Как работает" },
          { id: "job-schedule", label: "sb.job.handle()" },
          { id: "schedule-opts", label: "JobOpts" },
          { id: "job-cron", label: "Cron trigger", ru: "Cron-триггер" },
          { id: "job-delay", label: "Delayed trigger (one-shot)", ru: "Отложенный триггер" },
          { id: "job-event", label: "Interval trigger", ru: "Интервальный триггер" },
          { id: "job-workflow", label: "Catchup & overlap policy", ru: "Политика catchup и overlap" },
          { id: "job-retry", label: "Retry policy", ru: "Политика повторов" },
          { id: "job-manage", label: "JobHandlerCtx", ru: "JobHandlerCtx" },
        ],
      },
      {
        id: "workflows",
        label: "Workflows",
        ru: "Воркфлоу",
        toc: [
          { id: "concept", label: "How it works", ru: "Как работает" },
          { id: "handlers", label: "sb.workflow.handle()", ru: "sb.workflow.handle()" },
          { id: "workflow-start", label: "sb.workflow.start()" },
          { id: "step-fields", label: "Step fields", ru: "Поля шага" },
          { id: "output-chaining", label: "Output chaining", ru: "Цепочка выходных данных" },
          { id: "workflow-example", label: "Example", ru: "Пример" },
          { id: "parallel-steps", label: "Parallel steps", ru: "Параллельные шаги" },
          { id: "event-wait", label: "wait_event / wait_signal", ru: "wait_event / wait_signal" },
          { id: "conditional-if", label: "Conditional steps", ru: "Условные шаги" },
          { id: "child-workflow", label: "Child workflows", ru: "Дочерние воркфлоу" },
          { id: "sleep-step", label: "Durable sleep", ru: "Устойчивая пауза" },
          { id: "run-workflow", label: "sb.workflow.await() / signal() / cancel() / query()", ru: "await / signal / cancel / query" },
          { id: "cancel", label: "Cancel a run", ru: "Отмена запуска" },
        ],
      },
      {
        id: "streaming",
        label: "Streaming",
        ru: "Стриминг",
        toc: [
          { id: "how-it-works", label: "How it works", ru: "Как работает" },
          { id: "get-trace-id", label: "sb.stream() — caller side", ru: "sb.stream() — сторона вызывающего" },
          { id: "write-chunks", label: "sb.rpc.handleStream() — handler side", ru: "sb.rpc.handleStream() — сторона обработчика" },
          { id: "watch-trace", label: "Consuming chunks (for await)", ru: "Потребление чанков (for await)" },
          { id: "llm-streaming", label: "LLM tokens", ru: "LLM токены" },
          { id: "sse-endpoint", label: "Cancellation", ru: "Отмена" },
          { id: "progress", label: "Progress bars", ru: "Прогресс-бары" },
          { id: "event-shape", label: "Chunk type", ru: "Тип чанка" },
          { id: "replay", label: "Replay via dashboard", ru: "Воспроизведение через дашборд" },
        ],
      },
      {
        id: "start",
        label: "Startup & Shutdown",
        ru: "Запуск и остановка",
        toc: [
          { id: "lifecycle", label: "Worker lifecycle", ru: "Жизненный цикл воркера" },
          { id: "outgoing-deps", label: "sb.service() — outgoing deps", ru: "sb.service() — исходящие зависимости" },
          { id: "start-sig", label: "sb.start()" },
          { id: "start-opts", label: "ServiceBridgeOptions", ru: "ServiceBridgeOptions" },
          { id: "instance-weight", label: "Identity & instanceId", ru: "Identity и instanceId" },
          { id: "tls-behavior", label: "TLS / mTLS" },
          { id: "graceful-shutdown", label: "Graceful shutdown", ru: "Мягкое завершение" },
          { id: "stop-sig", label: "sb.stop()" },
        ],
      },
    ],
  },
  {
    group: "HTTP Integration",
    ru: "Интеграция HTTP",
    items: [
      {
        id: "http-middleware",
        label: "Middleware",
        ru: "Middleware",
        toc: [
          { id: "what-it-does", label: "What it does", ru: "Что делает" },
          { id: "express", label: "Express" },
          { id: "fastify", label: "Fastify" },
          { id: "hono", label: "Hono" },
        ],
      },
    ],
  },
  {
    group: "Observability",
    ru: "Наблюдаемость",
    items: [
      {
        id: "manual-spans",
        label: "Manual Spans",
        ru: "Ручные спаны",
        toc: [
          { id: "start-span", label: "sb.telemetry.startOp()" },
          { id: "register-endpoint", label: "OpHandle lifecycle", ru: "Жизненный цикл OpHandle" },
        ],
      },
      {
        id: "tracing",
        label: "Distributed Tracing",
        ru: "Распределённая трассировка",
        toc: [
          { id: "auto-tracing", label: "Automatic traces", ru: "Автоматические трейсы" },
          { id: "span-table", label: "Span types", ru: "Типы спанов" },
          { id: "inline-logs", label: "Inline logs", ru: "Встроенные логи" },
          { id: "trace-id-header", label: "X-SB-Trace header", ru: "Заголовок X-SB-Trace" },
          { id: "trace-context", label: "Trace context", ru: "Контекст трейса" },
          { id: "grafana", label: "Grafana / Loki" },
          { id: "otlp", label: "OTLP ingest" },
        ],
      },
      {
        id: "metrics-logs",
        label: "Metrics & Logs",
        ru: "Метрики и логи",
        toc: [
          { id: "metrics", label: "Prometheus metrics", ru: "Метрики Prometheus" },
          { id: "logs", label: "Log capture", ru: "Захват логов" },
        ],
      },
    ],
  },
  {
    group: "Configuration",
    ru: "Конфигурация",
    items: [
      {
        id: "sdk-options",
        label: "SDK Options",
        ru: "Опции SDK",
        toc: [
          { id: "constructor", label: "Constructor", ru: "Конструктор" },
          { id: "options-table", label: "All options", ru: "Все опции" },
        ],
      },
      {
        id: "server-config",
        label: "Server Settings",
        ru: "Настройки сервера",
        toc: [
          { id: "required", label: "Required", ru: "Обязательные" },
          { id: "retention", label: "Retention & storage", ru: "Хранение данных" },
          { id: "network", label: "Network & ports", ru: "Сеть и порты" },
          { id: "auth", label: "Auth & session", ru: "Авторизация и сессии" },
          { id: "advanced", label: "Advanced", ru: "Дополнительные" },
          { id: "endpoints", label: "System endpoints", ru: "Системные эндпоинты" },
        ],
      },
    ],
  },
  {
    group: "Production",
    ru: "Production",
    items: [
      {
        id: "service-keys",
        label: "Service Keys & RBAC",
        ru: "Сервисные ключи и RBAC",
        toc: [
          { id: "capabilities", label: "Capabilities", ru: "Возможности" },
          { id: "policy", label: "Granular policy", ru: "Гранулярная политика" },
          { id: "key-example", label: "Example", ru: "Пример" },
        ],
      },
      {
        id: "tls-mtls",
        label: "TLS / mTLS",
        ru: "TLS / mTLS",
        toc: [
          { id: "tls-auto", label: "Auto-generated certs", ru: "Автосгенерированные сертификаты" },
          { id: "tls-provision", label: "SDK gRPC provisioning", ru: "Провижининг gRPC в SDK" },
          { id: "tls-arch", label: "Architecture", ru: "Архитектура" },
        ],
      },
      {
        id: "reliability",
        label: "Reliability Semantics",
        ru: "Гарантии надёжности",
        toc: [
          { id: "guarantees", label: "Delivery guarantees", ru: "Гарантии доставки" },
          { id: "outage", label: "On server outage", ru: "При недоступности сервера" },
        ],
      },
      {
        id: "offline-queue",
        label: "Offline Queue",
        ru: "Очередь offline",
        toc: [
          { id: "behavior", label: "How it works", ru: "Как работает" },
          { id: "config", label: "Configuration", ru: "Конфигурация" },
        ],
      },
      {
        id: "filter-expr",
        label: "Filter Expressions",
        ru: "Фильтры событий",
        toc: [
          { id: "syntax", label: "DSL syntax", ru: "Синтаксис DSL" },
          { id: "operators", label: "Operators", ru: "Операторы" },
        ],
      },
      {
        id: "dlq-replay",
        label: "DLQ & Replay",
        ru: "DLQ и воспроизведение",
        toc: [
          { id: "via-ui", label: "Via dashboard", ru: "Через дашборд" },
          { id: "notes", label: "Notes", ru: "Заметки" },
        ],
      },
    ],
  },
  {
    group: "Transport & Resilience",
    ru: "Транспорт и отказоустойчивость",
    items: [
      {
        id: "session-lifecycle",
        label: "Session Lifecycle",
        ru: "Жизненный цикл сессии",
        toc: [
          { id: "states", label: "States", ru: "Состояния" },
          { id: "epoch-fencing", label: "Epoch Fencing" },
          { id: "suspended-recovery", label: "Suspended Recovery", ru: "Восстановление из приостановки" },
          { id: "drain-path", label: "Drain Path", ru: "Путь слива" },
        ],
      },
      {
        id: "transport-modes",
        label: "Transport Modes",
        ru: "Режимы транспорта",
        toc: [
          { id: "direct-mode", label: "Direct Mode", ru: "Прямой режим" },
          { id: "proxy-mode", label: "Proxy Mode", ru: "Прокси-режим" },
          { id: "config-hierarchy", label: "Config Hierarchy", ru: "Иерархия конфигурации" },
          { id: "circuit-breakers", label: "Circuit Breakers", ru: "Прерыватели" },
          { id: "zone-aware", label: "Zone-Aware LB", ru: "Зональная балансировка" },
        ],
      },
      {
        id: "reconnect-resume",
        label: "Reconnect & Resume",
        ru: "Переподключение и возобновление",
        toc: [
          { id: "resume-protocol", label: "Resume Protocol", ru: "Протокол возобновления" },
          { id: "backoff", label: "Backoff Strategy", ru: "Стратегия backoff" },
          { id: "position-update", label: "PositionUpdate" },
        ],
      },
      {
        id: "config-push",
        label: "ConfigPush",
        ru: "ConfigPush",
        toc: [
          { id: "what-is-configpush", label: "What is ConfigPush", ru: "Что такое ConfigPush" },
          { id: "what-can-be-pushed", label: "What Can Be Pushed", ru: "Что можно передать" },
          { id: "config-example", label: "Example", ru: "Пример" },
          { id: "apply-order", label: "Apply Order", ru: "Порядок применения" },
        ],
      },
      {
        id: "zone-aware",
        label: "Zone-Aware Routing",
        ru: "Зонирование маршрутизации",
        toc: [
          { id: "how-it-works", label: "How It Works", ru: "Как работает" },
          { id: "configuration", label: "Configuration", ru: "Конфигурация" },
          { id: "fallback", label: "Fallback", ru: "Резервный вариант" },
          { id: "multi-runtime", label: "Multi-Runtime", ru: "Несколько runtime" },
        ],
      },
    ],
  },
  {
    group: "Alerts",
    ru: "Алерты",
    items: [
      {
        id: "alerts-overview",
        label: "Overview",
        ru: "Обзор",
        toc: [
          { id: "how-it-works", label: "How it works", ru: "Как работает" },
          { id: "stats", label: "At a glance", ru: "Кратко" },
        ],
      },
      {
        id: "alerts-rules",
        label: "Alert Rules",
        ru: "Правила алертов",
        toc: [
          { id: "condition-types", label: "Condition types", ru: "Типы условий" },
          { id: "rule-settings", label: "Rule settings", ru: "Настройки правила" },
        ],
      },
      {
        id: "alerts-channels",
        label: "Notification Channels",
        ru: "Каналы уведомлений",
        toc: [
          { id: "channel-types", label: "Channel types", ru: "Типы каналов" },
          { id: "webhook-payload", label: "Webhook payload", ru: "Webhook payload" },
        ],
      },
      {
        id: "alerts-telegram",
        label: "Telegram Binding",
        ru: "Привязка Telegram",
        toc: [{ id: "steps", label: "Binding steps", ru: "Шаги привязки" }],
      },
    ],
  },
];
