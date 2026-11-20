import type { StorybookConfig } from "@storybook/react-vite";

/** The Storybook of FACET, the FACET design system. It sees only `src/facet`. */
const config: StorybookConfig = {
  stories: ["../src/facet/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: { name: "@storybook/react-vite", options: {} },
  typescript: { reactDocgen: "react-docgen-typescript" },
};

export default config;
