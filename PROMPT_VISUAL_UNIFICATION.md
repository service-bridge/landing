# Задача: Полная визуальная унификация лендинга ServiceBridge

## Контекст

Лендинг servicebridge-landing (React + Vite + Tailwind CSS + Framer Motion) содержит ~20 секций и множество визуально похожих, но стилистически разрозненных компонентов. Нужно привести всё к единому визуальному языку через создание переиспользуемых UI-компонентов с минимальным количеством вариантов. Один компонент = один внешний вид. Не должно быть 5-10 "тюнингов" у одного компонента — иначе разрозненность сохранится.

Стек: React, Tailwind CSS, Framer Motion, lucide-react, class-variance-authority. Утилита cn() из lib/utils.ts. Типографические классы определены в index.css (type-display-xl, type-body и т.д.). Дизайн-токены — CSS-переменные в :root.

---

## Фаза 1 — Дизайн-токены (index.css + tailwind.config.js)

### 1.1 Добавить недостающие токены

В index.css добавить:

- `--code-bg: 225 30% 5%` — единый фон для всех код-блоков (сейчас хаос: #080c18, #080d18, #060a14, #081018)
- `--code-chrome: 225 25% 7%` — фон chrome-бара (шапки) код-блоков
- `--surface: 0 0% 100% / 0.02` — полупрозрачный фон карточек (сейчас: bg-white/[0.02], bg-card/50, bg-card/60, bg-muted/40)
- `--surface-border: 0 0% 100% / 0.06` — граница карточек (сейчас: border-white/[0.06], border-white/[0.05], border-white/[0.08], border-border/60)
- `--section-border: 0 0% 100% / 0.04` — разделитель между секциями

В tailwind.config.js добавить эти цвета:

```js
code: {
  DEFAULT: "hsl(var(--code-bg))",
  chrome: "hsl(var(--code-chrome))",
},
surface: {
  DEFAULT: "hsl(var(--surface))",   // или rgba формат
  border: "hsl(var(--surface-border))",
},
```

### 1.2 Единый набор border-radius

Зафиксировать ровно 3 уровня скругления для компонентов:

- `rounded-xl` (12px) — маленькие элементы: MiniCard, badge, inline код-блок
- `rounded-2xl` (16px) — средние: карточки, панели, code-блоки
- `rounded-full` — только для badge/pill/tag

Удалить все случаи `rounded-[28px]`, `rounded-lg` для карточек.

---

## Фаза 2 — Создание unified UI-компонентов в src/ui/

### Компонент 2.1: `<Section>` — обёртка любой секции

Сейчас: каждая секция имеет свои отступы, max-width, border.

- feature-streams: `mx-auto max-w-7xl px-6 lg:px-8` (отличается от всех)
- feature-alerts: `py-24 sm:py-32 border-t border-border/40 px-4 sm:px-6` (отличается)
- feature-tracing: `border-y` вместо `border-t`
- Replaces, Features, UseCases: `py-24` без border
- Большинство feature-*: `py-24 border-t border-white/[0.04]`

Создать `src/ui/Section.tsx`:

```tsx
interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string; // для РЕДКИХ кастомных случаев (Hero)
}

export function Section({ id, children, className }: SectionProps) {
  // AnimatedSection внутри
  // className: "py-24 border-t border-[--section-border]"
  // Внутренний div: "container mx-auto px-4"
  // Контент: "max-w-6xl mx-auto"
}
```

Все секции оборачиваются в `<Section>`. Убирается весь хаос с padding, max-width, border. Hero — единственное исключение, получает className для кастомного padding.

### Компонент 2.2: `<SectionHeader>` — уже существует, нужно унифицировать использование

Сейчас: GetStarted и Replaces рендерят header inline вместо SectionHeader. В SectionHeader eyebrow = `text-sm font-semibold text-primary uppercase tracking-widest`, но в коде Replaces — свой бадж с border и bg. В Hero — свой стиль.

Требования:

- ВСЕ секции без исключения используют `<SectionHeader>`.
- Убрать из SectionHeader параметр className — он не нужен.
- Заголовок внутри секции: всегда `text-3xl sm:text-4xl font-bold tracking-tight font-display` (уже так).
- Градиент в заголовке: всегда `text-gradient` (не `text-primary`, не inline gradient). Унифицировать feature-streams и feature-alerts, которые используют `text-primary` вместо `text-gradient`.
- Eyebrow: всегда через компонент `<Eyebrow>` (см. 2.3). SectionHeader внутри рендерит `<Eyebrow variant="plain">` для eyebrow prop. Replaces и GetStarted используют Eyebrow напрямую (plain или pill).
- Subtitle: всегда `text-lg text-muted-foreground max-w-2xl mx-auto`.

### Компонент 2.3: `<Eyebrow>` — единый eyebrow/метка секции

Сейчас 3 разных реализации eyebrow-элементов:

1. **SectionHeader / Features**: `<p class="text-sm font-semibold text-primary uppercase tracking-widest mb-4">FEATURES</p>` — plain text
2. **Replaces (главный)**: `inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 mb-6` + иконка + `text-sm font-semibold text-primary uppercase tracking-widest`
3. **Replaces (vs mesh)**: `inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.07] px-4 py-1.5 mb-6` + `text-sm font-semibold text-violet-400 uppercase tracking-widest`

Создать `src/ui/Eyebrow.tsx`:

```tsx
interface EyebrowProps {
  children: React.ReactNode;
  variant?: "plain" | "pill";  // plain = текст без обёртки, pill = rounded-full с border/bg
  tone?: string;               // для pill: "border-primary/20 bg-primary/[0.06] text-primary" или "border-violet-500/25 bg-violet-500/[0.07] text-violet-400"
  icon?: React.ReactNode;       // опционально для pill (CheckCircle2 и т.д.)
}

export function Eyebrow({ children, variant = "plain", tone, icon }: EyebrowProps) {
  // plain: "text-sm font-semibold text-primary uppercase tracking-widest mb-4"
  // pill: "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-6" + tone + icon + span с тем же текстовым стилем
}
```

- SectionHeader внутри использует `<Eyebrow variant="plain">` для eyebrow prop
- Features — через SectionHeader (уже будет Eyebrow)
- Replaces "Simplify your stack" → `<Eyebrow variant="pill" tone="border-primary/20 bg-primary/[0.06] text-primary" icon={<CheckCircle2 />}>Simplify your stack</Eyebrow>`
- Replaces "VS TRADITIONAL SERVICE MESH" → `<Eyebrow variant="pill" tone="border-violet-500/25 bg-violet-500/[0.07] text-violet-400">VS TRADITIONAL SERVICE MESH</Eyebrow>`

Допустимы только 2 варианта: plain и pill. Tone — только для pill.

### Компонент 2.4: `<Badge>` — единый бадж/тег/pill

Сейчас 5 разных реализаций badge (eyebrow вынесен выше):

1. SectionTag (feature-shared.tsx): `rounded-full border px-2.5 py-1 text-3xs font-mono font-semibold` + tone
2. Features FeatureCard: `text-3xs font-mono font-semibold rounded-full border px-2 py-0.5` + badgeColor
3. UseCases Badge: `text-3xs font-mono font-semibold rounded-full border px-2 py-0.5` + colorClass
4. feature-alerts cards: `rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-2xs font-medium text-muted-foreground`
5. feature-jobs ViaTag: ещё один inline badge

Создать ОДИН компонент `src/ui/Badge.tsx`:

```tsx
interface BadgeProps {
  children: React.ReactNode;
  tone?: string; // классы цвета: "text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
}

export function Badge({ children, tone }: BadgeProps) {
  // Один фиксированный стиль:
  // "inline-flex items-center rounded-full border px-2.5 py-0.5 text-3xs font-mono font-semibold"
  // + tone для цвета
}
```

`tone` — это ТОЛЬКО цвет (text + border + bg), НЕ размер, НЕ padding, НЕ font-size. Размер и стиль — фиксированные.

Заменить SectionTag, все inline badge в Features, UseCases, Alerts, Jobs на `<Badge>`. Удалить SectionTag из feature-shared.tsx. Eyebrow-баджи в Replaces — через `<Eyebrow variant="pill">`, не Badge.

### Компонент 2.5: `<Card>` — единая карточка

Сейчас:

- MiniCard: `rounded-xl border border-white/[0.06] bg-white/[0.02] p-4`
- FlowTile: `rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4`
- Features FeatureCard: `rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6`
- feature-alerts cards: `rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6`
- feature-streams: `rounded-xl border bg-card/50 p-4`
- feature-dashboard stat: `rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5`

Создать `src/ui/Card.tsx`:

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  // Один стиль: "rounded-2xl border border-surface-border bg-surface p-5"
  // className — только для grid-специфичных вещей (col-span-2)
}
```

Один border-radius, один bg, один border, один padding. Все карточки на странице выглядят одинаково. MiniCard, FlowTile, FeatureCard, AlertCard — все используют `<Card>` как обёртку.

### Компонент 2.6: `<CodePanel>` — единый код-блок / терминал / демо-панель

Сейчас:

- CodeBlock.tsx: `rounded-xl border border-white/[0.07] bg-[#080c18]`
- feature-direct-rpc: `rounded-[28px] border border-white/[0.08] bg-white/[0.02]` + chrome bar `bg-[#080c18] px-4 py-2.5`
- feature-http: chrome bar `bg-[#080d18]` (другой цвет!)
- feature-tracing: `rounded-2xl border border-white/[0.08] bg-[#080c18]`, chrome `bg-[#060a14]`
- feature-jobs: `rounded-[28px]`, chrome `bg-[#080c18]`
- GetStarted: `rounded-xl border border-white/[0.06] bg-[#080c18]`, chrome `px-4 py-2`
- RunFlow: `rounded-2xl border border-white/[0.08] bg-[#080c18]` + тройка точек

Создать `src/ui/CodePanel.tsx`:

```tsx
interface CodePanelProps {
  title?: string;      // текст в chrome bar
  children: React.ReactNode;
  className?: string;  // для внешнего позиционирования
}

export function CodePanel({ title, children, className }: CodePanelProps) {
  // Обёртка: "rounded-2xl border border-surface-border bg-code overflow-hidden" + className
  // Chrome bar (если title): "flex items-center gap-2 border-b border-surface-border bg-code-chrome px-4 py-2.5"
  //   Три точки: "h-2.5 w-2.5 rounded-full bg-white/[0.07]" x3
  //   Title: "text-xs font-mono text-zinc-500 ml-2"
  // Content area: children
}
```

Этот компонент заменяет:

- Все inline "окна" с chrome bar в feature-секциях
- Терминал в GetStarted
- Визуальные демо-панели (tracing waterfall, dashboard mock, и т.д.)
- Существующий CodeBlock.tsx тоже рефакторится — внутри использует CodePanel как обёртку

### Компонент 2.7: `<FeatureSection>` — шаблон feature-секции

Все 11 feature-секций имеют идентичную структуру:

1. Section обёртка
2. SectionHeader (eyebrow + title + subtitle)
3. Двухколоночный grid: текст+карточки слева, визуальная демо справа
4. MiniCard grid внизу (необязательно)

Сейчас grid-колонки разные: `1.1fr 0.9fr`, `1.08fr 0.92fr`, `1.06fr 0.94fr`, `2`, `max-w-4xl` (single column).

Создать `src/ui/FeatureSection.tsx`:

```tsx
interface FeatureSectionProps {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  content: React.ReactNode;   // левая колонка (описание, bullet-points)
  demo: React.ReactNode;      // правая колонка (CodePanel, визуализация)
  cards?: React.ReactNode;    // MiniCard grid под основным контентом
}

export function FeatureSection({ id, eyebrow, title, subtitle, content, demo, cards }: FeatureSectionProps) {
  // <Section id={id}>
  //   <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
  //   <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
  //     <div>{content}</div>
  //     <div>{demo}</div>
  //   </div>
  //   {cards && <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards}</div>}
  // </Section>
}
```

Единый grid, единый gap, единый колоночный split для ВСЕХ feature-секций.

### Компонент 2.8: `<MiniCard>` — рефакторинг существующего

MiniCard уже есть, но:

- У него `rounded-xl`, а у Card будет `rounded-2xl` — нужно привести
- Привести к использованию `<Card>` как обёртки
- Паттерн MiniCard grid тоже должен быть унифицирован:
  - Сейчас: `gap-3` vs `gap-4`, `sm:grid-cols-2` vs `sm:grid-cols-3` vs `lg:grid-cols-4`, `mt-8` vs `mt-10`
  - Унифицировать: `grid gap-3 sm:grid-cols-2 lg:grid-cols-4` для 4+ карточек, `sm:grid-cols-3` для 3 карточек

### Компонент 2.9: `<ChromeDots>` — тройка точек окна (вспомогательный)

Три разноцветные/серые точки используются в 8+ местах с разными стилями:

- `h-3 w-3 rounded-full bg-white/[0.07]` (RunFlow)
- `w-2.5 h-2.5 rounded-full` + `bg-[#ff5f57]`/`bg-[#ffbd2e]`/`bg-[#28c840]` (feature-direct-rpc)
- `w-2 h-2 rounded-full bg-white/[0.08]` (feature-tracing)

Унифицировать в одном месте внутри CodePanel. Везде одинаковые серые точки `h-2.5 w-2.5 rounded-full bg-white/[0.07]` — нет нужды в цветных, это не macOS окно.

---

## Фаза 3 — Унификация типографики внутри секций

### 3.1 Подзаголовки внутри секций

Сейчас:

- `text-xl font-semibold font-display` (в одних секциях)
- `text-lg font-semibold font-display` (в других)
- `text-base font-semibold` (в третьих)

Стандарт: всегда `type-subsection-title` (уже определён в index.css как `text-lg font-semibold tracking-tight font-display`).

### 3.2 Описания / body text

Сейчас:

- `text-sm leading-relaxed text-muted-foreground`
- `text-xs text-muted-foreground`
- `text-sm text-muted-foreground`
- `text-base text-muted-foreground`

Стандарт: `type-body-sm` для коротких описаний в карточках, `type-body` для основного текста. Никаких inline `text-sm text-muted-foreground` — только CSS-классы из системы.

### 3.3 Overline / метки

Сейчас: `type-overline-mono text-zinc-500` vs `type-overline-mono text-zinc-600`.

Стандарт: всегда `type-overline-mono text-muted-foreground`.

---

## Фаза 4 — Миграция каждой секции

### Hero

- Обернуть в `<Section>`, дать className для кастомного padding `pt-32 pb-20 lg:pt-44 lg:pb-32`
- Бадж "Open Source" — использовать `<Badge>`
- Код-команды внизу — использовать `<CodePanel>`

### Replaces

- Обернуть в `<Section>`
- Inline header → `<SectionHeader>` (или оставить кастомный layout, но использовать Eyebrow)
- Eyebrow "Simplify your stack" → `<Eyebrow variant="pill" tone="border-primary/20 bg-primary/[0.06] text-primary" icon={<CheckCircle2 />}>Simplify your stack</Eyebrow>`
- Eyebrow "VS TRADITIONAL SERVICE MESH" → `<Eyebrow variant="pill" tone="border-violet-500/25 bg-violet-500/[0.07] text-violet-400">VS TRADITIONAL SERVICE MESH</Eyebrow>`
- Before/after карточки → `<Card>`
- Inline badge на карточках (Sidecar, Service Mesh и т.д.) → `<Badge>`

### Features

- Обернуть в `<Section>`
- Eyebrow "FEATURES" — уже через SectionHeader, внутри SectionHeader рендерит `<Eyebrow variant="plain">`
- FeatureCard → `<Card>` + `<Badge>` внутри
- Убрать inline badge стили

### UseCases

- Обернуть в `<Section>`
- Inline Badge → `<Badge>`
- ServiceNode → использовать `ServicePill` из feature-shared (или переименовать в shared UI)
- Hub карточка → `<Card>`

### RunFlow

- Обернуть в `<Section>`
- Inline header → `<SectionHeader>`
- Window/terminal → `<CodePanel>`
- Type badges (`event`, `rpc`, `job`, `workflow`) → `<Badge>`

### Code

- Обернуть в `<Section>`
- Уже использует CodeBlock, но CodeBlock должен быть переделан на CodePanel внутри

### Architecture

- Обернуть в `<Section>`

### feature-direct-rpc

- Использовать `<FeatureSection>`
- Demo panel → `<CodePanel>`
- Info cards → `<Card>`
- MiniCard grid — стандартный

### feature-http

- Использовать `<FeatureSection>`
- Demo → `<CodePanel>`
- Route catalog → `<Card>`

### feature-durable-events

- Использовать `<FeatureSection>`
- Pipeline stages → `<Card>` (вместо кастомных FlowTile-подобных)
- Demo → `<CodePanel>`

### feature-streams

- Использовать `<FeatureSection>`
- Привести section wrapper с `max-w-7xl px-6 lg:px-8` к стандартному `<Section>`
- Feature bullet cards `bg-card/50` → `<Card>`
- Live terminal → `<CodePanel>`

### feature-workflows

- Использовать `<FeatureSection>`
- Workflow DAG visual → `<CodePanel>`

### feature-jobs

- Использовать `<FeatureSection>`
- Tab card → `<CodePanel>`
- ViaTag → `<Badge>`

### feature-discovery-map

- Использовать `<FeatureSection>`
- Registry table → `<CodePanel>`

### feature-tracing

- Использовать `<FeatureSection>` (single-column layout → content без demo, demo на всю ширину под content)
- Waterfall → `<CodePanel>`
- OutcomePill → `<Badge>`

### feature-observability

- Использовать `<FeatureSection>`
- Metrics cards → `<Card>`
- Убрать `group.tone.replace("text-", "bg-")` хак

### feature-alerts

- Использовать `<FeatureSection>`
- Привести `border-border/60 bg-card/60 backdrop-blur-sm` → стандартный `<Card>`
- Tags `border-border/60 bg-muted/40 text-2xs` → `<Badge>`

### feature-dashboard

- Использовать `<FeatureSection>`
- Stat boxes `rounded-lg border-white/[0.05] p-2.5` → `<Card>`
- StatusBadge → `<Badge>`

### GetStarted

- Обернуть в `<Section>`
- Inline header → `<SectionHeader>`
- Код-блоки → `<CodePanel>`
- Step number circles — оставить inline, но унифицировать стиль

---

## Фаза 5 — Очистка

1. Удалить `src/sections/feature-shared.tsx` — FlowTile, ServicePill, SectionTag больше не нужны (заменены на Card и Badge)
2. Из CodeBlock.tsx убрать дублирующие стили — он внутри использует CodePanel
3. Grep по всему проекту на:
   - `bg-[#08` — заменить на `bg-code`
   - `border-white/[0.0` — заменить на `border-surface-border`
   - `bg-white/[0.02]` и `bg-white/[0.03]` — заменить на `bg-surface`
   - `rounded-[28px]` — заменить на `rounded-2xl`
   - `rounded-lg` на карточках — заменить на `rounded-2xl`
   - `border-border/40`, `border-border/60` — заменить на `border-surface-border`
   - `bg-card/50`, `bg-card/60`, `bg-muted/40` — заменить на `bg-surface`
   - Inline `text-sm font-semibold text-primary uppercase tracking-widest` — заменить на `<Eyebrow>` (plain или pill)
4. Убрать `backdrop-blur-sm` с карточек — если все карточки одинаковые, blur не нужен

---

## Итоговая структура src/ui/

```
src/ui/
  Section.tsx          — обёртка секции (padding, border, container, max-w, AnimatedSection)
  SectionHeader.tsx    — eyebrow + title + subtitle (уже есть, внутри использует Eyebrow)
  Eyebrow.tsx         — единый eyebrow: plain (текст) или pill (с border/bg, tone, icon)
  Card.tsx             — единая карточка
  Badge.tsx            — единый badge/tag/pill (маленькие теги в карточках)
  CodePanel.tsx       — код-блок / терминал / демо-панель с chrome bar
  CodeBlock.tsx       — syntax-highlighted code (использует CodePanel внутри)
  Tabs.tsx            — табы (уже есть, оставить как есть)
  MiniCard.tsx        — карточка с иконкой (рефакторить, использует Card внутри)
  FeatureSection.tsx  — шаблон feature-секции (header + 2-col grid + cards)
  button.tsx          — кнопка (уже есть, оставить)
```

---

## Правила

1. **НЕ добавлять** variant/size пропсы в Card, Badge, CodePanel, Section. Один компонент = один внешний вид. Если где-то нужен "другой" стиль — значит дизайн секции нужно адаптировать под единый стиль, а не компонент подгонять.

2. Допустимые варианты: tone/цвет в Badge; variant (plain | pill) в Eyebrow — только 2 варианта, семантически это один элемент (метка секции).

3. `className` проп — только для позиционирования (mt-*, col-span-*, и т.д.), **НИКОГДА** для переопределения внутренних стилей компонента.

4. Все hardcoded hex-цвета (#080c18 и т.д.) заменить на дизайн-токены.

5. Все inline typography заменить на классы из type-system (type-body, type-body-sm, type-subsection-title и т.д.).

6. После рефакторинга каждой секции визуально проверить что ничего не сломалось.
