import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  metafile: true,
  entry: {
    index: "src/index.ts",
    core: "src/core/index.ts",
    "core/fixtures": "src/core/fixtures/index.ts",
    elements: "src/elements/index.ts",
    facet: "src/facet/index.ts",
    "facet/atlas": "src/facet/atlas.ts",
    classic: "src/classic.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,

  splitting: true,
  external: ["react", "react-dom", "react-dom/client"],

  onSuccess: async () => {
    copyFileSync("src/design-system/tokens.css", "dist/tokens.css");
    copyFileSync("src/design-system/tokens.css", "dist/classic.css");
    writeFileSync("dist/facet.css", inlineImports("src/facet/styles/index.css"));
  },
});

function inlineImports(file: string): string {
  return readFileSync(file, "utf8").replace(/^@import "(\.[^"]+)";$/gm, (_, rel: string) =>
    inlineImports(join(dirname(file), rel)),
  );
}
