import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { type CodeLangs, type FilenameLangs, type SdkLang, SDK_LANGS, useSdkLang } from "../lib/language-context";
import { CodePanel } from "./CodePanel";
import { TabStrip } from "./Tabs";

// ─── Keyword sets ─────────────────────────────────────────────────────────────

const TS_KW = new Set([
  "const", "let", "var", "async", "await", "import", "from", "export",
  "function", "return", "new", "true", "false", "null", "undefined",
  "if", "else", "for", "of", "in", "while", "do", "break", "continue",
  "try", "catch", "finally", "throw", "interface", "extends", "implements",
  "class", "this", "typeof", "void", "delete", "switch", "case", "default",
  "static", "readonly", "as", "type",
]);

const GO_KW = new Set([
  "package", "import", "func", "var", "type", "struct", "interface", "return",
  "if", "else", "for", "range", "go", "defer", "chan", "map", "nil", "true",
  "false", "const", "switch", "case", "break", "continue", "fallthrough",
  "select", "default", "make", "new", "len", "cap", "append", "error",
]);

const PY_KW = new Set([
  "def", "async", "await", "import", "from", "return", "if", "elif", "else",
  "for", "in", "with", "as", "class", "None", "True", "False", "self",
  "not", "and", "or", "pass", "raise", "try", "except", "finally", "lambda",
  "yield", "break", "continue", "global", "nonlocal", "del", "is", "while",
]);

// ─── Stable line key helper ───────────────────────────────────────────────────

function toStableLines(code: string) {
  return code.split("\n").reduce<Array<{ key: string; line: string }>>((acc, line) => {
    const dups = acc.filter((e) => e.line === line).length;
    acc.push({ key: `${line}-${dups}`, line });
    return acc;
  }, []);
}

// ─── Generic token-based highlighter ─────────────────────────────────────────

function highlight(
  code: string,
  kw: Set<string>,
  commentChar: string,
): React.ReactNode[] {
  return toStableLines(code).map(({ key, line }) => {
    const parts: React.ReactNode[] = [];
    let i = 0;
    let k = 0;
    const push = (text: string, cls?: string) =>
      parts.push(<span key={k++} className={cls}>{text}</span>);

    while (i < line.length) {
      const ch = line[i];

      // Decorator @identifier (Python)
      if (ch === "@" && commentChar === "#") {
        const m = line.slice(i + 1).match(/^[A-Za-z_][A-Za-z0-9_.()]*/);
        if (m) {
          push(`@${m[0]}`, "text-fuchsia-300");
          i += 1 + m[0].length;
          continue;
        }
      }

      // Single-line comment
      const isLineComment =
        (commentChar === "//" && ch === "/" && line[i + 1] === "/") ||
        (commentChar === "#" && ch === "#");
      if (isLineComment) {
        push(line.slice(i), "text-zinc-500 italic");
        break;
      }

      // Strings: ", ', `
      if (ch === '"' || ch === "'" || ch === "`") {
        let j = i + 1;
        while (j < line.length) {
          if (line[j] === "\\") { j += 2; continue; }
          if (line[j] === ch) { j++; break; }
          j++;
        }
        push(line.slice(i, j), "text-amber-300");
        i = j;
        continue;
      }

      // Numbers
      if (/\d/.test(ch) && (i === 0 || /\W/.test(line[i - 1]))) {
        const m = line.slice(i).match(/^\d[\d_]*(\.\d+)?(e[+-]?\d+)?/);
        if (m) {
          push(m[0], "text-emerald-400");
          i += m[0].length;
          continue;
        }
      }

      // Arrow operator (TS)
      if (ch === "=" && line[i + 1] === ">") {
        push("=>", "text-violet-400");
        i += 2;
        continue;
      }

      // Identifiers
      const wm = line.slice(i).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
      if (wm) {
        const word = wm[0];
        let j = i + word.length;
        while (j < line.length && line[j] === " ") j++;
        const next = line[j] ?? "";

        let cls: string;
        if (kw.has(word)) {
          cls = "text-violet-400 font-medium";
        } else if (next === "(") {
          cls = "text-sky-300";
        } else if (next === ":" && line[j + 1] !== ":") {
          cls = "text-blue-300";
        } else if (/^[A-Z]/.test(word)) {
          cls = "text-cyan-300";
        } else {
          cls = "text-zinc-200";
        }

        push(word, cls);
        i += word.length;
        continue;
      }

      // Braces / brackets
      if ("{}()[]".includes(ch)) {
        push(ch, "text-zinc-400");
      } else {
        push(ch, "text-zinc-500");
      }
      i++;
    }

    return (
      <span key={key} className="block leading-relaxed">
        {parts}{"\n"}
      </span>
    );
  });
}

function highlightCode(code: string, lang: SdkLang): React.ReactNode[] {
  if (lang === "go") return highlight(code, GO_KW, "//");
  if (lang === "py") return highlight(code, PY_KW, "#");
  return highlight(code, TS_KW, "//");
}

// ─── Lang dot colours (for filename indicator) ────────────────────────────────

const LANG_DOT: Record<SdkLang, string> = {
  ts: "bg-blue-400",
  go: "bg-cyan-400",
  py: "bg-yellow-400",
};

// ─── Shared copy button ───────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
    >
      {copied
        ? <Check className="w-3 h-3 text-emerald-400" />
        : <Copy className="w-3 h-3" />}
      <span className={copied ? "text-emerald-400" : ""}>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

// ─── Base CodeBlock ───────────────────────────────────────────────────────────

export function CodeBlock({
  code,
  filename,
  lang = "ts",
}: {
  code: string;
  filename?: string;
  lang?: SdkLang | "js";
}) {
  const displayLang: SdkLang = lang === "js" ? "ts" : (lang as SdkLang);

  return (
    <CodePanel className="group relative">
      <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-zinc-300">
        <code>{highlightCode(code.trim(), displayLang)}</code>
      </pre>
    </CodePanel>
  );
}

// ─── MultiCodeBlock — syncs with global language context ──────────────────────

export function MultiCodeBlock({
  code,
  filename,
}: {
  code: CodeLangs;
  filename?: FilenameLangs | string;
}) {
  const { lang, setLang } = useSdkLang();

  const available = SDK_LANGS.filter((l) => code[l.id]);
  const displayLang: SdkLang = code[lang] ? lang : (available[0]?.id ?? "ts");
  const displayCode = code[displayLang] ?? code.ts;
  const displayFilename =
    typeof filename === "string"
      ? filename.replace(/\.(ts|go|py)$/, `.${displayLang === "py" ? "py" : displayLang === "go" ? "go" : "ts"}`)
      : (filename?.[displayLang] ?? filename?.ts);

  return (
    <CodePanel>
      <div className="flex items-center justify-between gap-3 border-b border-surface-border bg-white/[0.02] px-3 py-2">
        <TabStrip size="sm" items={available} active={displayLang} onChange={setLang} />
        <CopyButton text={displayCode} />
      </div>

      <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-zinc-300">
        <code>{highlightCode(displayCode.trim(), displayLang)}</code>
      </pre>
    </CodePanel>
  );
}
