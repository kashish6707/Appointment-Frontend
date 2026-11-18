"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { patientStrings, type Lang, type PatientStrings } from "./patient";

const STORAGE_KEY = "clinically.lang";

type LangContext = { lang: Lang; setLang: (lang: Lang) => void; t: PatientStrings };

const Ctx = createContext<LangContext>({ lang: "en", setLang: () => {}, t: patientStrings.en });

/** English or Hindi for the patient pages. The choice is remembered on this device. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Read the saved choice after the first render, so server and browser render the same HTML.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "hi") setLangState(saved);
    } catch {
      /* storage blocked: stay in English */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked: the choice lasts until the page closes */
    }
  }, []);

  return <Ctx.Provider value={{ lang, setLang, t: patientStrings[lang] }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
