import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const root = join(__dirname, "..", "..");
const ALIASES = ["frame", "records", "contents", "plugins"];

describe("deprecated alias namespaces in the shipped declarations", () => {
  it.each(["dist/facet.d.ts", "dist/facet.d.cts"])("%s tags every alias export", (file) => {
    const text = readFileSync(join(root, file), "utf8");
    for (const alias of ALIASES)
      expect(text).toMatch(
        new RegExp(
          `/\\*\\* @deprecated Import from \`@facet-tools/ui/facet/atlas\`[^*]*\\*/ (?:[\\w$]+ as )?${alias}\\b`,
        ),
      );
  });

  it("makes TypeScript report the aliases as deprecated, and nothing else", () => {
    const probe = join(root, "src", "facet", "__deprecated_probe__.ts");
    const source = [
      'import { frame, plugins, records, contents, Button } from "../../dist/facet.js";',
      "type D = plugins.ProcessDiagram;",
      "export const used: [unknown, unknown, unknown, unknown, unknown] = [frame, records, contents, plugins, Button];",
      "export type { D };",
    ].join("\n");
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      skipLibCheck: true,
      noEmit: true,
    };
    const host: ts.LanguageServiceHost = {
      getScriptFileNames: () => [probe],
      getScriptVersion: () => "1",
      getScriptSnapshot: (f) =>
        f === probe
          ? ts.ScriptSnapshot.fromString(source)
          : ts.sys.fileExists(f)
            ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f) ?? "")
            : undefined,
      getCurrentDirectory: () => root,
      getCompilationSettings: () => options,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
      fileExists: (f) => f === probe || ts.sys.fileExists(f),
      readFile: (f) => (f === probe ? source : ts.sys.readFile(f)),
    };
    const service = ts.createLanguageService(host);

    expect(service.getSemanticDiagnostics(probe).map((d) => d.messageText)).toEqual([]);
    const deprecated = service
      .getSuggestionDiagnostics(probe)
      .filter((d) => d.code === 6385)
      .map((d) => source.slice(d.start ?? 0, (d.start ?? 0) + (d.length ?? 0)));
    for (const alias of ALIASES) expect(deprecated).toContain(alias);
    expect(deprecated).not.toContain("Button");
  });
});
