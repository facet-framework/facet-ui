import { execFileSync } from "node:child_process";
import { join } from "node:path";
describe.each(["esm", "cjs"])("built %s entries", (format) => {
  it("resolves each JavaScript entry and stylesheet", () => {
    const script = `const { createRequire } = await import("node:module");
      const require = createRequire(process.cwd() + "/package.json");
      const names = ["@facet-tools/ui", "@facet-tools/ui/primitives", "@facet-tools/ui/tokens"];
      for (const name of names) {
        const entry = ${format === "esm" ? "await import(name)" : "require(name)"};
        if (!Object.keys(entry).length) throw new Error(name);
      }
      for (const name of ["styles.css", "tokens.css", "package.json"])
        require.resolve("@facet-tools/ui/" + name);`;
    expect(() =>
      execFileSync(process.execPath, ["--input-type=module", "-e", script], {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
      }),
    ).not.toThrow();
  });
});
