# FACET UI

React components, design tokens, layouts and localization. Version 0.1.0-rc.2.

```sh
npm install @facet-tools/ui@0.1.0-rc.2 react react-dom
```

```tsx
import { AppShell, Button, TextProvider } from "@facet-tools/ui";
import "@facet-tools/ui/styles.css";

export function App() {
  return (
    <TextProvider locale="en">
      <AppShell top={<h1>Workspace</h1>}>
        <Button onClick={() => alert("Saved")}>Save</Button>
      </AppShell>
    </TextProvider>
  );
}
```

The root exports controls, collections, overlays and the application frame.
`@facet-tools/ui/primitives` exports presentational components and their logic wrappers.
`@facet-tools/ui/tokens` exports typed color, spacing, motion and typography tokens;
`@facet-tools/ui/tokens.css` supplies their CSS variables.

English and German dictionaries cover the design system. Applications can supply
additional labels through `TextProvider` and `createText`.

[Source](https://github.com/facet-framework/facet-ui) ·
[Issues](https://github.com/facet-framework/facet-ui/issues) ·
[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

Licensed under Apache-2.0. See [LICENSE](LICENSE), [NOTICE](NOTICE) and
[third-party dependencies](THIRD_PARTY.md).
