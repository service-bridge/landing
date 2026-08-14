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
      "Server-streaming RPC. A handler emits chunks one at a time; the caller reads them live as they land. Good for LLM tokens, progress updates, and any response that arrives in pieces.",

    howTitle: "How it works",

    callerTitle: "sb.stream() — caller side",
    callerP:
      "A streaming call hands back something you iterate: an AsyncIterable of decoded chunks from sb.stream() in Node, an iter.Seq2 of (chunk, error) from sb.Stream in Go. Declare the method before the client goes online — sb.service() plus sb.useSchema() in Node, sb.NewMethod in Go — so the SDK can decode each chunk.",

    handlerTitle: "sb.rpc.handleStream() — handler side",
    handlerP:
      "Register the handler with sb.rpc.handleStream() / sb.HandleStream. In Node it is an async generator and every value you yield becomes one chunk on the wire; in Go it is a function that pushes each chunk through a send callback, and send blocks while the caller is behind — that is the backpressure. Returning closes the stream cleanly; failing closes it with the error.",

    consumeTitle: "Consuming chunks (for await)",
    consumeP:
      "Read the iterator with for await in Node, with a plain range in Go. Each turn of the loop hands you one decoded chunk, in the order the handler emitted it.",

    llmTitle: "LLM tokens",
    llmP:
      "Token streaming maps straight onto this. The handler emits a token at a time as the model produces it, and the caller prints each chunk the moment it lands.",

    cancelTitle: "Cancellation",
    cancelP:
      "There is no cancel() method. Leave the loop — break or return — and the SDK closes the underlying gRPC stream. The callee sees that close as a cancelled context and stops producing chunks. In Go the iterator's cleanup runs by construction, so an abandoned stream cannot leak the callee's handler.",

    progressTitle: "Progress",
    progressP:
      "There is no separate progress callback. Iteration is the progress signal: emit a chunk after each unit of work and the caller advances its bar as chunks arrive.",

    chunkTitle: "Chunk type",
    chunkP:
      "A chunk is whatever your handler emits, decoded against the method's output type. The Chunk type parameter — sb.stream<Req, Chunk>() in Node, sb.Stream[Req, Chunk] in Go — is that decoded payload. No envelope wraps it; you get the value directly.",

    replayTitle: "Replay via dashboard",
    replayP1:
      "The whole stream is a single RPC operation in the trace, not one op per chunk. The runtime captures the request payload (subject to the channel's capture mode). It does not store chunk output, so the SDK keeps no per-chunk replay buffer.",
    replayP2:
      "To re-run a captured call, open its trace in the dashboard and replay from there. Replay re-invokes the handler, which produces the stream from scratch.",
    replayTip:
      "A unary call fails on a streaming method and a streaming call fails on a unary one, so the caller has to pick the matching form. Retries never apply to a stream: a mid-stream replay would re-deliver chunks you already read.",

    optCallerNote:
      "A streaming call takes the same per-call options as a unary one: transport, timeout, idempotency key. Retries are ignored for streams.",
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
      "Server-streaming RPC. Обработчик отдаёт чанки по одному, вызывающий читает их вживую по мере прихода. Подходит для LLM-токенов, обновлений прогресса и любого ответа, который приходит частями.",

    howTitle: "Как работает",

    callerTitle: "sb.stream() — сторона вызывающего",
    callerP:
      "Стриминговый вызов возвращает то, что вы обходите циклом: AsyncIterable декодированных чанков из sb.stream() в Node и iter.Seq2 пар (чанк, ошибка) из sb.Stream в Go. Объявите метод до подъёма клиента — sb.service() плюс sb.useSchema() в Node, sb.NewMethod в Go — чтобы SDK мог декодировать каждый чанк.",

    handlerTitle: "sb.rpc.handleStream() — сторона обработчика",
    handlerP:
      "Обработчик регистрируется через sb.rpc.handleStream() / sb.HandleStream. В Node это async-генератор, и каждое значение, которое вы yield, превращается в один чанк на проводе; в Go — функция, проталкивающая каждый чанк через колбэк send, и send блокируется, пока вызывающий отстаёт, — это и есть backpressure. Возврат закрывает поток штатно, ошибка закрывает его с этой ошибкой.",

    consumeTitle: "Чтение чанков (for await)",
    consumeP:
      "Читайте итератор через for await в Node и обычным range в Go. Каждый виток цикла даёт один декодированный чанк в том порядке, в котором обработчик его отдал.",

    llmTitle: "LLM-токены",
    llmP:
      "Потоковый вывод токенов ложится сюда напрямую. Обработчик отдаёт по токену, как только модель его сгенерировала, а вызывающий печатает каждый чанк сразу, как тот пришёл.",

    cancelTitle: "Отмена",
    cancelP:
      "Метода cancel() нет. Выйдите из цикла — break или return — и SDK закроет нижележащий gRPC-поток. Вызываемый увидит это закрытие как отменённый контекст и перестанет отдавать чанки. В Go очистка итератора выполняется по построению, поэтому брошенный поток не может утечь обработчиком на стороне вызываемого.",

    progressTitle: "Прогресс",
    progressP:
      "Отдельного колбэка прогресса нет. Сигнал прогресса — сама итерация: отдавайте чанк после каждой единицы работы, и вызывающий двигает бар по мере их прихода.",

    chunkTitle: "Тип чанка",
    chunkP:
      "Чанк — это то, что отдаёт обработчик, декодированное по выходному типу метода. Параметр типа Chunk — sb.stream<Req, Chunk>() в Node и sb.Stream[Req, Chunk] в Go — и есть этот декодированный payload. Конверт его не оборачивает: вы получаете значение напрямую.",

    replayTitle: "Воспроизведение через дашборд",
    replayP1:
      "Весь поток — это одна RPC-операция в трейсе, а не по операции на чанк. Runtime захватывает request-payload (с учётом режима захвата канала). Вывод чанков он не хранит, поэтому SDK не держит буфер для пер-чанк воспроизведения.",
    replayP2:
      "Чтобы повторить захваченный вызов, откройте его трейс в дашборде и запустите воспроизведение оттуда. Воспроизведение заново вызывает обработчик, и тот производит поток с нуля.",
    replayTip:
      "Унарный вызов падает на стриминговом методе, а стриминговый — на унарном, поэтому вызывающий обязан выбрать подходящую форму. Повторы к потоку не применяются: повтор посреди потока заново отдал бы уже прочитанные чанки.",

    optCallerNote:
      "Стриминговый вызов принимает те же per-call опции, что и унарный: transport, timeout, ключ идемпотентности. Повторы для потоков игнорируются.",
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
            Под капотом это <strong>server-streaming RPC</strong>. Обработчик отдаёт чанки по одному:
            в Node это async-генератор на <Mono>sb.rpc.handleStream()</Mono>, в Go — функция, которая
            проталкивает каждый чанк через колбэк <Mono>send</Mono>. Вызывающий запускает метод и читает
            чанки по мере прихода: <Mono>for await</Mono> по <Mono>sb.stream()</Mono> в Node и обычный{" "}
            <Mono>range</Mono> по <Mono>iter.Seq2</Mono> из <Mono>sb.Stream</Mono> в Go. Один чанк на
            выходе — один чанк на входе, порядок сохраняется.
          </>
        ) : (
          <>
            Under the hood it is <strong>server-streaming RPC</strong>. The handler emits chunks one at a
            time: an async generator on <Mono>sb.rpc.handleStream()</Mono> in Node, a function that pushes
            each chunk through a <Mono>send</Mono> callback in Go. The caller starts the method and reads
            the chunks as they land — <Mono>for await</Mono> over <Mono>sb.stream()</Mono> in Node, a plain{" "}
            <Mono>range</Mono> over the <Mono>iter.Seq2</Mono> from <Mono>sb.Stream</Mono> in Go. One chunk
            out is one chunk in, in order.
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
          go: `// Declaring the method registers the dependency and binds the schema from
// its type parameters. Before Start.
ai := sb.NewClient(c, "ai")
generate, err := sb.NewMethod[*genpb.GenRequest, *genpb.Token](ai, "generate")
if err != nil {
	log.Fatal(err)
}

if err := c.Start(ctx); err != nil {
	log.Fatal(err)
}

// Stream yields (chunk, error) pairs — read them with a plain range.
for tok, err := range generate.Stream(ctx, &genpb.GenRequest{Prompt: "Hello"}) {
	if err != nil {
		log.Fatal(err)
	}
	fmt.Print(tok.GetText())
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
          go: `// Each call to send is one chunk. Returning closes the stream cleanly;
// returning an error closes it with that error.
err := sb.HandleStream(c, "generate",
	func(ctx context.Context, req *genpb.GenRequest, send func(*genpb.Token) error) error {
		for _, tok := range modelTokens(ctx, req.GetPrompt()) {
			if err := send(tok); err != nil {
				return err // the caller is gone; stop producing
			}
		}
		return nil
	})
if err != nil {
	log.Fatal(err)
}

if err := c.Start(ctx); err != nil {
	log.Fatal(err)
}`,
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
          go: `var chunks []*genpb.Token
for tok, err := range sb.Stream[*genpb.GenRequest, *genpb.Token](
	ctx, c, "ai", "generate", &genpb.GenRequest{Prompt: "Hello"},
	sb.WithTransport(sb.TransportDirect),
	sb.WithTimeout(30*time.Second),
) {
	if err != nil {
		log.Fatal(err)
	}
	chunks = append(chunks, tok)
}
// chunks now holds every value the handler sent, in order.
log.Println("received", len(chunks))`,
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
          go: `// Handler — send each token as the model produces it.
err := sb.HandleStream(c, "generate",
	func(ctx context.Context, req *genpb.GenRequest, send func(*genpb.Token) error) error {
		for _, tok := range modelTokens(ctx, req.GetPrompt()) {
			if err := send(tok); err != nil {
				return err
			}
		}
		return nil
	})
if err != nil {
	log.Fatal(err)
}

// Caller — print each token as it arrives.
for tok, err := range sb.Stream[*genpb.GenRequest, *genpb.Token](
	ctx, c, "ai", "generate", &genpb.GenRequest{Prompt: "Write a poem"},
) {
	if err != nil {
		log.Fatal(err)
	}
	fmt.Print(tok.GetText())
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
          go: `for tok, err := range sb.Stream[*genpb.GenRequest, *genpb.Token](
	ctx, c, "ai", "generate", &genpb.GenRequest{Prompt: "Hello"},
) {
	if err != nil {
		log.Fatal(err)
	}
	fmt.Print(tok.GetText())
	if strings.Contains(tok.GetText(), ".") {
		break // leaving the loop cancels the gRPC stream
	}
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
          go: `// Handler — send a progress chunk per processed row.
err := sb.HandleStream(c, "report",
	func(ctx context.Context, req *reportpb.ReportRequest, send func(*reportpb.Progress) error) error {
		rows, err := fetchRows(ctx, req.GetReportId())
		if err != nil {
			return err
		}
		for i, row := range rows {
			if err := processRow(ctx, row); err != nil {
				return err
			}
			pct := int32((i + 1) * 100 / len(rows))
			if err := send(&reportpb.Progress{Pct: pct}); err != nil {
				return err
			}
		}
		return nil
	})
if err != nil {
	log.Fatal(err)
}

// Caller — drive a progress bar.
for chunk, err := range sb.Stream[*reportpb.ReportRequest, *reportpb.Progress](
	ctx, c, "reports", "report", &reportpb.ReportRequest{ReportId: "rpt_42"},
) {
	if err != nil {
		log.Fatal(err)
	}
	updateProgressBar(chunk.GetPct())
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
          go: `func Stream[Req, Chunk proto.Message](
	ctx context.Context,
	c *sb.Client,
	service, method string,
	req Req,
	opts ...sb.CallOption,
) iter.Seq2[Chunk, error]

func HandleStream[Req, Chunk proto.Message](
	c *sb.Client,
	name string,
	fn func(ctx context.Context, req Req, send func(Chunk) error) error,
) error`,
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
