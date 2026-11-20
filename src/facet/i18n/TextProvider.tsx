import { createContext, useContext, useMemo, type ReactNode } from "react";
import { de } from "./de";
import { en, type Dictionary, type TextKey } from "./en";

export type FacetLocale = "en" | "de";

export type TextParams = Readonly<Record<string, string | number>>;

export type PluralKey = {
  [K in TextKey]: K extends `${infer B}.other` ? (`${B}.one` extends TextKey ? B : never) : never;
}[TextKey];

export type FacetText = {
  locale: string;

  t: (key: TextKey, params?: TextParams) => string;

  plural: (key: PluralKey, count: number, params?: TextParams) => string;

  number: (n: number) => string;
};

const BUILT_IN: Record<FacetLocale, Dictionary> = { en, de };

function build(locale: string, overrides?: Partial<Dictionary>): FacetText {
  const lang = locale.toLowerCase().split("-")[0] as FacetLocale;
  const base = BUILT_IN[lang] ?? en;
  const dict: Dictionary = overrides ? { ...base, ...overrides } : base;
  const nf = new Intl.NumberFormat(locale);
  const rules = new Intl.PluralRules(locale);
  const number = (n: number) => nf.format(n);
  const fill = (text: string, params?: TextParams) =>
    params
      ? text.replace(/\{\{(\w+)\}\}/g, (whole, name: string) => {
          const v = params[name];
          if (v == null) return whole;
          return typeof v === "number" ? number(v) : v;
        })
      : text;
  const t = (key: TextKey, params?: TextParams) => fill(dict[key] ?? key, params);
  const plural = (key: PluralKey, count: number, params?: TextParams) => {
    const form = rules.select(count) === "one" ? "one" : "other";
    return t(`${key}.${form}` as TextKey, { count, ...params });
  };
  return { locale, t, plural, number };
}

export function createText(locale: string, overrides?: Partial<Dictionary>): FacetText {
  return build(locale, overrides);
}

const ENGLISH = build("en");
const TextContext = createContext<FacetText>(ENGLISH);

export type FacetTextProviderProps = {
  locale?: FacetLocale | (string & {});

  dictionary?: Partial<Dictionary>;
  children: ReactNode;
};

export function FacetTextProvider({ locale = "en", dictionary, children }: FacetTextProviderProps) {
  const value = useMemo(() => build(locale, dictionary), [locale, dictionary]);
  return <TextContext.Provider value={value}>{children}</TextContext.Provider>;
}

export function useText(): FacetText {
  return useContext(TextContext);
}
