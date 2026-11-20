import { localized } from "../i18n/legacy/core/codeCoverage.spec.text";
import { buildModel } from "./model";
import { codeCoverageOf } from "./codeCoverage";
import type { RawRecord, RepoScan } from "./types";

const raw = (path: string, summary: string): RawRecord => ({
  path,
  raw: "",
  doc: { id: path, intent: { summary } },
});

const raws = [raw("tasks/create/quick-add", localized.text1)];

function modelWithScan(scan: RepoScan) {
  return buildModel(
    {},
    raws.map((r) => r.path),
    raws,
    scan,
  );
}

describe("Unit tests for codeCoverageOf", () => {
  it("returns null when the scan has no file breakdown", () => {
    const model = modelWithScan({ totalLoc: 100 });
    expect(codeCoverageOf(model)).toBeNull();
  });

  it("returns null when either file list is missing", () => {
    const model = modelWithScan({ anchoredFiles: [] } as RepoScan);
    expect(codeCoverageOf(model)).toBeNull();
  });

  it("treats an empty breakdown as zero files rather than missing data", () => {
    const model = modelWithScan({ anchoredFiles: [], unanchoredFiles: [] });
    const coverage = codeCoverageOf(model);
    expect(coverage).not.toBeNull();
    expect(coverage!.filesTotal).toBe(0);
    expect(coverage!.filesAnchored).toBe(0);
    expect(coverage!.dirs).toEqual([]);
  });

  it("sums corpus files and lines with separate anchored and total counts", () => {
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

  it("lists every data entity", () => {
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

  it("groups a file without slashes under the current directory", () => {
    const model = modelWithScan({
      anchoredFiles: [],
      unanchoredFiles: [{ path: "README.md", loc: 12 }],
    });
    const coverage = codeCoverageOf(model)!;
    expect(coverage.dirs).toHaveLength(1);
    expect(coverage.dirs[0].dir).toBe(".");
  });

  it("lists unanchored files alphabetically within each directory", () => {
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

  it("calculates lines per anchor from model.anchorPairs", () => {
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

  it("divides line counts by all anchors pointing to the file", () => {
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

  it("keeps locPerAnchor null when the scan did not count an anchor", () => {
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
