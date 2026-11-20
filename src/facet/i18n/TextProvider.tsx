import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createText, ENGLISH_TEXT, type FacetLocale, type FacetText } from "./text";

export {
  createText,
  type FacetLocale,
  type FacetText,
  type PluralKey,
  type TextParams,
} from "./text";

const TextContext = createContext<FacetText>(ENGLISH_TEXT);

export type TextProviderProps = {
  /** "en" (the default) or "de"; another tag formats numbers for it and uses English text. */
  locale?: FacetLocale | (string & {});
  /** Texts that replace the built-in ones, e.g. a whole dictionary for another language. */
  dictionary?: Readonly<Record<string, string | undefined>>;
  children: ReactNode;
};

// @facet: localization/language/component-language
// @facet-role: primary
/** Sets the language of every FACET component below it. Without it, FACET speaks English. */
export function TextProvider({ locale = "en", dictionary, children }: TextProviderProps) {
  const value = useMemo(() => createText(locale, dictionary), [locale, dictionary]);
  return <TextContext.Provider value={value}>{children}</TextContext.Provider>;
}

/** The text functions of the nearest `TextProvider`, or English without one. */
export function useText(): FacetText {
  return useContext(TextContext);
}
