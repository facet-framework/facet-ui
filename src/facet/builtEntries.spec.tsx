import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";

const root = join(__dirname, "..", "..");
const dist = (file: string) => join(root, "dist", file);

type Entries = {
  FacetTextProvider: (props: { locale?: string; children: unknown }) => unknown;
  plugins: { AdrEmpty: (props: { directory: string }) => unknown };
};

describe("one text context across the built entries", () => {
  it("has the built files it loads", () => {
    for (const file of ["facet.cjs", "facet/atlas.cjs", "facet.js", "facet/atlas.js"])
      expect(existsSync(dist(file))).toBe(true);
  });

  it("CommonJS: a page from facet/atlas speaks the language of the provider from facet", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const facet = require(dist("facet.cjs")) as Entries;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const atlas = require(dist("facet/atlas.cjs")) as Pick<Entries, "plugins">;
    render(
      createElement(
        facet.FacetTextProvider as never,
        { locale: "de" },
        createElement(atlas.plugins.AdrEmpty as never, { directory: "docs/adr" }),
      ),
    );
    expect(screen.getByRole("heading", { name: labelText.text274 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: remainingText.text86 })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create the first decision" })).toBeNull();
  });

  it("ESM: the same holds when Node imports the module files", () => {
    const script = [
      'import { createElement } from "react";',
      'import { renderToStaticMarkup } from "react-dom/server";',
      `const facet = await import(${JSON.stringify(dist("facet.js"))});`,
      `const atlas = await import(${JSON.stringify(dist("facet/atlas.js"))});`,
      "process.stdout.write(renderToStaticMarkup(createElement(facet.FacetTextProvider, { locale: 'de' },",
      "  createElement(atlas.plugins.AdrEmpty, { directory: 'docs/adr' }))));",
    ].join("\n");
    const html = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
    });
    expect(html).toContain(remainingText.text86);
    expect(html).not.toContain("Create the first decision");
  });
});
