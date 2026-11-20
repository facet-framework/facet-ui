import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { defineConfig } from "tsup";

/**
 * Build ESM/CJS entry points, declarations and source maps into dist/.
 * React remains a peer dependency; tokens are copied as a separate stylesheet.
 */
export default defineConfig({
  entry: {
    // The root entry is the FACET design system (src/index.ts re-exports src/facet/index.ts);
    index: "src/index.ts",
    primitives: "src/primitives.ts",
    tokens: "src/design-system/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  metafile: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Share one TextProvider context across entries.
  splitting: true,
  external: ["react", "react-dom", "react-dom/client"],
  // Flatten the design system stylesheet into dist/styles.css.
  onSuccess: async () => {
    copyFileSync("src/design-system/tokens.css", "dist/tokens.css");
    writeFileSync("dist/styles.css", inlineImports("src/facet/styles/index.css"));
  },
});

/** Resolve relative `@import "./x.css";` lines recursively into one stylesheet. */
function inlineImports(file: string): string {
  return readFileSync(file, "utf8").replace(/^@import "(\.[^"]+)";$/gm, (_, rel: string) =>
    inlineImports(join(dirname(file), rel)),
  );
}
