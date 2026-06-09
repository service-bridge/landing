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

const T = {
  en: {
    badge: "Alerts",
    title: "Notification Channels",
    description:
      "A channel is where a fired alert lands. You create and edit channels from the dashboard, with no config files and no SDK code. A rule points at one or more channels, and when it fires the runtime fans the alert out to every channel attached to it.",

    channelTypesTitle: "Channel types",
    channelTypesP:
      "Five channel kinds ship built in. Each one validates its config against a JSON Schema on save, so a misconfigured channel gets rejected when you create it instead of failing later at delivery.",
    inappName: "inapp",
    inappDesc:
      "In-app notification delivered to open dashboard sessions in real time. No config fields. There is exactly one inapp channel per runtime (enforced by the database), so you cannot create a second one.",
    browserPushName: "browser_push",
    browserPushDesc:
      "Web Push to browsers that registered a subscription from the dashboard. Optional subscription_ids array targets specific subscriptions; omit it to reach all active ones. VAPID keys are generated and stored by the runtime automatically.",
    telegramName: "telegram",
    telegramDesc:
      "Markdown message via the Telegram Bot API. Requires bot_token and chat_id, plus mode = polling or webhook (webhook mode also needs webhook_url). See the Telegram Binding page for the setup flow.",
    emailName: "email",
    emailDesc:
      "Plaintext email over SMTP. Requires to and use_external_smtp. With use_external_smtp = true you also provide host, port, from (and optional username / password for auth); with false the runtime delivers directly via the recipient's MX records.",
    webhookName: "webhook",
    webhookDesc:
      "HTTP POST of the alert as JSON to any URL. Requires url; optional headers object adds request headers (for example an Authorization or X-Api-Key value). Any 2xx response counts as delivered.",

    webhookConfigTitle: "Webhook configuration",
    webhookConfigP: "The webhook channel config has two fields:",
    urlDesc:
      "Target URL the alert is POSTed to. Required, validated as a URI on save; no other field is accepted in the config.",
    headersDesc:
      "Optional map of header name to string value, applied to the outgoing POST. Use it to authenticate the request.",

    webhookExampleP: "Example channel config (entered in the dashboard webhook form):",

    webhookPayloadTitle: "Webhook payload",
    webhookPayloadP:
      "On delivery the runtime sends a single POST with Content-Type: application/json and a body wrapping the fired alert under an alert key:",
    payloadFieldsP: "Fields of the alert object:",
    fId: "Alert id (unique per firing).",
    fRuleId: "Id of the rule that fired.",
    fRuleName: "Human-readable rule name.",
    fSeverity: 'One of "info", "warning", "critical".',
    fConditionType:
      'Condition that triggered the rule, e.g. "dlq_new", "error_rate", "service_offline".',
    fMessage: "Rendered alert message.",
    fPayload: "Condition snapshot: the metrics that tripped the rule (shape depends on condition type).",
    fFiredAt: "Fire time as an RFC 3339 timestamp.",
    fTrigger: 'Origin of the alert: "evaluator", "manual", or "test".',

    deliveryNote:
      "Delivery is at-least-once with retries and exponential backoff. The runtime owns the retry loop and writes every attempt to the alert history, so the same alert can reach your receiver more than once. Make the receiver idempotent.",
  },
  ru: {
    badge: "Алерты",
    title: "Каналы уведомлений",
    description:
      "Канал — это куда попадает сработавший алерт. Каналы вы создаёте и редактируете в дашборде, без конфиг-файлов и кода SDK. Правило указывает на один или несколько каналов, и при срабатывании runtime рассылает алерт во все привязанные к нему каналы.",

    channelTypesTitle: "Типы каналов",
    channelTypesP:
      "Встроено пять видов каналов. Каждый при сохранении проверяет свой config по JSON Schema, поэтому неправильно настроенный канал отклоняется ещё при создании, а не падает потом на доставке.",
    inappName: "inapp",
    inappDesc:
      "Уведомление в приложении, доставляется в открытые сессии дашборда в реальном времени. Полей конфигурации нет. На один runtime существует ровно один inapp-канал (это гарантирует база), поэтому создать второй нельзя.",
    browserPushName: "browser_push",
    browserPushDesc:
      "Web Push в браузеры, оформившие подписку из дашборда. Необязательный массив subscription_ids нацеливает доставку на конкретные подписки; без него уведомление уходит во все активные. Ключи VAPID runtime генерирует и хранит сам.",
    telegramName: "telegram",
    telegramDesc:
      "Сообщение в формате Markdown через Telegram Bot API. Требует bot_token и chat_id, а также mode = polling или webhook (для webhook нужен ещё webhook_url). Процесс настройки — на странице «Привязка Telegram».",
    emailName: "email",
    emailDesc:
      "Письмо в виде plaintext по SMTP. Требует to и use_external_smtp. При use_external_smtp = true дополнительно указываются host, port, from (и необязательные username / password для авторизации); при false runtime доставляет напрямую по MX-записям получателя.",
    webhookName: "webhook",
    webhookDesc:
      "HTTP POST с алертом в виде JSON на любой URL. Требует url; необязательный объект headers добавляет заголовки запроса (например, Authorization или X-Api-Key). Любой ответ 2xx считается успешной доставкой.",

    webhookConfigTitle: "Конфигурация webhook",
    webhookConfigP: "Config webhook-канала состоит из двух полей:",
    urlDesc:
      "Целевой URL, на который POST-ится алерт. Обязателен, при сохранении проверяется как URI; других полей в config нет.",
    headersDesc:
      "Необязательная карта «имя заголовка → строковое значение», применяется к исходящему POST. Используйте для аутентификации запроса.",

    webhookExampleP: "Пример config канала (вводится в форме webhook в дашборде):",

    webhookPayloadTitle: "Webhook payload",
    webhookPayloadP:
      "При доставке runtime отправляет один POST с Content-Type: application/json и телом, оборачивающим сработавший алерт в ключ alert:",
    payloadFieldsP: "Поля объекта alert:",
    fId: "Id алерта (уникален для каждого срабатывания).",
    fRuleId: "Id правила, которое сработало.",
    fRuleName: "Человекочитаемое имя правила.",
    fSeverity: 'Одно из "info", "warning", "critical".',
    fConditionType:
      'Условие, вызвавшее правило, например "dlq_new", "error_rate", "service_offline".',
    fMessage: "Сформированное сообщение алерта.",
    fPayload: "Снимок условия — метрики, на которых сработало правило (форма зависит от типа условия).",
    fFiredAt: "Время срабатывания в формате RFC 3339.",
    fTrigger: 'Источник алерта: "evaluator", "manual" или "test".',

    deliveryNote:
      "Доставка — at-least-once с повторами и экспоненциальным backoff. Циклом повторов владеет сам runtime и пишет каждую попытку в историю алертов, так что один и тот же алерт может прийти на приёмник несколько раз. Делайте приёмник идемпотентным.",
  },
};

export function PageAlertsChannels() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="channel-types">{t.channelTypesTitle}</H2>
      <P>{t.channelTypesP}</P>
      <ParamTable
        rows={[
          { name: "inapp", type: "—", desc: t.inappDesc },
          { name: "browser_push", type: "subscription_ids?", desc: t.browserPushDesc },
          { name: "telegram", type: "bot_token, chat_id, mode", desc: t.telegramDesc },
          { name: "email", type: "to, use_external_smtp, ...", desc: t.emailDesc },
          { name: "webhook", type: "url, headers?", desc: t.webhookDesc },
        ]}
      />

      <H3 id="webhook-config">{t.webhookConfigTitle}</H3>
      <P>{t.webhookConfigP}</P>
      <ParamTable
        rows={[
          { name: "url", type: "string", desc: t.urlDesc },
          { name: "headers", type: "Record<string, string>?", desc: t.headersDesc },
        ]}
      />

      <P>{t.webhookExampleP}</P>
      <DocCodeBlock
        lang="json"
        code={`{
  "url": "https://hooks.example.com/sb-alerts",
  "headers": {
    "Authorization": "Bearer <token>",
    "X-Api-Key": "secret"
  }
}`}
      />

      <H2 id="webhook-payload">{t.webhookPayloadTitle}</H2>
      <P>{t.webhookPayloadP}</P>
      <DocCodeBlock
        lang="json"
        code={`{
  "alert": {
    "ID": "01J9X3K2Q-...",
    "RuleID": "9c1f8e2a-...",
    "RuleName": "DLQ spike",
    "Severity": "warning",
    "ConditionType": "dlq_new",
    "Message": "3 new dead-letter message(s) in the last cycle",
    "Payload": { "dlq_count": 3 },
    "FiredAt": "2026-06-06T10:00:30Z",
    "Trigger": "evaluator"
  }
}`}
      />

      <P>{t.payloadFieldsP}</P>
      <ParamTable
        rows={[
          { name: "ID", type: "string", desc: t.fId },
          { name: "RuleID", type: "string", desc: t.fRuleId },
          { name: "RuleName", type: "string", desc: t.fRuleName },
          { name: "Severity", type: "string", desc: t.fSeverity },
          { name: "ConditionType", type: "string", desc: t.fConditionType },
          { name: "Message", type: "string", desc: t.fMessage },
          { name: "Payload", type: "object", desc: t.fPayload },
          { name: "FiredAt", type: "string (RFC 3339)", desc: t.fFiredAt },
          { name: "Trigger", type: "string", desc: t.fTrigger },
        ]}
      />

      <Callout type="info">
        <Mono>{"at-least-once"}</Mono> — {t.deliveryNote}
      </Callout>
    </div>
  );
}
