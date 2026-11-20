import type { Decorator, Preview } from "@storybook/react-vite";
import "../src/facet/styles/index.css";
import { FacetTextProvider } from "../src/facet/i18n";

const inApp: Decorator = (Story, ctx) => {
  const theme = (ctx.globals.tTheme as string) ?? "facet";
  const mode = (ctx.globals.tMode as string) ?? "dark";
  const bare = ctx.parameters.layout === "fullscreen";
  return (
    <div
      className="t-app"
      data-t-theme={theme}
      data-t-mode={mode}
      style={{ minHeight: "100vh", padding: bare ? 0 : 24 }}
    >
      <Story />
    </div>
  );
};

const inLanguage: Decorator = (Story, ctx) => (
  <FacetTextProvider locale={(ctx.globals.tLang as string) ?? "de"}>
    <Story />
  </FacetTextProvider>
);

const preview: Preview = {
  globalTypes: {
    tTheme: {
      description: "Palette",
      toolbar: {
        title: "Palette",
        icon: "paintbrush",
        items: ["facet", "paper"],
        dynamicTitle: true,
      },
    },
    tMode: {
      description: "Mode",
      toolbar: { title: "Mode", icon: "mirror", items: ["dark", "light"], dynamicTitle: true },
    },
    tLang: {
      description: "Language",
      toolbar: {
        title: "Language",
        icon: "globe",
        items: [
          { value: "de", title: "German" },
          { value: "en", title: "English" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { tTheme: "facet", tMode: "dark", tLang: "de" },
  parameters: {
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: "todo" },
    backgrounds: { disable: true },
    viewport: {
      options: {
        desktop: {
          name: "Desktop 1440",
          styles: { width: "1440px", height: "900px" },
          type: "desktop",
        },
        laptop: {
          name: "Laptop 1280",
          styles: { width: "1280px", height: "800px" },
          type: "desktop",
        },
        tablet: {
          name: "Tablet 834",
          styles: { width: "834px", height: "1112px" },
          type: "tablet",
        },
        mobile: { name: "Mobile 390", styles: { width: "390px", height: "844px" }, type: "mobile" },
      },
    },
    options: {
      storySort: { order: ["Basics", "Blocks", "Frame", "Screens"] },
    },
  },
  decorators: [inApp, inLanguage],
  tags: ["autodocs"],
};

export default preview;
