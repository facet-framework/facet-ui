/**
 * Load the corpus — `.facetrc.yaml` → index → records → model.
 * The flow matches the prototype: one pass, one model, one state.
 */

import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import { parseGlossary } from "./glossary";
import { buildModel } from "./model";
import { parseTaxonomy } from "./taxonomy";
import type { AtlasModel, Calibration, CorpusError, RawRecord, RepoScan } from "./types";
import { parseYaml, YamlError } from "./yaml";
import type { YamlValue } from "./yaml";

export type CorpusSource = {
  /** Contents of `.facetrc.yaml`. */
  facetrc: string;
  /** Contents of the record index (`facet-index.yaml`). */
  index: string;
  /** Path → YAML text. */
  records: Record<string, string>;
  /** Host material from the repo scan. */
  scan?: RepoScan;
  /**
   * Contents of `taxonomy.yaml`, unparsed like the records. If the file is
   * missing, this field is missing — not an empty tree: "not declared" and
   * "declared, but empty" are opposite statements.
   */
  taxonomy?: string;
  /**
   * Contents of `glossary.yaml`, unparsed like the records. If the file is
   * missing, this field is missing — and the prose is rendered as before. A
   * project without a glossary has not failed to define something.
   */
  glossary?: string;
  /** The shape of the registry as computed by the engine (FACET §11.4). */
  calibration?: Calibration;
};

/**
 * Hardens the calibration delivered by the host against missing lists.
 *
 * The type claims arrays; an engine that serialises a nil slice sends `null`.
 * That is exactly what happened: a registry with fewer than five records
 * earns no reading, `readings` arrived as `null`, and Atlas's first render
 * pass called `readings.some(...)` — white page, no ErrorBoundary behind it,
 * and of all places on fresh projects.
 *
 * The engine now delivers this as `[]`. The normalisation stays anyway: the
 * reader will run against older binaries, and a reader that blindly trusts
 * the host is just as far from a crash as before.
 */
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

/**
 * Parses the whole corpus and builds the model.
 *
 * `.facetrc.yaml` and the record index are the prerequisite for everything
 * else — if either of them is broken, Atlas does not even know which records
 * should exist, and keeps throwing `YamlError` with a line number.
 *
 * A single record is something else: 782 readable records say nothing wrong
 * just because the 783rd does not close its YAML. Such a record is skipped
 * rather than discarding the whole model — the error lands in
 * `model.corpusErrors`, where the validation register shows it, instead of
 * blocking Atlas for the entire inventory.
 */
export function loadCorpus(source: CorpusSource): AtlasModel {
  const rc = asRecord(parseYaml(source.facetrc));
  const indexDoc = asRecord(parseYaml(source.index));
  const paths = Array.isArray(indexDoc.records) ? indexDoc.records.map(String) : [];

  const raws: RawRecord[] = [];
  const corpusErrors: CorpusError[] = [];
  paths.forEach((path) => {
    const raw = source.records[path];
    if (!raw) {
      // Missing from the inventory just like a record whose YAML does not
      // parse — both times the index holds a path for which `model.recs` has
      // nothing. Without this entry the empty `model.corpusErrors` list would
      // claim "every file in the index was readable", although there was no
      // file at all.
      corpusErrors.push({
        path,
        message: ENGLISH_TEXT.t("core.corpus.missingFile"),
        key: "core.corpus.missingFile",
      });
      return;
    }
    try {
      raws.push({ path, raw, doc: asRecord(parseYaml(raw)) });
    } catch (error) {
      // A `YamlError` is a broken record — the case this skip is meant for.
      // Anything else (a programming error in the parser itself, a stack
      // overflow) is not a finding about the record but a bug in `parseYaml`
      // — it should be loud, not vanish as "record broken" in the validation
      // list.
      if (!(error instanceof YamlError)) throw error;
      // `YamlError` appends the line itself — cut off once here so that
      // `CorpusError.line` carries it separately instead of repeating it in
      // the text. `key` and `params` let a surface show it in its language
      // (`corpusErrorText`).
      const line = error.line;
      const message = error.message.replace(/ \(line \d+\)$/, "");
      corpusErrors.push({ path, message, line, key: error.key, params: error.params });
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

/**
 * The message of a skipped record in the language of `text`. `message` itself
 * is English; an error without a key keeps it.
 */
export function corpusErrorText(error: CorpusError, text: FacetText = ENGLISH_TEXT): string {
  return error.key ? text.t(error.key, error.params) : error.message;
}
