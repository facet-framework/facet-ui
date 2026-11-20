<h1 align="center">FACET UI</h1>

<p align="center">The FACET design system: React primitives, application shell, design tokens and custom elements.</p>

Version **0.1.0-rc.2** · [Documentation](https://facet-framework.com) · [Apache-2.0](LICENSE)

```sh
npm install @facet-tools/ui@0.1.0-rc.2 react react-dom
```

```tsx
import { Button } from "@facet-tools/ui";
import "@facet-tools/ui/styles.css";

export function OpenRegistry({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="t-app">
      <Button onClick={onOpen}>Open registry</Button>
    </div>
  );
}
```

Use `@facet-tools/ui/core` for the React-free data layer,
`@facet-tools/ui/elements` for custom elements.

[Issues](https://github.com/facet-framework/facet-ui/issues) ·
[Security](SECURITY.md) · [Support](SUPPORT.md) · [Third-party notices](THIRD_PARTY.md)
