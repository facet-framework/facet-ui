import { createText } from "../facet/i18n/text";
import { corpusErrorText, loadCorpus } from "./corpus";
import * as yamlModule from "./yaml";
import { YamlError } from "./yaml";

const germanText = createText("de");

const facetrc = 'schema_version: "1.5"\nrecords: docs/facets\n';
const index = "records:\n  - a.yaml\n  - missing.yaml\n";
const records = {
  "a.yaml": "id: tasks/create/quick-add\nlifecycle: active\n",
};

describe("Unit tests for loadCorpus", () => {
  it("reads configuration, index and records", () => {
    const model = loadCorpus({ facetrc, index, records });
    expect(model.rc.schema_version).toBe("1.5");
    expect(model.paths).toEqual(["a.yaml", "missing.yaml"]);
    expect(model.recs).toHaveLength(1);
  });

  it("skips paths for which no file exists", () => {
    const model = loadCorpus({ facetrc, index, records });
    expect(model.byId["tasks/create/quick-add"]).toBeDefined();
  });

  it("copes with an empty index", () => {
    const model = loadCorpus({ facetrc, index: "records: []\n", records: {} });
    expect(model.recs).toHaveLength(0);
    expect(model.scnTotal).toBe(0);
  });
});

describe("A broken record does not block the whole corpus", () => {
  // Previously a single broken record took the whole load down with it —
  // 782 readable records disappeared together with the 783rd, whose YAML
  // does not close. Now the record is skipped, not the whole model.
  const brokenIndex = "records:\n  - a.yaml\n  - kaputt.yaml\n";
  const brokenRecords = {
    "a.yaml": "id: tasks/create/quick-add\nlifecycle: active\n",
    "kaputt.yaml": "id: a\nloose line\n",
  };

  it("builds the model from the remaining valid records", () => {
    const model = loadCorpus({ facetrc, index: brokenIndex, records: brokenRecords });
    expect(model.recs).toHaveLength(1);
    expect(model.byId["tasks/create/quick-add"]).toBeDefined();
  });

  it("names file, message and line in model.corpusErrors", () => {
    const model = loadCorpus({ facetrc, index: brokenIndex, records: brokenRecords });
    expect(model.corpusErrors).toHaveLength(1);
    expect(model.corpusErrors[0].path).toBe("kaputt.yaml");
    expect(model.corpusErrors[0].line).toBe(1);
    // The line number is its own field — not repeated in the text, otherwise
    // it would appear twice, once raw and once in the message.
    expect(model.corpusErrors[0].message).not.toMatch(/\(line \d+\)/);
  });

  it("leaves model.corpusErrors empty when every path in the index has a file", () => {
    const model = loadCorpus({ facetrc, index: "records:\n  - a.yaml\n", records });
    expect(model.corpusErrors).toEqual([]);
  });

  it("enters a path without a file as its own finding in model.corpusErrors", () => {
    // `index`/`records` above deliberately leave "missing.yaml" without content.
    // Previously such a path vanished without a trace — the empty
    // `corpusErrors` list would then have claimed every file was readable,
    // although there was no file at all.
    const model = loadCorpus({ facetrc, index, records });
    expect(model.corpusErrors).toEqual([
      {
        path: "missing.yaml",
        message: "File missing from the corpus",
        key: "core.corpus.missingFile",
      },
    ]);
    expect(corpusErrorText(model.corpusErrors[0], createText("de"))).toBe(
      germanText.t("core.corpus.missingFile"),
    );
    expect(corpusErrorText({ path: "x", message: "as is" }, createText("de"))).toBe("as is");
  });

  it("lets a real parser bug through instead of hiding it as a broken record", () => {
    // A `YamlError` is a broken record — that is what the skip is for. A
    // programming error in the parser itself is something else and should be
    // loud, not end up as an inconspicuous entry in the validation list.
    const original = yamlModule.parseYaml;
    const spy = jest.spyOn(yamlModule, "parseYaml").mockImplementation((text: string) => {
      if (text.includes("BOOM")) throw new TypeError("real programming error");
      return original(text);
    });
    try {
      expect(() =>
        loadCorpus({
          facetrc,
          index: "records:\n  - boom.yaml\n",
          records: { "boom.yaml": "BOOM\n" },
        }),
      ).toThrow(TypeError);
    } finally {
      spy.mockRestore();
    }
  });

  it("still throws when .facetrc.yaml itself is broken", () => {
    // Without a readable configuration Atlas does not even know which records
    // there should be — that is not a single finding one could skip, but the
    // precondition for the whole corpus.
    expect(() => loadCorpus({ facetrc: "loose line\n", index, records })).toThrow(YamlError);
  });

  it("still throws when the record index itself is broken", () => {
    expect(() => loadCorpus({ facetrc, index: "loose line\n", records })).toThrow(YamlError);
  });
});

describe("Calibration from the host", () => {
  const source = {
    facetrc: "",
    index: "records: []\n",
    records: {},
  };

  /**
   * The crash this test pins down: for a registry with fewer than five records
   * Go delivers no reading, a nil slice becomes `null`, and
   * `readings.some(...)` in the first render pass takes the whole page down.
   */
  it("survives null instead of a list rather than breaking on it", () => {
    const model = loadCorpus({
      ...source,
      calibration: {
        records: 3,
        scenarios: 3,
        anchoredFiles: 3,
        domains: 1,
        capabilities: 1,
        hasTaxonomy: false,
        metrics: null,
        readings: null,
      } as never,
    });

    expect(model.calibration).not.toBeNull();
    expect(model.calibration!.readings).toEqual([]);
    expect(model.calibration!.metrics).toEqual([]);
    // This is the call that used to throw.
    expect(model.calibration!.readings.some((r) => r.includes("bands"))).toBe(false);
  });

  it("leaves a missing calibration as null", () => {
    expect(loadCorpus(source).calibration).toBeNull();
  });
});
