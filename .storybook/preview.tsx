import type { Decorator, Preview } from "@storybook/react-vite";
import "../src/design-system/tokens.css";

const onPaper: Decorator = (Story) => (
  <div
    style={{
      background: "var(--paper)",
      color: "var(--ink)",
      fontFamily: "var(--font-sans)",
      padding: 24,
      minHeight: "100vh",
    }}
  >
    <Story />
  </div>
);

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: "todo" },
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: ["Design System", "Primitives", "Atoms", "FACET UI", "Pages"],
      },
    },
  },
  decorators: [onPaper],
  tags: ["autodocs"],
};

export default preview;
