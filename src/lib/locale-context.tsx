import { createContext, useContext, useState } from "react";

export type UILocale = "en" | "ru";

interface LocaleCtx {
  locale: UILocale;
  setLocale: (l: UILocale) => void;
}

const LocaleContext = createContext<LocaleCtx>({ locale: "en", setLocale: () => {} });

function readStoredLocale(): UILocale {
  try {
    const s = localStorage.getItem("sb-ui-locale");
    if (s === "en" || s === "ru") return s;
    if (navigator.language.startsWith("ru")) return "ru";
  } catch {}
  return "en";
}

export function DocLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<UILocale>(readStoredLocale);
  const setLocale = (l: UILocale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("sb-ui-locale", l);
    } catch {}
  };
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useDocLocale(): LocaleCtx {
  return useContext(LocaleContext);
}
