/**
 * Puts the `@deprecated` tag back on the alias namespaces of `@facet-tools/ui/facet`
 * (`frame`, `records`, `contents`, `plugins`) in the bundled declarations.
 *
 * Why a step after tsup: the namespaces are shared with `@facet-tools/ui/facet/atlas`,
 * so the declaration bundler (rollup-plugin-dts) moves them into a common
 * chunk and re-exports them from `dist/facet.d.ts` by specifier
 * (`export { ap as frame } from './atlas-….js'`). It rewrites that statement
 * and drops every comment on it, so the JSDoc in `src/facet/index.ts` never
 * arrives. TypeScript honours `@deprecated` on an export specifier, so the tag
 * is written there.
 *
 * Fails when an alias is missing from the export lists: a bundler change that
 * moves them must be noticed, not shipped without the tag.
 */
import { readFileSync, writeFileSync } from "node:fs";

const ALIASES = ["frame", "records", "contents", "plugins"];
const TAG = "/** @deprecated Import from `@facet-tools/ui/facet/atlas`. */";
const FILES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["dist/facet.d.ts", "dist/facet.d.cts"];

let failed = false;
for (const file of FILES) {
  const found = new Set();
  const src = readFileSync(file, "utf8");
  const out = src.replace(/export \{([^}]*)\}/g, (whole, list) => {
    const specs = list.split(",").map((raw) => {
      const spec = raw.trim();

      const name = spec.split(/\s+/).pop();
      if (!ALIASES.includes(name)) return raw;
      found.add(name);
      if (raw.includes("@deprecated")) return raw;
      return raw.replace(spec, `${TAG} ${spec}`);
    });
    return `export {${specs.join(",")}}`;
  });
  const missing = ALIASES.filter((a) => !found.has(a));
  if (missing.length) {
    console.error(`${file}: alias export not found: ${missing.join(", ")}`);
    failed = true;
    continue;
  }
  if (out !== src) writeFileSync(file, out);
}
if (failed) process.exit(1);
