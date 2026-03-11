import type React from "react";
import { useState } from "react";

const KW = new Set([
  "const",
  "let",
  "var",
  "async",
  "await",
  "import",
  "from",
  "export",
  "function",
  "return",
  "new",
  "true",
  "false",
  "null",
  "undefined",
  "if",
  "else",
  "for",
  "of",
  "in",
  "while",
  "do",
  "break",
  "continue",
  "try",
  "catch",
  "finally",
  "throw",
  "interface",
  "extends",
  "implements",
  "class",
  "this",
  "typeof",
  "void",
  "delete",
  "switch",
  "case",
  "default",
  "static",
  "readonly",
  "as",
  "type",
]);

function toStableLineEntries(code: string) {
  return code.split("\n").reduce<Array<{ key: string; line: string }>>((acc, line) => {
    const duplicates = acc.filter((entry) => entry.line === line).length;
    acc.push({ key: `line-${line}-${duplicates}`, line });
    return acc;
  }, []);
}

function highlight(code: string): React.ReactNode[] {
  return toStableLineEntries(code).map(({ key, line }) => {
    const parts: React.ReactNode[] = [];
    let i = 0;
    let k = 0;
    const push = (text: string, cls?: string) =>
      parts.push(
        <span key={k++} className={cls}>
          {text}
        </span>
      );

    while (i < line.length) {
      const ch = line[i];

      // Line comment
      if (ch === "/" && line[i + 1] === "/") {
        push(line.slice(i), "text-zinc-500 italic");
        break;
      }

      // Strings — ', ", ` (scan to closing quote, handling \-escapes)
      if (ch === '"' || ch === "'" || ch === "`") {
        let j = i + 1;
        while (j < line.length) {
          if (line[j] === "\\") {
            j += 2;
            continue;
          }
          if (line[j] === ch) {
            j++;
            break;
          }
          j++;
        }
        push(line.slice(i, j), "text-amber-300");
        i = j;
        continue;
      }

      // Numbers (not preceded by word char)
      if (/\d/.test(ch) && (i === 0 || /\W/.test(line[i - 1]))) {
        const m = line.slice(i).match(/^\d[\d_]*(\.\d+)?(e[+-]?\d+)?/);
        if (m) {
          push(m[0], "text-emerald-400");
          i += m[0].length;
          continue;
        }
      }

      // Arrow operator =>
      if (ch === "=" && line[i + 1] === ">") {
        push("=>", "text-violet-400");
        i += 2;
        continue;
      }

      // Identifiers
      const wm = line.slice(i).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
      if (wm) {
        const word = wm[0];
        // Look past optional whitespace for the next char
        let j = i + word.length;
        while (j < line.length && line[j] === " ") j++;
        const next = line[j] ?? "";

        let cls: string;
        if (KW.has(word)) {
          cls = "text-violet-400 font-medium";
        } else if (next === "(") {
          cls = "text-sky-300"; // function / method call
        } else if (next === ":" && line[j + 1] !== ":") {
          cls = "text-blue-300"; // object key or param annotation
        } else if (/^[A-Z]/.test(word)) {
          cls = "text-cyan-300"; // type / class name
        } else {
          cls = "text-zinc-200";
        }

        push(word, cls);
        i += word.length;
        continue;
      }

      // Braces / brackets — subtle colour
      if ("{}()[]".includes(ch)) {
        push(ch, "text-zinc-400");
      } else {
        push(ch, "text-zinc-500");
      }
      i++;
    }

    return (
      <span key={key} className="block leading-relaxed">
        {parts}
        {"\n"}
      </span>
    );
  });
}

export function CodeBlock({
  code,
  filename,
  lang = "ts",
}: {
  code: string;
  filename?: string;
  lang?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#080c18] overflow-hidden my-4 text-sm">
      {filename && (
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
          <span className="text-xs font-mono text-zinc-500">{filename}</span>
          <button
            type="button"
            onClick={copy}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto font-mono text-xs text-zinc-300">
        <code>{lang === "ts" || lang === "js" ? highlight(code.trim()) : code.trim()}</code>
      </pre>
    </div>
  );
}
