import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type Example = {
  args?: Record<string, unknown>;
  render?: ComponentType<Record<string, unknown>>;
};
type StoryModule = {
  default: Example & { component?: ComponentType<Record<string, unknown>> };
  [key: string]: unknown;
};

function stories(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "i18n" ? [] : stories(file);
    return file.endsWith(".stories.tsx") ? [file] : [];
  });
}

for (const file of stories(__dirname)) {
  // Jest transforms each story through the same TypeScript configuration as the library.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const examples = require(file) as StoryModule;
  const meta = examples.default;
  describe(relative(__dirname, file), () => {
    for (const [name, value] of Object.entries(examples)) {
      if (name === "default" || !value || typeof value !== "object") continue;
      const story = value as Example;
      const component = story.render ?? meta.render ?? meta.component;
      if (!component) throw new Error(`No renderer for ${file}: ${name}`);
      it(`${name} renders with synthetic example data`, () => {
        expect(() =>
          renderToStaticMarkup(createElement(component, { ...meta.args, ...story.args })),
        ).not.toThrow();
      });
    }
  });
}
