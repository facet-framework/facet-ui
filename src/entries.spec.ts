import * as root from "./index";
import * as design from "./facet";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8"));
describe("package entry contract", () => {
  it("exports the design system at the root with shared object identity", () => {
    expect(Object.keys(root).sort()).toEqual(Object.keys(design).sort());
    expect(root.AppShell).toBe(design.AppShell);
    expect(root.Button).toBe(design.Button);
    for (const name of [
      "AppBar",
      "Stack",
      "Row",
      "Grid",
      "Page",
      "TextInput",
      "TextArea",
      "Select",
      "Sparkline",
      "BarChart",
      "LineChart",
      "Avatar",
      "Timeline",
      "Spinner",
      "Toolbar",
      "ToolbarSeparator",
      "ColorSwatches",
    ])
      expect(typeof (root as Record<string, unknown>)[name]).toBe("function");
    for (const name of ["Seal", "withSealLogic", "frame", "items", "plugins", "contents"])
      expect(root).not.toHaveProperty(name);
  });
  it("declares exactly the supported entries", () => {
    expect(Object.keys(pkg.exports).sort()).toEqual(
      [".", "./package.json", "./primitives", "./tokens", "./styles.css", "./tokens.css"].sort(),
    );
    expect(pkg.version).toBe("0.1.0-rc.3");
    expect(pkg.exports["./styles.css"]).toBe("./dist/styles.css");
  });
});
