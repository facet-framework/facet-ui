import { localized } from "../../i18n/legacy/core/fixtures/index";

import { loadCorpus } from "../corpus";
import type { AtlasModel, FacetRecord } from "../types";
import { FACETRC, INDEX, RECORDS, SCAN } from "./taskflow-repo";

export { FACETRC, INDEX, RECORDS, SCAN };

let cached: AtlasModel | null = null;

export function taskflowModel(): AtlasModel {
  if (!cached) {
    cached = loadCorpus({ facetrc: FACETRC, index: INDEX, records: RECORDS, scan: SCAN });
  }
  return cached;
}

export function taskflowRecord(id: string): FacetRecord {
  const record = taskflowModel().byId[id];
  if (!record) throw new Error(`${localized.text1}${id}`);
  return record;
}
