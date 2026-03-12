import { createContext, useContext, useState } from "react";

export type SdkLang = "ts" | "go" | "py";

export const SDK_LANGS: { id: SdkLang; label: string; short: string; ext: string }[] = [
  { id: "ts", label: "TypeScript", short: "TS", ext: "ts" },
  { id: "go", label: "Go", short: "Go", ext: "go" },
  { id: "py", label: "Python", short: "Py", ext: "py" },
];

interface LanguageCtx {
  lang: SdkLang;
  setLang: (lang: SdkLang) => void;
}

const LanguageContext = createContext<LanguageCtx>({
  lang: "ts",
  setLang: () => {},
});

function readStoredLang(): SdkLang {
  try {
    const stored = localStorage.getItem("sb-sdk-lang");
    if (stored === "ts" || stored === "go" || stored === "py") return stored;
  } catch {}
  return "ts";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SdkLang>(readStoredLang);

  const setLang = (l: SdkLang) => {
    setLangState(l);
    try {
      localStorage.setItem("sb-sdk-lang", l);
    } catch {}
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useSdkLang(): LanguageCtx {
  return useContext(LanguageContext);
}

/** Map of code per language. At least `ts` should always be provided. */
export type CodeLangs = { ts: string; go?: string; py?: string };
/** Map of filenames per language. Falls back to ts filename if not specified. */
export type FilenameLangs = { ts?: string; go?: string; py?: string };
