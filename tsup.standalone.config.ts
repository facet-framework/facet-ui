import { defineConfig } from "tsup";

/**
 * Standalone build for `<script type="module">`: React and the library are
 * baked in, so any host only has to load one file.
 */
export default defineConfig({
  metafile: true,
  entry: { "facet-ui.standalone": "src/elements/index.ts" },
  format: ["esm"],
  dts: false,
  sourcemap: false,
  clean: false,
  minify: true,
  noExternal: [/.*/],
  platform: "browser",
});
