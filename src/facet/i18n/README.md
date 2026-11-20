# FACET design system text (i18n)

FACET design system ships English source text and a German dictionary. The app picks the
language once, at the root:

```tsx
import { FacetTextProvider } from "@facet-tools/ui/facet";

<FacetTextProvider locale={i18n.language}>{app}</FacetTextProvider>;
```

Without a provider every component speaks English. `locale` is `"en"` or `"de"`;
any other tag formats numbers for that locale and keeps English text unless the
app passes its own texts through `dictionary` (a partial dictionary is merged
over the built-in one).

## Files

- `en.ts`: the source of truth. Its keys define `TextKey`.
- `de.ts`: typed as `Dictionary`, so a missing or an extra key is a compile
  error.
- `TextProvider.tsx`: `FacetTextProvider` and `useText()`.
- `i18n.spec.tsx`: the guard. Both dictionaries have the same keys and the same
  `{{placeholders}}`, and no German value equals its English one unless the key
  is on the `SAME_IN_GERMAN` allowlist (technical terms such as Plugin,
  Records, Pull Request, Commit, Token, YAML, and product names).

## What a text may say

A visible text is a state, a label, a value, or what the reader can do. It
never explains or defends the design: no sentence on why something is or is
not shown, or how a page is drawn ("… does not report this, so it is not shown
here"). The owner reads the product, not its justification. A legend that
labels marks is fine. `no-design-prose.spec.ts` fails on the connectives such
a sentence needs ("because", "therefore", "deshalb", "weil", …) in both
dictionaries; a key that uses one in another sense goes on its allowlist with
that sense written next to it.

## Converting a screen

1. **Find every visible string** in the component: text nodes, `aria-label`,
   `title`, `placeholder`, `aria-valuetext`, labels passed to primitives, and
   strings built in code (`` `${n} Matches` ``). Data from fixtures is content,
   not UI text, and stays where it is.
2. **Add a key to `en.ts`** with the English text, then the same key to
   `de.ts` with the German text that was in the component. Keys are flat and
   dotted: `<g>.<screen>.<slug>`, where `<g>` is the screen group letter
   (`a` frame, `b` records, `c` contents, `d` plugins), e.g.
   `b.dossier.noProof`. The group's texts live in `i18n/screens/<g>.ts`
   (`enA` / `deA` …); `en.ts` and `de.ts` only spread them in. Reuse an existing `primitives.*` or
   `shell.*` key only when the meaning is the same, not just the words.
3. **Read it in the component:**

   ```tsx
   const { t, plural, number } = useText();
   t("b.dossier.noProof");
   t("primitives.pager.range", { from, to, total }); // numbers are formatted
   plural("shell.history.older", count); // needs `<key>.one` and `<key>.other`
   number(1234); // "1,234" in en, "1.234" in de
   ```

   Replace `toLocaleString("de-DE")` with `number()`, so figures follow the
   language too.

4. **Values that select text are ids, not words.** A union like
   `kind: "Record" | "Overview"` becomes English ids (`"dossier" | "situation"`)
   and the visible name comes from a key such as `shell.history.kind.dossier`.
   Renaming such an exported value is an API change; say so in the commit.
5. **Tests:** a spec that asserts German text renders through
   `renderInGerman` from `i18n/testing.tsx` (every screen spec imports it as
   `render` today, so their German assertions keep holding). Add at least one case that checks the English
   default. Select by role, text or `data-testid`, never by CSS class.

## Stories

`.storybook-facet/preview.tsx` wraps every story in `FacetTextProvider`. The
toolbar global "Language" switches between `de` (default) and `en`; stories need
nothing of their own.
