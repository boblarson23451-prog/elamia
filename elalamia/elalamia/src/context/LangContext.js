"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DICT } from "@/lib/i18n";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState("ar");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("elalamia_lang") : null;
    if (saved === "ar" || saved === "fr") setLang(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("elalamia_lang", lang);
  }, [lang, ready]);

  const t = (key) => DICT[lang]?.[key] || key;
  const field = (obj, base) => obj[`${base}_${lang}`];

  return (
    <LangContext.Provider value={{ lang, setLang, t, field, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
