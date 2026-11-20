import { labelText } from "../i18n/legacy/labels";
import { localized } from "../i18n/legacy/core/corpus";

import { parseGlossary } from "./glossary";
import { buildModel } from "./model";
import { parseTaxonomy } from "./taxonomy";
import type { AtlasModel, Calibration, CorpusError, RawRecord, RepoScan } from "./types";
import { parseYaml, YamlError } from "./yaml";
import type { YamlValue } from "./yaml";

export type CorpusSource = {
  facetrc: string;

  index: string;

  records: Record<string, string>;

  scan?: RepoScan;

  taxonomy?: string;

  glossary?: string;

  calibration?: Calibration;
};

function normaliseCalibration(value: Calibration | undefined): Calibration | null {
  if (!value) return null;
  return {
    ...value,
    metrics: Array.isArray(value.metrics) ? value.metrics : [],
    readings: Array.isArray(value.readings) ? value.readings : [],
  };
}

function asRecord(value: YamlValue): Record<string, YamlValue> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, YamlValue>)
    : {};
}

export function loadCorpus(source: CorpusSource): AtlasModel {
  const rc = asRecord(parseYaml(source.facetrc));
  const indexDoc = asRecord(parseYaml(source.index));
  const paths = Array.isArray(indexDoc.records) ? indexDoc.records.map(String) : [];

  const raws: RawRecord[] = [];
  const corpusErrors: CorpusError[] = [];
  paths.forEach((path) => {
    const raw = source.records[path];
    if (!raw) {
      corpusErrors.push({ path, message: localized.text1 });
      return;
    }
    try {
      raws.push({ path, raw, doc: asRecord(parseYaml(raw)) });
    } catch (error) {
      if (!(error instanceof YamlError)) throw error;

      const line = error.line;
      const message = error.message.replace(labelText.text356, "");
      corpusErrors.push({ path, message, line });
    }
  });

  return buildModel(
    rc,
    paths,
    raws,
    source.scan ?? {},
    corpusErrors,
    parseTaxonomy(source.taxonomy),
    normaliseCalibration(source.calibration),
    parseGlossary(source.glossary),
  );
}
