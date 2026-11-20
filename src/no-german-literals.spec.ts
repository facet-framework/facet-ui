import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";

/**
 * English is the default in code and in the product; German lives only in the
 * German dictionary.
 *
 * This guard reads every string literal, template part, JSX text and comment
 * in the sources and the Storybook configuration with the TypeScript scanner —
 * not with a line grep, which cannot tell a string from a comment — and fails
 * on one that looks German: an umlaut or ß, German opening quotes, a German
 * function word, or one of FACET's German product nouns.
 *
 * German may stay where it is the point, and only there. `ALLOWED` names those
 * files with the reason next to each. The list may only shrink: an entry whose
 * file no longer holds German fails too.
 *
 * This file names the words it looks for and is therefore not scanned itself.
 */
const root = join(__dirname, "..");
const SELF = relative(root, __filename).split(sep).join("/");

/** Files that hold German on purpose, with the reason. */
const ALLOWED: ReadonlyMap<string, string> = new Map([
  ["src/facet/i18n/de.ts", "the German dictionary"],
  ["src/facet/i18n/catalog/core.ts", "holds deCore, the German half of the core catalog"],
  [
    "src/facet/i18n/catalog/elements.ts",
    "holds deElements, the German half of the elements catalog",
  ],
  ["src/facet/i18n/no-design-prose.spec.ts", "the German connectives that guard looks for"],
]);

/**
 * Spec files may assert the German rendering under the German locale. Their
 * test titles are code, though, and stay English.
 */
const GERMAN_LOCALE_SPEC = /\.spec\.tsx?$/;

/** `it`, `test` and `describe`, also as `.only`, `.skip` and `.each(...)`. */
const TEST_CALL = /^(it|test|describe)(\.(only|skip|each))?\b/;

const FUNCTION_WORDS = [
  "und",
  "nicht",
  "ist",
  "der",
  "das",
  "ein",
  "eine",
  "einen",
  "einem",
  "einer",
  "mit",
  "auf",
  "oder",
  "noch",
  "kein",
  "keine",
  "keinen",
  "wird",
  "werden",
  "sind",
  "von",
  "dem",
  "auch",
  "aber",
  "wenn",
  "nur",
  "schon",
  "sich",
  "bei",
  "nach",
  "zum",
  "zur",
  "ohne",
  "hier",
  "jetzt",
  "gibt",
  "kann",
  "muss",
  "soll",
  "dass",
  "steht",
  "fehlt",
  "haben",
  "diese",
  "dieser",
  "dieses",
  "vom",
  "ins",
  "weil",
  "wie",
  "zu",
  "im",
];

/** FACET's German product nouns, which a single label can consist of. */
const PRODUCT_NOUNS = [
  "Lage",
  "Akte",
  "Akten",
  "Versatz",
  "Kategorie",
  "Friedhof",
  "Merkmal",
  "Merkmale",
  "Zusage",
  "Zusagen",
  "Bereich",
  "Bereiche",
  "Beleg",
  "Belege",
  "Anker",
  "Wissensfach",
  "Einstieg",
  "Einstiege",
  "Regelwerk",
  "Sonde",
  "Ruhesatz",
  "Annahme",
  "Annahmen",
  "Datenform",
  "AUSGANGSLAGE",
  "AKTION",
  "ERGEBNIS",
];

const WORD = new RegExp(
  `(?:^|[^\\p{L}])(${[...FUNCTION_WORDS, ...PRODUCT_NOUNS].join("|")})(?=[^\\p{L}]|$)`,
  "u",
);

/** Why `text` looks German, or `null`. */
function germanIn(text: string): string | null {
  if (/[äöüÄÖÜß]/.test(text)) return "umlaut";
  if (text.includes("„")) return "German quote";
  const word = text.match(WORD);
  return word ? `"${word[1]}"` : null;
}

const LITERALS = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.JsxText,
]);

/** Code names retired in phase 2, including dictionary key segments. */
const RETIRED_NAME =
  /^(frist|leitung|entwickler|eigentum|neu|autor|lage|produkt|inhalte|glossar|dunkel|hell|papier|kompakt|weit|mobil|frage|fragen|antwort|mehr|datei|dateien|verankert|unverankert|waisen|befehl|bericht|sammlung|ueberlagerungen|verlauf|rolle|verbinden|flug|fehler|farben|typografie|symbole|bedienelemente|anzeige|schublade|dialogfenster)$/i;

function germanNames(file: string, source: string): string[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const languageContent =
    file.endsWith("/de.ts") || file.includes("/i18n/catalog/") || GERMAN_LOCALE_SPEC.test(file);
  const visit = (node: ts.Node) => {
    // Dictionary keys are code too, including those in the German dictionary.
    const name = ts.isIdentifier(node)
      ? node.text
      : ts.isStringLiteral(node) &&
          (!languageContent || (ts.isPropertyAssignment(node.parent) && node.parent.name === node))
        ? node.text
        : null;
    if (
      name &&
      (/[äöüÄÖÜß]/.test(name) ||
        name
          .replace(/([a-z])([A-Z])/g, "$1.$2")
          .split(/[._/-]/)
          .some((part) => RETIRED_NAME.test(part)))
    )
      found.push(`${file}: ${name}`);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

type Finding = { file: string; line: number; why: string; text: string; title: boolean };

/** Every German-looking literal and comment of one source file. */
function findGerman(file: string, source: string): Finding[] {
  const kind = file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const out: Finding[] = [];
  const seen = new Set<number>();
  const add = (pos: number, text: string, title = false) => {
    const why = germanIn(text);
    if (why) {
      const line = sf.getLineAndCharacterOfPosition(pos).line + 1;
      out.push({ file, line, why, text: text.replace(/\s+/g, " ").trim().slice(0, 80), title });
    }
  };
  const isTitle = (node: ts.Node) =>
    ts.isCallExpression(node.parent) &&
    node.parent.arguments[0] === node &&
    TEST_CALL.test(node.parent.expression.getText(sf));
  const comments = (ranges: ts.CommentRange[] | undefined) => {
    for (const range of ranges ?? []) {
      if (seen.has(range.pos)) continue;
      seen.add(range.pos);
      add(range.pos, source.slice(range.pos, range.end));
    }
  };
  const visit = (node: ts.Node) => {
    if (LITERALS.has(node.kind)) add(node.getStart(sf), node.getText(sf), isTitle(node));
    if (node.kind !== ts.SyntaxKind.JsxText) {
      comments(ts.getLeadingCommentRanges(source, node.getFullStart()));
      comments(ts.getTrailingCommentRanges(source, node.end));
    }
    node.getChildren(sf).forEach(visit);
  };
  visit(sf);
  return out;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const scanned = [
  ...walk(join(root, "src")),
  ...walk(join(root, ".storybook")),
  ...walk(join(root, ".storybook-facet")),
]
  .filter((path) => /\.(ts|tsx)$/.test(path))
  .map((path) => relative(root, path).split(sep).join("/"))
  .filter((file) => file !== SELF);

const findings = scanned.flatMap((file) =>
  findGerman(file, readFileSync(join(root, file), "utf8")),
);
const germanFiles = new Set(findings.map((finding) => finding.file));

describe("German string literals and comments", () => {
  it("rejects German identifiers and dictionary keys, including camel case", () => {
    expect(
      germanNames(
        "x.ts",
        'const frist = 1; const SammlungMobil = {}; const keys = { "shell.role.leitung.name": "Leadership" };',
      ),
    ).toEqual(["x.ts: frist", "x.ts: SammlungMobil", "x.ts: shell.role.leitung.name"]);
    expect(germanNames("x.ts", "const mobile = 1; const leadership = {};")).toEqual([]);
    expect(
      scanned.flatMap((file) => germanNames(file, readFileSync(join(root, file), "utf8"))),
    ).toEqual([]);
  });

  it("are recognised by the detector", () => {
    // The instrument first: a detector that matches nothing would pass forever.
    expect(germanIn("Keine Prüfung ist überfällig.")).toBe("umlaut");
    expect(germanIn("Sachlabel in Versalien, z. B. „RHYTHMUS“")).toBe("German quote");
    expect(germanIn("Nichts ist datiert.")).toBe('"ist"');
    expect(germanIn("Zusagen")).toBe('"Zusagen"');
    expect(germanIn("AUSGANGSLAGE")).toBe('"AUSGANGSLAGE"');
    // And it lets English through, including words German shares with it.
    expect(germanIn("No review is overdue.")).toBeNull();
    expect(germanIn("Die in the den of MIT, also was a die-cast mitre.")).toBeNull();
    expect(germanIn("Record · Promise · Drift")).toBeNull();
    const found = findGerman(
      "x.tsx",
      '// keine Zusage\nconst a = "ok";\nconst b = <p>Nichts ist datiert.</p>;\n',
    );
    expect(found.map((finding) => finding.line)).toEqual([1, 3]);
    const titles = findGerman(
      "x.spec.ts",
      'it("zeigt die Zusage", () => expect(f()).toBe("Zusage"));\n',
    );
    expect(titles.map((finding) => finding.title)).toEqual([true, false]);
  });

  it("scans the sources and the Storybook configuration", () => {
    expect(scanned.length).toBeGreaterThan(250);
    for (const file of [
      "src/core/companion.ts",
      "src/facet/i18n/de.ts",
      "src/components/ui/ScenarioLedger/ScenarioLedger.hoc.tsx",
      ".storybook-facet/preview.tsx",
    ])
      expect(scanned).toContain(file);
    // The German dictionary is found, so a German literal elsewhere would be too.
    expect(germanFiles.has("src/facet/i18n/de.ts")).toBe(true);
  });

  it("appear only in the German dictionary, German-locale specs and the allowlist", () => {
    const unexpected = findings
      .filter(({ file, title }) => !ALLOWED.has(file) && (title || !GERMAN_LOCALE_SPEC.test(file)))
      .map(({ file, line, why, text }) => `${file}:${line} (${why}) ${text}`);
    expect(unexpected).toEqual([]);
  });

  it("lists only allowed files that still hold German", () => {
    const stale = [...ALLOWED.keys()].filter((file) => !germanFiles.has(file));
    expect(stale).toEqual([]);
  });
});
