# Localization

`TextProvider` sets the active language and accepts application labels through
its `dictionary` property. `useText` reads the provider; `createText` supports
formatting outside React. English is the default, and German is included.

Use `t(key, params)` for labels and interpolation, `plural(key, count)` for
`.one`/`.other` pairs, and `number(value)` for localized numbers. Unknown
languages use English labels and their own number and plural formatting.

German text belongs only in the values of `de.ts`. Tests read those values
through `createText("de")`.
