import { MultiCodeBlock } from "../../ui/CodeBlock";
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
    badge: "Production",
    title: "Filter Expressions",
    description:
      "A wait_event step inside a workflow can attach a filter so it only resumes on a matching event. The filter is a JSON object: keys are JSON-path-lite expressions over the event payload, values are what each path must equal.",

    syntaxTitle: "DSL syntax",
    syntaxP1pre: "Add a",
    syntaxP1mid: "field to any",
    syntaxP1step: "step. It is a map",
    syntaxP1obj: "path → expected value",
    syntaxP1end:
      "where each key is a path into the published event payload, and each value is what that path must equal for the step to resume.",
    syntaxExample: "A run parks on this step until an event matches the filter:",
    pathTitle: "Path keys",
    pathP:
      "Keys are JSON-path-lite, rooted at the payload. They support object fields and numeric array indices only. A non-numeric index is rejected when the step is registered.",
    pathRows: [
      { name: "$.field", type: "object field", default: "", desc: "Read a top-level field." },
      {
        name: "$.a.b.c",
        type: "nested field",
        default: "",
        desc: "Walk nested objects by dot.",
      },
      {
        name: "$.list[0]",
        type: "array index",
        default: "",
        desc: "Read element at a non-negative integer index.",
      },
    ],
    valueTitle: "Match values",
    valueP1:
      "A value is matched for equality. A plain literal (string, number, boolean, object, array) is compared as-is.",
    valueP2pre: "If a value is itself a path string like",
    valueP2mid:
      "it is first resolved against the workflow run state, then the resolved value is what the event must equal. In Node, to match a literal that looks like a path, wrap it as",
    valueP2end:
      ". Go tells the two apart by type instead: wf.Path is the expression, and a plain string that reads like one is escaped for you.",

    operatorsTitle: "Operators",
    opP1pre: "There is exactly one operator:",
    opP1mid:
      "equality. Every key/value pair must match for the step to resume; pairs combine as logical AND. There are no",
    opP1ops: "> < != >=",
    opP1end: "comparison operators.",
    equalNote:
      "Equality is structural: numbers, strings, booleans, nested objects and arrays are compared by value. 100 and \"100\" are NOT equal.",
    missingTitle: "Missing paths and non-JSON",
    missingP1:
      "If a path is absent in the event payload, that pair does not match and the step keeps waiting.",
    missingP2pre: "An empty filter (no",
    missingP2mid: "or",
    missingP2end:
      ") matches every event of that name. A non-empty filter against a payload the publisher could not render as JSON never matches.",
    runtimeNote:
      "The filter is evaluated in the runtime against the event's JSON payload, before any workflow code runs. Non-matching events cost nothing — the step is simply not resumed.",
  },
  ru: {
    badge: "Production",
    title: "Фильтрующие выражения",
    description:
      "Шаг wait_event внутри воркфлоу может иметь фильтр, чтобы возобновляться только на подходящем событии. Фильтр — это JSON-объект: ключи — JSON-path-lite выражения по payload события, значения — то, чему этот путь должен быть равен.",

    syntaxTitle: "Синтаксис DSL",
    syntaxP1pre: "Добавьте поле",
    syntaxP1mid: "к любому шагу",
    syntaxP1step: ". Это карта",
    syntaxP1obj: "путь → ожидаемое значение",
    syntaxP1end:
      ", где каждый ключ — путь внутри payload опубликованного события, а каждое значение — то, чему этот путь должен быть равен, чтобы шаг возобновился.",
    syntaxExample: "Запуск стоит на этом шаге, пока событие не совпадёт с фильтром:",
    pathTitle: "Ключи-пути",
    pathP:
      "Ключи — это JSON-path-lite от корня payload. Поддерживают только поля объектов и числовые индексы массива. Нечисловой индекс отклоняется при регистрации шага.",
    pathRows: [
      { name: "$.field", type: "поле объекта", default: "", desc: "Чтение поля верхнего уровня." },
      {
        name: "$.a.b.c",
        type: "вложенное поле",
        default: "",
        desc: "Обход вложенных объектов через точку.",
      },
      {
        name: "$.list[0]",
        type: "индекс массива",
        default: "",
        desc: "Элемент по неотрицательному целому индексу.",
      },
    ],
    valueTitle: "Значения для сравнения",
    valueP1:
      "Значение сравнивается на равенство. Обычный литерал (строка, число, булево, объект, массив) сравнивается как есть.",
    valueP2pre: "Если значение само является путём-строкой, например",
    valueP2mid:
      "оно сначала вычисляется против состояния запуска воркфлоу, и уже вычисленному значению событие должно быть равно. В Node, чтобы сравнить с литералом, похожим на путь, оберните его как",
    valueP2end:
      ". В Go эти два случая различаются по типу: wf.Path — это выражение, а обычная строка, похожая на путь, экранируется за вас.",

    operatorsTitle: "Операторы",
    opP1pre: "Оператор ровно один:",
    opP1mid:
      "равенство. Все пары ключ/значение должны совпасть, чтобы шаг возобновился; пары объединяются по логическому AND. Операторов сравнения",
    opP1ops: "> < != >=",
    opP1end: "нет.",
    equalNote:
      "Равенство структурное: числа, строки, булевы, вложенные объекты и массивы сравниваются по значению. 100 и \"100\" НЕ равны.",
    missingTitle: "Отсутствующие пути и не-JSON",
    missingP1:
      "Если путь отсутствует в payload события, эта пара не совпадает и шаг продолжает ждать.",
    missingP2pre: "Пустой фильтр (нет",
    missingP2mid: "или",
    missingP2end:
      ") совпадает с любым событием этого имени. Непустой фильтр против payload, который издатель не смог представить как JSON, не совпадёт никогда.",
    runtimeNote:
      "Фильтр вычисляется в runtime по JSON-payload события, до того как выполнится код воркфлоу. Несовпадающие события не стоят ничего — шаг просто не возобновляется.",
  },
};

export function PageFilterExpr() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="syntax">{t.syntaxTitle}</H2>
      <P>
        {t.syntaxP1pre} <Mono>filter</Mono> {t.syntaxP1mid} <Mono>wait_event</Mono>
        {t.syntaxP1step} <Mono>{t.syntaxP1obj}</Mono> {t.syntaxP1end}
      </P>
      <P>{t.syntaxExample}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.workflow.handle("checkout", {
  steps: [
    {
      id: "await-payment",
      type: "wait_event",
      event: "payments.settled",
      filter: {
        "$.status": "success",
        "$.amount": 100,
      },
      timeoutSec: 600,
    },
  ],
});`,
          go: `err := c.Workflow.Handle("checkout", wf.Definition{
	Steps: []wf.Step{
		wf.WaitEvent{
			Control: wf.Control{ID: "await_payment", TimeoutSec: 600},
			Event:   wf.Name("payments.settled"),
			Filter: map[string]any{
				"$.status": "success",
				"$.amount": 100,
			},
		},
	},
})
if err != nil {
	log.Fatal(err)
}`,
        }}
      />

      <H3 id="path-keys">{t.pathTitle}</H3>
      <P>{t.pathP}</P>
      <ParamTable rows={t.pathRows} />

      <H3 id="match-values">{t.valueTitle}</H3>
      <P>{t.valueP1}</P>
      <P>
        {t.valueP2pre} <Mono>"$.input.orderId"</Mono>, {t.valueP2mid}{" "}
        <Mono>{`{ literal: "$.x" }`}</Mono>
        {t.valueP2end}
      </P>
      <MultiCodeBlock
        code={{
          ts: `{
  id: "await-shipment",
  type: "wait_event",
  event: "logistics.shipped",
  // "$.orderId" of the event must equal this run's input orderId
  filter: { "$.orderId": "$.input.orderId" },
}`,
          go: `awaitShipment := wf.WaitEvent{
	Control: wf.Control{ID: "await_shipment"},
	Event:   wf.Name("logistics.shipped"),
	// The event's "$.orderId" must equal this run's input orderId.
	// wf.Path marks the value as an expression; a bare string stays a literal.
	Filter: map[string]any{"$.orderId": wf.Path("$.input.orderId")},
}

err := c.Workflow.Handle("checkout", wf.Definition{Steps: []wf.Step{awaitShipment}})
if err != nil {
	log.Fatal(err)
}`,
        }}
      />

      <H2 id="operators">{t.operatorsTitle}</H2>
      <P>
        {t.opP1pre} <Mono>=</Mono> {t.opP1mid} <Mono>{t.opP1ops}</Mono> {t.opP1end}
      </P>
      <Callout type="warning">{t.equalNote}</Callout>

      <H3 id="missing-paths">{t.missingTitle}</H3>
      <P>{t.missingP1}</P>
      <P>
        {t.missingP2pre} <Mono>filter</Mono> {t.missingP2mid} <Mono>{`{}`}</Mono>
        {t.missingP2end}
      </P>
      <DocCodeBlock
        lang="json"
        code={`// event payload published as JSON
{ "status": "success", "amount": 100, "region": "eu" }

// filter — matches (status AND amount both equal)
{ "$.status": "success", "$.amount": 100 }

// filter — does NOT match (region missing in some payloads,
// "100" string is not equal to number 100)
{ "$.amount": "100" }`}
      />
      <Callout type="info">{t.runtimeNote}</Callout>
    </div>
  );
}
