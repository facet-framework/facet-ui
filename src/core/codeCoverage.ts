import type { AtlasModel, ScannedFile } from "./types";

export type AnchoredFileCoverage = ScannedFile & {
  anchors: number;

  locPerAnchor: number | null;
};

export type DirCoverage = {
  dir: string;
  filesTotal: number;
  filesAnchored: number;
  locTotal: number;
  locAnchored: number;

  unanchored: ScannedFile[];

  anchored: AnchoredFileCoverage[];
};

export type CodeCoverage = {
  filesTotal: number;
  filesAnchored: number;
  locTotal: number;
  locAnchored: number;

  dirs: DirCoverage[];
};

function topDirOf(path: string): string {
  const i = path.indexOf("/");
  return i === -1 ? "." : path.slice(0, i);
}

export function codeCoverageOf(model: AtlasModel): CodeCoverage | null {
  const { anchoredFiles, unanchoredFiles } = model.scan;
  if (!Array.isArray(anchoredFiles) || !Array.isArray(unanchoredFiles)) return null;

  const anchorCountByPath: Record<string, number> = {};
  model.anchorPairs.forEach((anchor) => {
    anchorCountByPath[anchor.path] = (anchorCountByPath[anchor.path] ?? 0) + 1;
  });

  const dirs = new Map<string, DirCoverage>();
  const dirOf = (path: string): DirCoverage => {
    const key = topDirOf(path);
    let entry = dirs.get(key);
    if (!entry) {
      entry = {
        dir: key,
        filesTotal: 0,
        filesAnchored: 0,
        locTotal: 0,
        locAnchored: 0,
        unanchored: [],
        anchored: [],
      };
      dirs.set(key, entry);
    }
    return entry;
  };

  anchoredFiles.forEach((file) => {
    const entry = dirOf(file.path);
    entry.filesTotal += 1;
    entry.filesAnchored += 1;
    entry.locTotal += file.loc;
    entry.locAnchored += file.loc;
    const anchors = anchorCountByPath[file.path] ?? 0;
    entry.anchored.push({
      ...file,
      anchors,
      locPerAnchor: anchors > 0 ? file.loc / anchors : null,
    });
  });

  unanchoredFiles.forEach((file) => {
    const entry = dirOf(file.path);
    entry.filesTotal += 1;
    entry.locTotal += file.loc;
    entry.unanchored.push(file);
  });

  const byPath = (a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path);
  const dirList = [...dirs.values()]
    .map((entry) => ({
      ...entry,
      unanchored: [...entry.unanchored].sort(byPath),
      anchored: [...entry.anchored].sort(byPath),
    }))
    .sort((a, b) => a.dir.localeCompare(b.dir));

  return {
    filesTotal: anchoredFiles.length + unanchoredFiles.length,
    filesAnchored: anchoredFiles.length,
    locTotal: dirList.reduce((sum, d) => sum + d.locTotal, 0),
    locAnchored: dirList.reduce((sum, d) => sum + d.locAnchored, 0),
    dirs: dirList,
  };
}
