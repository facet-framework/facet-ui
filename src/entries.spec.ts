import * as root from "./index";
import * as classic from "./classic";
import * as facet from "./facet";
import * as design from "./facet/design";
import * as atlas from "./facet/atlas";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const NAMESPACES = ["contents", "frame", "plugins", "records"];

describe("entry structure", () => {
  it("keeps the design system free of screen exports", () => {
    const names = Object.keys(design);
    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((n) => NAMESPACES.includes(n))).toEqual([]);
    const source = readFileSync(join(__dirname, "facet/design.ts"), "utf8");
    expect(source).not.toMatch(/screens\//);
  });

  it("exposes exactly the four Atlas namespaces on facet/atlas", () => {
    expect(Object.keys(atlas).sort()).toEqual(NAMESPACES);
    for (const ns of NAMESPACES) {
      expect(Object.keys((atlas as Record<string, object>)[ns]).length).toBeGreaterThan(0);
    }
  });

  it("adds only the four deprecated aliases to facet beyond the design system", () => {
    const extra = Object.keys(facet).filter((n) => !(n in design));
    expect(extra.sort()).toEqual(NAMESPACES);

    for (const ns of NAMESPACES) {
      expect((facet as Record<string, unknown>)[ns]).toBe((atlas as Record<string, unknown>)[ns]);
    }
  });

  it("marks every facet alias @deprecated in the entry source", () => {
    const source = readFileSync(join(__dirname, "facet/index.ts"), "utf8");
    for (const ns of NAMESPACES) {
      const re = new RegExp(`@deprecated(?:(?!\\*/)[\\s\\S])*\\*/\\s*export \\* as ${ns} from`);
      expect(source).toMatch(re);
    }
  });

  it("exports the same names from classic as from the root", () => {
    const rootNames = Object.keys(root).sort();
    expect(rootNames.length).toBeGreaterThan(0);
    expect(Object.keys(classic).sort()).toEqual(rootNames);
  });

  it("declares every entry in the package exports map", () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8"));
    for (const key of [
      "./facet",
      "./facet/atlas",
      "./facet.css",
      "./classic",
      "./classic.css",
      "./core",
    ]) {
      expect(pkg.exports).toHaveProperty([key]);
    }
    expect(pkg.version).toBe("0.1.0-rc.1");
  });
});
