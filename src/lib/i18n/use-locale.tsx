"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useSyncExternalStore } from "react";
import { zh, en, type Translations } from "./translations";

export type Locale = "zh" | "en";

const STORAGE_KEY = "daka-locale";
const LOCALE_EVENT = "daka-locale-change";

const localeMap: Record<Locale, Translations> = { zh, en };

function getSnapshot(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "zh";
}

function getServerSnapshot(): Locale {
  return "zh";
}

function subscribe(callback: () => void) {
  const onCustom = () => callback();
  window.addEventListener(LOCALE_EVENT, onCustom);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(LOCALE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "zh",
  setLocale: () => {},
  t: zh,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: localeMap[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocalePicker({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={`inline-flex rounded-lg bg-muted p-0.5 ${className ?? ""}`}>
      <button
        onClick={() => setLocale("zh")}
        className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
          locale === "zh"
            ? "bg-background shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        中文
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
          locale === "en"
            ? "bg-background shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
