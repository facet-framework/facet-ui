# FACET text (i18n)

FACET ships English source text and a German dictionary. The app picks the
language once, at the root:

```tsx
import { TextProvider } from "@facet-tools/ui";

<TextProvider locale={i18n.language}>{app}</TextProvider>;
```

Without a provider every component speaks English. `locale` is `"en"` or `"de"`;
any other tag formats numbers for that locale and keeps English text unless the
app passes its own texts through `dictionary` (a partial dictionary is merged
over the built-in one).

## Files

- `en.ts`: the source of truth. Its keys define `TextKey`.
- `de.ts`: typed as `Dictionary`, so a missing or an extra key is a compile
  error.
- `catalog/core.ts` (`enCore` / `deCore`, keys `core.*`): the texts the data
  layer (`@facet-tools/ui/core`) and the elements tokens build. `catalog/elements.ts`
  (`enElements` / `deElements`, keys `elements.*`): the texts of the elements
  components (`@facet-tools/ui/elements`). `en.ts` and `de.ts` spread them in.
- `text.ts`: `createText(locale)` and `ENGLISH_TEXT`, without React. Every core
  function that builds a visible sentence takes an optional `text: FacetText`
  (English by default), e.g. `companionAnswer(model, question, createText("de"))`.
- `TextProvider.tsx`: `TextProvider` and `useText()`.
- `i18n.spec.tsx`: the guard. Both dictionaries have the same keys and the same
  `{{placeholders}}`, and no German value equals its English one unless the key
  is on the `SAME_IN_GERMAN` allowlist (technical terms such as Plugin,
  Records, Pull Request, Commit, Token, YAML, and product names).

## What a text may say

A visible text is a state, a label, a value, or what the reader can do. It
never explains or defends the design: no sentence on why something is or is
not shown, or how a page is drawn ("… does not report this, so it is not shown
here"). A legend that
labels marks is fine. `no-design-prose.spec.ts` fails on the connectives such
a sentence needs ("because", "therefore", and their German equivalents) in both
dictionaries; a key that uses one in another sense goes on its allowlist with
that sense written next to it.

## Converting a screen

1. **Find every visible string** in the component: text nodes, `aria-label`,
   `title`, `placeholder`, `aria-valuetext`, labels passed to primitives, and
   strings built in code (`` `${n} matches` ``). Data from fixtures is content,
   not UI text, and stays where it is.
2. **Add a key to `en.ts`** with the English text, then the same key to
   `de.ts` with the German text that was in the component. Keys are flat and
   dotted by area: `primitives.*`, `shell.*`, `core.<module>.<slug>`,
   `elements.<component>.<slug>`. Texts outside the design system live in
   `catalog/`; `en.ts` and `de.ts` only spread them in. Reuse an existing key
   only when the meaning is the same, not just the words.
3. **Read it in the component:**

   ```tsx
   const { t, plural, number } = useText();
   t("core.focus.noTeam");
   t("primitives.pager.range", { from, to, total }); // numbers are formatted
   plural("shell.history.older", count); // needs `<key>.one` and `<key>.other`
   number(1234); // "1,234" in en, "1.234" in de
   ```

   Replace `toLocaleString("de-DE")` with `number()`, so figures follow the
   language too.

4. **Values that select text are ids, not words.** History kinds use canonical
   English ids (`"record" | "overviewPage"`)
   and the visible name comes from a key such as `shell.history.kind.record`.
   Renaming such an exported value is an API change; say so in the commit.
5. **Tests:** a spec that asserts German text renders through
   `renderInGerman` from `i18n/testing.tsx` for locale-specific assertions. Add at least one case that checks the English
   default. Select by role, text or `data-testid`, never by CSS class.

## Stories

`.storybook-facet/preview.tsx` wraps every story in `TextProvider`. The
toolbar global "Language" switches between `en` (default) and `de`; stories need
nothing of their own.

## German stays in the German dictionary

`src/no-german-literals.spec.ts` reads every string literal, JSX text and
comment in `src/` and the Storybook configuration and fails on one that looks
German. German is allowed only in `de.ts`, the German halves of `catalog/`,
specs that assert the German rendering, and the files on its `ALLOWED` list,
each with its reason.
