/** Deterministic fixtures for Storybook, tests and the demo app. */
import { loadCorpus } from "../corpus";
import type { AtlasModel, FacetRecord } from "../types";
import { FACETRC, INDEX, RECORDS, SCAN } from "./taskflow-repo";

export { FACETRC, INDEX, RECORDS, SCAN };

let cached: AtlasModel | null = null;

/** The TaskFlow model — parsed once, from the cache afterwards. */
export function taskflowModel(): AtlasModel {
  if (!cached) {
    cached = loadCorpus({ facetrc: FACETRC, index: INDEX, records: RECORDS, scan: SCAN });
  }
  return cached;
}

/** A single record from the demo corpus, e.g. `tasks/create/quick-add`. */
export function taskflowRecord(id: string): FacetRecord {
  const record = taskflowModel().byId[id];
  if (!record) throw new Error(`Fixture record not found: ${id}`);
  return record;
}
