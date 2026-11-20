/**
 * Coverage in code — which share of the repository the registry describes,
 * computed from `RepoScan.anchoredFiles`/`unanchoredFiles`. A map, not a list
 * of findings: §9.3 of the FACET spec says explicitly that uncovered code is
 * not a defect, so there is no threshold here, no red, no entry in the focus
 * list — only the number that supplies the denominator to every other number
 * on screen.
 *
 * The second order of the same data — lines per anchor for each anchored file
 * — is computed here too, but deliberately not sorted or highlighted: a single
 * header anchor over a very long file is the documented form of a file-wide
 * tag (§3.3), not a "worst first" ranking.
 */

import type { AtlasModel, ScannedFile } from "./types";

export type AnchoredFileCoverage = ScannedFile & {
  /** How many anchors of this registry lie in this file (from `model.anchorPairs`). */
  anchors: number;
  /** `loc / anchors`, or `null` when the file carries no counted anchor. */
  locPerAnchor: number | null;
};

export type DirCoverage = {
  /** First path segment, or `.` for a file directly at the registry root. */
  dir: string;
  filesTotal: number;
  filesAnchored: number;
  locTotal: number;
  locAnchored: number;
  /** Alphabetical by path — not a ranking. */
  unanchored: ScannedFile[];
  /** Alphabetical by path — not a ranking. */
  anchored: AnchoredFileCoverage[];
};

export type CodeCoverage = {
  filesTotal: number;
  filesAnchored: number;
  locTotal: number;
  locAnchored: number;
  /** Alphabetical by directory. */
  dirs: DirCoverage[];
};

/** First path segment of a `/`-separated, registry-relative path. */
function topDirOf(path: string): string {
  const i = path.indexOf("/");
  return i === -1 ? "." : path.slice(0, i);
}

/**
 * Builds the coverage map from `model.scan.anchoredFiles`/`unanchoredFiles`.
 *
 * Returns `null` when either of the two lists is missing — that distinguishes
 * a host without file lists from a registry with actually zero scanned files
 * (both lists present, empty). The caller shows an empty state in the first
 * case and the real zero in the second.
 */
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
