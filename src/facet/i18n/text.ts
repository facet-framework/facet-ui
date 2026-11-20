/**
 * The text functions without React: the data layer (`@facet-tools/ui/core`) builds
 * visible sentences too, and it must not pull React in to do so.
 * `TextProvider` builds on the same `createText`.
 */
import { de } from "./de";
import { en, type Dictionary, type TextKey } from "./en";

/** The locales FACET ships a dictionary for. Any other BCP 47 tag falls back to English text. */
export type FacetLocale = "en" | "de";

/** Values for `{{name}}` placeholders. Numbers are formatted for the active locale. */
export type TextParams = Readonly<Record<string, string | number>>;

/** Base keys that have both a `.one` and an `.other` form. */
export type PluralKey = {
  [K in TextKey]: K extends `${infer B}.other` ? (`${B}.one` extends TextKey ? B : never) : never;
}[TextKey];

export type FacetText = {
  /** The active locale tag, e.g. "en" or "de". */
  locale: string;
  /** The text for `key` with its parameters filled in. */
  t: (key: TextKey, params?: TextParams) => string;
  /** The plural form of `key` for `count`; `{{count}}` is available as a parameter. */
  plural: (key: PluralKey, count: number, params?: TextParams) => string;
  /** A number formatted for the active locale. */
  number: (n: number) => string;
};

const BUILT_IN: Record<FacetLocale, Dictionary> = { en, de };

/** The text functions for `locale` outside React, e.g. for the data layer or fixtures. */
export function createText(locale: string, overrides?: Partial<Dictionary>): FacetText {
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

/** English, the language every FACET function speaks when it is given no text. */
export const ENGLISH_TEXT: FacetText = createText("en");
