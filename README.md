<h1 align="center">FACET UI</h1>

<p align="center">React components, design tokens, custom elements and data models for FACET records.</p>

Version **0.1.0-rc.1** · [Documentation](https://facet-framework.com) · [Apache-2.0](LICENSE)

```sh
npm install @facet-framework/ui@0.1.0-rc.1 react react-dom
```

```tsx
import { Button } from "@facet-framework/ui";
import "@facet-framework/ui/tokens.css";

export function OpenRegistry({ onOpen }: { onOpen: () => void }) {
  return <Button onClick={onOpen}>Open registry</Button>;
}
```

Use `@facet-framework/ui/core` for the React-free data layer,
`@facet-framework/ui/facet` for FACET design system components, and
`@facet-framework/ui/elements` for custom elements.

[Issues](https://github.com/facet-framework/facet-ui/issues) ·
[Security](SECURITY.md) · [Support](SUPPORT.md) · [Third-party notices](THIRD_PARTY.md)
