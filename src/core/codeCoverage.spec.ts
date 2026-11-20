import { buildModel } from "./model";
import { codeCoverageOf } from "./codeCoverage";
import type { RawRecord, RepoScan } from "./types";

/**
 * A record with exactly one anchor in `src/tasks/quick_add.ts` — the anchor
 * count per file comes from `model.anchorPairs`, not from the scan.
 */
const raw = (path: string, summary: string): RawRecord => ({
  path,
  raw: "",
  doc: { id: path, intent: { summary } },
});

const raws = [raw("tasks/create/quick-add", "Der Schnellanleger.")];

function modelWithScan(scan: RepoScan) {
  return buildModel(
    {},
    raws.map((r) => r.path),
    raws,
    scan,
  );
}

describe("Unit tests for codeCoverageOf", () => {
  it("returns null when the scan does not know the split", () => {
    const model = modelWithScan({ totalLoc: 100 });
    expect(codeCoverageOf(model)).toBeNull();
  });

  it("returns null when only one of the two lists is missing", () => {
    const model = modelWithScan({ anchoredFiles: [] } as RepoScan);
    expect(codeCoverageOf(model)).toBeNull();
  });

  it("counts an empty split as actually zero files, not as missing", () => {
    const model = modelWithScan({ anchoredFiles: [], unanchoredFiles: [] });
    const coverage = codeCoverageOf(model);
    expect(coverage).not.toBeNull();
    expect(coverage!.filesTotal).toBe(0);
    expect(coverage!.filesAnchored).toBe(0);
    expect(coverage!.dirs).toEqual([]);
  });

  it("sums files and lines across the corpus, anchored and total separately", () => {
    const model = modelWithScan({
      anchoredFiles: [
        { path: "src/tasks/quick_add.ts", loc: 60 },
        { path: "src/tasks/bulk_archive.ts", loc: 40 },
      ],
      unanchoredFiles: [
        { path: "src/tasks/util.ts", loc: 20 },
        { path: "src/tasks/util.spec.ts", loc: 30 },
      ],
    });
    const coverage = codeCoverageOf(model)!;
    expect(coverage.filesTotal).toBe(4);
    expect(coverage.filesAnchored).toBe(2);
    expect(coverage.locTotal).toBe(150);
    expect(coverage.locAnchored).toBe(100);
  });

  it("rolls up by the first path segment, sorted alphabetically", () => {
    const model = modelWithScan({
      anchoredFiles: [{ path: "apps/mobile/src/quick_add.ts", loc: 60 }],
      unanchoredFiles: [
        { path: "crates/sync/src/queue.rs", loc: 40 },
        { path: "apps/web/src/util.ts", loc: 10 },
      ],
    });
    const coverage = codeCoverageOf(model)!;
    expect(coverage.dirs.map((d) => d.dir)).toEqual(["apps", "crates"]);

    const apps = coverage.dirs[0];
    expect(apps.filesTotal).toBe(2);
    expect(apps.filesAnchored).toBe(1);
    expect(apps.locTotal).toBe(70);
    expect(apps.locAnchored).toBe(60);

    const crates = coverage.dirs[1];
    expect(crates.filesTotal).toBe(1);
    expect(crates.filesAnchored).toBe(0);
  });

  it("puts a file without '/' under the directory '.'", () => {
    const model = modelWithScan({
      anchoredFiles: [],
      unanchoredFiles: [{ path: "README.md", loc: 12 }],
    });
    const coverage = codeCoverageOf(model)!;
    expect(coverage.dirs).toHaveLength(1);
    expect(coverage.dirs[0].dir).toBe(".");
  });

  it("lists the unanchored files per directory, alphabetically", () => {
    const model = modelWithScan({
      anchoredFiles: [],
      unanchoredFiles: [
        { path: "apps/z.ts", loc: 1 },
        { path: "apps/a.ts", loc: 2 },
      ],
    });
    const coverage = codeCoverageOf(model)!;
    expect(coverage.dirs[0].unanchored.map((f) => f.path)).toEqual(["apps/a.ts", "apps/z.ts"]);
  });

  it("computes lines per anchor for anchored files from model.anchorPairs", () => {
    const model = modelWithScan({
      anchoredFiles: [{ path: "src/tasks/quick_add.ts", loc: 100 }],
      unanchoredFiles: [],
      anchors: {
        "tasks/create/quick-add": [{ path: "src/tasks/quick_add.ts", line: 5, role: "primary" }],
      },
    });
    const coverage = codeCoverageOf(model)!;
    const file = coverage.dirs[0].anchored[0];
    expect(file.anchors).toBe(1);
    expect(file.locPerAnchor).toBe(100);
  });

  it("divides the line count by the number of anchors when several point at the same file", () => {
    // `anchorPairs` counts anchor entries regardless of whether their ID
    // belongs to a parsed record — the same file can be claimed by two
    // records, played through here deliberately with a second, otherwise
    // unused ID.
    const model = modelWithScan({
      anchoredFiles: [{ path: "src/tasks/quick_add.ts", loc: 100 }],
      unanchoredFiles: [],
      anchors: {
        "tasks/create/quick-add": [{ path: "src/tasks/quick_add.ts", line: 5, role: "primary" }],
        "tasks/create/quick-add-2": [
          { path: "src/tasks/quick_add.ts", line: 40, role: "secondary" },
        ],
      },
    });
    const coverage = codeCoverageOf(model)!;
    const file = coverage.dirs[0].anchored[0];
    expect(file.anchors).toBe(2);
    expect(file.locPerAnchor).toBe(50);
  });

  it("leaves locPerAnchor at null if a file without an anchor counted in the scan is considered anchored", () => {
    // Edge case: should not occur in real data (anchoredFiles and
    // anchorPairs come from the same host run), but the calculation must
    // not divide by zero.
    const model = modelWithScan({
      anchoredFiles: [{ path: "src/orphaned.ts", loc: 30 }],
      unanchoredFiles: [],
    });
    const coverage = codeCoverageOf(model)!;
    const file = coverage.dirs[0].anchored[0];
    expect(file.anchors).toBe(0);
    expect(file.locPerAnchor).toBeNull();
  });
});
