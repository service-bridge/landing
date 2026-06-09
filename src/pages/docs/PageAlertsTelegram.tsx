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
    title: "Telegram Binding",
    description:
      "Send alert notifications to a Telegram chat. You create a bot, point a notification channel at its chat, and the runtime calls the Telegram Bot API directly. No extra service in between.",

    stepsTitle: "Binding steps",
    stepsIntro: "First, create a bot via",
    stepsIntroAfter: "and copy the bot token. Then:",
    steps: [
      "In the dashboard go to Alerts → Channels → Add Channel and pick Telegram.",
      "Paste the bot token into Bot token.",
      "Enter the numeric chat_id of the target chat. To find your own, open @userinfobot in Telegram and it replies with your id.",
      "Leave Mode as polling for a quick setup, or switch to webhook (see below).",
      "Click Save. Use Test to send a sample message and confirm the bot can reach the chat.",
    ],

    chatIdNote1: "The runtime does not auto-discover your chat_id. You enter it manually. For a private chat it is your own id from",
    chatIdNote2: "; for a group, add the bot to the group and use the group's id (a negative number).",

    configTitle: "Channel config",
    configDesc:
      "A Telegram channel stores these fields in its config (JSON). Required: bot_token, chat_id, mode. webhook_url is required only when mode is webhook.",
    configRows: {
      botToken: "Bot token from @BotFather. Used to call the Telegram Bot API.",
      chatId: "Numeric chat id of the destination chat. Get yours from @userinfobot.",
      mode: '"polling" (default) or "webhook".',
      webhookUrl: "Public HTTPS URL Telegram delivers to. Required when mode is webhook; computed for you in the form.",
    },

    modesTitle: "Polling vs webhook",
    modesDesc:
      "Both modes send alerts the same way: the runtime calls sendMessage on the Bot API. The mode only controls how Telegram talks back to the runtime during the binding and test flow.",
    pollingDesc:
      "polling is the default and needs no public address. Pick it for local development or any runtime that is not reachable from the public internet.",
    webhookDesc:
      "webhook registers a public HTTPS endpoint with Telegram via setWebhook. The form computes the URL from your bot token and the dashboard origin:",
    webhookUrlShape: "https://<your-runtime>/api/v1/integrations/telegram/webhook/<sha256(token)[:16]>",
    webhookLocalhost1: "Webhook mode rejects loopback and private addresses (",
    webhookLocalhost2:
      "localhost, 127.0.0.1, private ranges). Telegram must be able to reach the URL over the public internet, so webhook only works when the runtime has a public HTTPS address.",

    messageTitle: "Message format",
    messageDesc:
      "Alerts are sent as a Markdown message. The text is the severity in brackets, the rule name in bold, then the alert message:",

    testNote:
      "If delivery fails, the channel reports the Telegram API error (for example a wrong token, or chat not found because the bot was never started in that chat). Send a message to the bot once so it can post to a private chat.",
  },
  ru: {
    badge: "Алерты",
    title: "Привязка Telegram",
    description:
      "Отправляйте уведомления алертов в Telegram-чат. Вы создаёте бота, нацеливаете канал уведомлений на его чат, а рантайм напрямую вызывает Telegram Bot API. Никакого отдельного сервиса между ними.",

    stepsTitle: "Шаги привязки",
    stepsIntro: "Сначала создайте бота через",
    stepsIntroAfter: "и скопируйте токен бота. Затем:",
    steps: [
      "В дашборде перейдите в Alerts → Channels → Add Channel и выберите Telegram.",
      "Вставьте токен бота в поле Bot token.",
      "Укажите числовой chat_id целевого чата. Чтобы узнать свой chat_id, откройте @userinfobot в Telegram — он пришлёт ваш id.",
      "Оставьте Mode = polling для быстрой настройки или переключитесь на webhook (см. ниже).",
      "Нажмите Save. Кнопкой Test отправьте тестовое сообщение и убедитесь, что бот доходит до чата.",
    ],

    chatIdNote1: "Рантайм не определяет ваш chat_id автоматически. Вы вводите его вручную. Для личного чата это ваш id из",
    chatIdNote2: "; для группы добавьте бота в группу и используйте id группы (отрицательное число).",

    configTitle: "Конфигурация канала",
    configDesc:
      "Telegram-канал хранит эти поля в config (JSON). Обязательные: bot_token, chat_id, mode. Поле webhook_url обязательно только при mode = webhook.",
    configRows: {
      botToken: "Токен бота от @BotFather. Используется для вызовов Telegram Bot API.",
      chatId: "Числовой chat id чата назначения. Свой узнайте через @userinfobot.",
      mode: '"polling" (по умолчанию) или "webhook".',
      webhookUrl: "Публичный HTTPS URL, на который Telegram доставляет апдейты. Обязателен при mode = webhook; форма вычисляет его за вас.",
    },

    modesTitle: "Polling против webhook",
    modesDesc:
      "В обоих режимах алерты уходят одинаково: рантайм вызывает sendMessage в Bot API. Режим влияет только на то, как Telegram отвечает рантайму на этапе привязки и теста.",
    pollingDesc:
      "polling — режим по умолчанию, публичный адрес не нужен. Выбирайте его для локальной разработки или любого рантайма, недоступного из публичного интернета.",
    webhookDesc:
      "webhook регистрирует публичный HTTPS-эндпоинт в Telegram через setWebhook. Форма вычисляет URL из токена бота и origin дашборда:",
    webhookUrlShape: "https://<your-runtime>/api/v1/integrations/telegram/webhook/<sha256(token)[:16]>",
    webhookLocalhost1: "Режим webhook отклоняет loopback и приватные адреса (",
    webhookLocalhost2:
      "localhost, 127.0.0.1, приватные диапазоны). Telegram должен дотягиваться до URL из публичного интернета, поэтому webhook работает только когда у рантайма есть публичный HTTPS-адрес.",

    messageTitle: "Формат сообщения",
    messageDesc:
      "Алерты отправляются Markdown-сообщением. Текст: severity в скобках, имя правила жирным, затем сообщение алерта:",

    testNote:
      "Если доставка не удалась, канал показывает ошибку Telegram API (например, неверный токен или chat not found, если бот ни разу не стартовал в этом чате). Один раз напишите боту, чтобы он мог писать в личный чат.",
  },
};

export function PageAlertsTelegram() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="steps">{t.stepsTitle}</H2>
      <P>
        {t.stepsIntro}{" "}
        <a
          href="https://t.me/BotFather"
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          @BotFather
        </a>{" "}
        {t.stepsIntroAfter}
      </P>
      <ol className="list-none space-y-3 my-5">
        {t.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
              {i + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <Callout type="info">
        {t.chatIdNote1}{" "}
        <a
          href="https://t.me/userinfobot"
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          @userinfobot
        </a>
        {t.chatIdNote2}
      </Callout>

      <H3 id="telegram-config">{t.configTitle}</H3>
      <P>{t.configDesc}</P>
      <ParamTable
        rows={[
          { name: "bot_token", type: "string", default: "—", desc: t.configRows.botToken },
          { name: "chat_id", type: "string", default: "—", desc: t.configRows.chatId },
          { name: "mode", type: '"polling" | "webhook"', default: '"polling"', desc: t.configRows.mode },
          { name: "webhook_url", type: "string", default: "—", desc: t.configRows.webhookUrl },
        ]}
      />

      <H3 id="telegram-modes">{t.modesTitle}</H3>
      <P>{t.modesDesc}</P>
      <P>{t.pollingDesc}</P>
      <P>{t.webhookDesc}</P>
      <DocCodeBlock lang="bash" code={t.webhookUrlShape} />
      <Callout type="warning">
        {t.webhookLocalhost1}
        <Mono>localhost</Mono>
        {", "}
        {t.webhookLocalhost2}
      </Callout>

      <H3 id="telegram-message">{t.messageTitle}</H3>
      <P>{t.messageDesc}</P>
      <div className="rounded-xl border border-surface-border bg-surface p-4 my-4 text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
        {`[CRITICAL] *DLQ spike*
3 new dead-letter message(s) in the last cycle`}
      </div>

      <Callout type="tip">{t.testNote}</Callout>
    </div>
  );
}
