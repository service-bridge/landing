import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  H2,
  Mono,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "SDK Reference",
    title: "Streaming",
    description:
      "Server-streaming RPC. A handler yields chunks one at a time; the caller reads them live with for await. Good for LLM tokens, progress updates, and any response that arrives in pieces.",

    howTitle: "How it works",

    callerTitle: "sb.stream() — caller side",
    callerP:
      "You start a streaming call with sb.stream(), which returns an AsyncIterable of decoded chunks. Before start(), declare the dependency with sb.service() and load the method schema with sb.useSchema() so the SDK can decode each chunk.",

    handlerTitle: "sb.rpc.handleStream() — handler side",
    handlerP:
      "Register the handler with sb.rpc.handleStream(). It is an async generator: every value you yield becomes one chunk on the wire. Returning closes the stream cleanly; throwing closes it with an error chunk. The schema is required.",

    consumeTitle: "Consuming chunks (for await)",
    consumeP:
      "Read the iterable with for await. Each turn of the loop hands you one decoded chunk in the order the handler yielded it.",

    llmTitle: "LLM tokens",
    llmP:
      "Token streaming maps straight onto this. The handler yields a token at a time as the model produces it, and the caller prints each chunk the moment it lands.",

    cancelTitle: "Cancellation",
    cancelP:
      "There is no cancel() method. Break or return out of the for-await loop, and the SDK closes the underlying gRPC stream. The callee sees that close as a cancelled context and stops producing chunks.",

    progressTitle: "Progress",
    progressP:
      "There is no separate progress callback. Iteration is the progress signal: yield a chunk after each unit of work and the caller advances its bar as chunks arrive.",

    chunkTitle: "Chunk type",
    chunkP:
      "A chunk is whatever your handler yields, decoded against the method output schema (.proto or .schema.json). The Chunk type parameter you pass to sb.stream<Req, Chunk>() and handleStream<Req, Chunk>() is that decoded payload. No envelope wraps it; you get the object directly.",

    replayTitle: "Replay via dashboard",
    replayP1:
      "The whole stream is a single RPC operation in the trace, not one op per chunk. The runtime captures the request payload (subject to the channel's capture mode). It does not store chunk output, so the SDK keeps no per-chunk replay buffer.",
    replayP2:
      "To re-run a captured call, open its trace in the dashboard and replay from there. Replay re-invokes the handler, which produces the stream from scratch.",
    replayTip:
      "sb.rpc.call() throws on a streaming method, and sb.stream() throws on a unary one. The method type comes from the .proto, so the caller must pick the matching call. CallOpts.retry is silently ignored on streams: a mid-stream replay would re-deliver chunks you already read.",

    optCallerNote:
      "sb.stream() takes the same CallOpts as sb.rpc.call(): transport, timeout, idempotencyKey. retry is ignored for streams.",
    pTransport: "transport",
    pTransportDesc:
      '"direct" | "proxy" | "auto" (default "auto"). direct streams callee→caller over mTLS; proxy routes through the runtime; auto picks direct when the endpoint is known, else proxy.',
    pTimeout: "timeout",
    pTimeoutDesc: 'Deadline for the whole stream, e.g. "30s". Covers the full lifetime, not one chunk.',
  },
  ru: {
    badge: "SDK Reference",
    title: "Стриминг",
    description:
      "Server-streaming RPC. Обработчик отдаёт чанки по одному, вызывающий читает их вживую через for await. Подходит для LLM-токенов, обновлений прогресса и любого ответа, который приходит частями.",

    howTitle: "Как работает",

    callerTitle: "sb.stream() — сторона вызывающего",
    callerP:
      "Стриминговый вызов запускаете через sb.stream() — он возвращает AsyncIterable декодированных чанков. До start() объявите зависимость через sb.service() и загрузите схему метода через sb.useSchema(), чтобы SDK мог декодировать каждый чанк.",

    handlerTitle: "sb.rpc.handleStream() — сторона обработчика",
    handlerP:
      "Обработчик регистрируете через sb.rpc.handleStream(). Это async-генератор: каждое значение, которое вы yield, превращается в один чанк на проводе. Возврат закрывает поток штатно; исключение закрывает его чанком с ошибкой. Схема обязательна.",

    consumeTitle: "Чтение чанков (for await)",
    consumeP:
      "Читайте итератор через for await. Каждый виток цикла даёт один декодированный чанк в том порядке, в котором обработчик его отдал.",

    llmTitle: "LLM-токены",
    llmP:
      "Потоковый вывод токенов ложится сюда напрямую. Обработчик отдаёт по токену, как только модель его сгенерировала, а вызывающий печатает каждый чанк сразу, как тот пришёл.",

    cancelTitle: "Отмена",
    cancelP:
      "Метода cancel() нет. Сделайте break или return из цикла for await — SDK закроет нижележащий gRPC-поток. Вызываемый увидит это закрытие как отменённый контекст и перестанет отдавать чанки.",

    progressTitle: "Прогресс",
    progressP:
      "Отдельного колбэка прогресса нет. Сигнал прогресса — сама итерация: отдавайте чанк после каждой единицы работы, и вызывающий двигает бар по мере их прихода.",

    chunkTitle: "Тип чанка",
    chunkP:
      "Чанк — это то, что отдаёт обработчик, декодированное по выходной схеме метода (.proto или .schema.json). Параметр типа Chunk, который вы передаёте в sb.stream<Req, Chunk>() и handleStream<Req, Chunk>(), и есть этот декодированный payload. Конверт его не оборачивает — вы получаете объект напрямую.",

    replayTitle: "Воспроизведение через дашборд",
    replayP1:
      "Весь поток — это одна RPC-операция в трейсе, а не по операции на чанк. Runtime захватывает request-payload (с учётом режима захвата канала). Вывод чанков он не хранит, поэтому SDK не держит буфер для пер-чанк воспроизведения.",
    replayP2:
      "Чтобы повторить захваченный вызов, откройте его трейс в дашборде и запустите воспроизведение оттуда. Воспроизведение заново вызывает обработчик, и тот производит поток с нуля.",
    replayTip:
      "sb.rpc.call() бросает исключение на стриминговом методе, а sb.stream() — на унарном. Тип метода задан в .proto, поэтому вызывающий обязан выбрать подходящий вызов. CallOpts.retry на потоках молча игнорируется: повтор посреди потока заново отдал бы уже прочитанные чанки.",

    optCallerNote:
      "sb.stream() принимает те же CallOpts, что и sb.rpc.call(): transport, timeout, idempotencyKey. retry для потоков игнорируется.",
    pTransport: "transport",
    pTransportDesc:
      '"direct" | "proxy" | "auto" (по умолчанию "auto"). direct стримит вызываемый→вызывающий по mTLS; proxy идёт через runtime; auto берёт direct, когда endpoint известен, иначе proxy.',
    pTimeout: "timeout",
    pTimeoutDesc: 'Дедлайн на весь поток, например "30s". Покрывает всё время жизни, а не один чанк.',
  },
};

export function PageStreaming() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      {/* ── How it works ─────────────────────────────────────────── */}
      <H2 id="how-it-works">{t.howTitle}</H2>
      <P>
        {locale === "ru" ? (
          <>
            Под капотом это <strong>server-streaming RPC</strong>. Обработчик регистрируется через{" "}
            <Mono>sb.rpc.handleStream()</Mono> как async-генератор и <Mono>yield</Mono>-ит чанки. Вызывающий
            запускает метод через <Mono>sb.stream()</Mono> и получает <Mono>AsyncIterable</Mono>, который
            читает через <Mono>for await</Mono>. Один <Mono>yield</Mono> у обработчика — один чанк у
            вызывающего, порядок сохраняется.
          </>
        ) : (
          <>
            Under the hood it is <strong>server-streaming RPC</strong>. The handler is an async generator
            registered with <Mono>sb.rpc.handleStream()</Mono>; it <Mono>yield</Mono>s chunks. The caller
            starts the method with <Mono>sb.stream()</Mono>, gets back an <Mono>AsyncIterable</Mono>, and
            reads it with <Mono>for await</Mono>. One <Mono>yield</Mono> on the handler is one chunk on the
            caller, in order.
          </>
        )}
      </P>

      {/* ── Caller side ──────────────────────────────────────────── */}
      <H2 id="get-trace-id">{t.callerTitle}</H2>
      <P>{t.callerP}</P>
      <MultiCodeBlock
        code={{
          ts: `// Declare the dependency and load the method schema BEFORE start().
sb.service("ai", { rpc: ["generate"] });
await sb.useSchema("ai", "generate", {
  protoFile: "./ai.proto",
  input: "GenerateRequest",
  output: "GenerateChunk",
});
await sb.start();

// stream() returns an AsyncIterable of decoded chunks.
for await (const chunk of sb.stream<{ prompt: string }, { token: string }>(
  "ai",
  "generate",
  { prompt: "Hello" },
)) {
  process.stdout.write(chunk.token);
}`,
        }}
      />
      <Callout type="info">{t.optCallerNote}</Callout>
      <ParamTable
        rows={[
          { name: t.pTransport, type: "string", default: '"auto"', desc: t.pTransportDesc },
          { name: t.pTimeout, type: "string", default: '"30s"', desc: t.pTimeoutDesc },
        ]}
      />

      {/* ── Handler side ─────────────────────────────────────────── */}
      <H2 id="write-chunks">{t.handlerTitle}</H2>
      <P>{t.handlerP}</P>
      <MultiCodeBlock
        code={{
          ts: `// The handler is an async generator. Each yield is one chunk.
sb.rpc.handleStream<{ prompt: string }, { token: string }>(
  "generate",
  async function* (req) {
    for await (const token of callLLM(req.prompt)) {
      yield { token };
    }
  },
  {
    schema: {
      protoFile: "./ai.proto",
      input: "GenerateRequest",
      output: "GenerateChunk",
    },
  },
);

await sb.start();`,
        }}
      />

      {/* ── Consuming chunks ─────────────────────────────────────── */}
      <H2 id="watch-trace">{t.consumeTitle}</H2>
      <P>{t.consumeP}</P>
      <MultiCodeBlock
        code={{
          ts: `const chunks: { token: string }[] = [];
for await (const chunk of sb.stream<{ prompt: string }, { token: string }>(
  "ai",
  "generate",
  { prompt: "Hello" },
  { transport: "direct", timeout: "30s" },
)) {
  chunks.push(chunk);
}
// chunks now holds every value the handler yielded, in order.`,
        }}
      />

      {/* ── LLM tokens ───────────────────────────────────────────── */}
      <H2 id="llm-streaming">{t.llmTitle}</H2>
      <P>{t.llmP}</P>
      <MultiCodeBlock
        code={{
          ts: `// Handler — yield each token as the model produces it.
sb.rpc.handleStream<{ prompt: string }, { token: string }>(
  "generate",
  async function* (req) {
    for await (const token of model.stream(req.prompt)) {
      yield { token };
    }
  },
  { schema: { protoFile: "./ai.proto", input: "GenerateRequest", output: "GenerateChunk" } },
);

// Caller — print each token as it arrives.
for await (const chunk of sb.stream<{ prompt: string }, { token: string }>(
  "ai",
  "generate",
  { prompt: "Write a poem" },
)) {
  process.stdout.write(chunk.token);
}`,
        }}
      />

      {/* ── Cancellation ─────────────────────────────────────────── */}
      <H2 id="sse-endpoint">{t.cancelTitle}</H2>
      <P>{t.cancelP}</P>
      <MultiCodeBlock
        code={{
          ts: `for await (const chunk of sb.stream<{ prompt: string }, { token: string }>(
  "ai",
  "generate",
  { prompt: "Hello" },
)) {
  process.stdout.write(chunk.token);
  if (chunk.token.includes(".")) break; // break cancels the gRPC stream
}
// The callee's handler stops producing once the stream is cancelled.`,
        }}
      />

      {/* ── Progress bars ────────────────────────────────────────── */}
      <H2 id="progress">{t.progressTitle}</H2>
      <P>{t.progressP}</P>
      <MultiCodeBlock
        code={{
          ts: `// Handler — yield a progress chunk per processed row.
sb.rpc.handleStream<{ reportId: string }, { pct: number }>(
  "report",
  async function* (req) {
    const rows = await db.fetchRows(req.reportId);
    for (let i = 0; i < rows.length; i++) {
      await processRow(rows[i]);
      yield { pct: Math.round(((i + 1) / rows.length) * 100) };
    }
  },
  { schema: { protoFile: "./reports.proto", input: "ReportRequest", output: "Progress" } },
);

// Caller — drive a progress bar.
for await (const chunk of sb.stream<{ reportId: string }, { pct: number }>(
  "reports",
  "report",
  { reportId: "rpt_42" },
)) {
  updateProgressBar(chunk.pct);
}`,
        }}
      />

      {/* ── Chunk type ───────────────────────────────────────────── */}
      <H2 id="event-shape">{t.chunkTitle}</H2>
      <P>{t.chunkP}</P>
      <MultiCodeBlock
        code={{
          ts: `// Req and Chunk are your own types, matched to the .proto messages.
sb.stream<Req, Chunk>(service: string, method: string, payload: Req, opts?: CallOpts):
  AsyncIterable<Chunk>;

sb.rpc.handleStream<Req, Chunk>(
  name: string,
  fn: (req: Req) => AsyncIterable<Chunk>, // async generator
  opts: { schema: SchemaSpec; captureMode?: "all" | "errors" | "none" },
): void;`,
        }}
      />

      {/* ── Replay via dashboard ─────────────────────────────────── */}
      <H2 id="replay">{t.replayTitle}</H2>
      <P>{t.replayP1}</P>
      <P>{t.replayP2}</P>
      <Callout type="tip">{t.replayTip}</Callout>
    </div>
  );
}
