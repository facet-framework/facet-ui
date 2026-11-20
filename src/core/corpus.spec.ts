import { labelText } from "../i18n/legacy/labels";
import { localized } from "../i18n/legacy/core/corpus.spec.text";
import { loadCorpus } from "./corpus";
import * as yamlModule from "./yaml";
import { YamlError } from "./yaml";

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

  it("skips paths without files", () => {
    const model = loadCorpus({ facetrc, index, records });
    expect(model.byId["tasks/create/quick-add"]).toBeDefined();
  });

  it("handles an empty index", () => {
    const model = loadCorpus({ facetrc, index: "records: []\n", records: {} });
    expect(model.recs).toHaveLength(0);
    expect(model.scnTotal).toBe(0);
  });
});

describe("a broken record does not block the corpus", () => {
  const brokenIndex = "records:\n  - a.yaml\n  - broken.yaml\n";
  const brokenRecords = {
    "a.yaml": "id: tasks/create/quick-add\nlifecycle: active\n",
    ["broken.yaml"]: labelText.text347,
  };

  it("builds the model from remaining valid records", () => {
    const model = loadCorpus({ facetrc, index: brokenIndex, records: brokenRecords });
    expect(model.recs).toHaveLength(1);
    expect(model.byId["tasks/create/quick-add"]).toBeDefined();
  });

  it("records the file, message and line in model.corpusErrors", () => {
    const model = loadCorpus({ facetrc, index: brokenIndex, records: brokenRecords });
    expect(model.corpusErrors).toHaveLength(1);
    expect(model.corpusErrors[0].path).toBe("broken.yaml");
    expect(model.corpusErrors[0].line).toBe(1);

    expect(model.corpusErrors[0].message).not.toMatch(labelText.text451);
  });

  it("leaves model.corpusErrors empty when every indexed path has a file", () => {
    const model = loadCorpus({ facetrc, index: "records:\n  - a.yaml\n", records });
    expect(model.corpusErrors).toEqual([]);
  });

  it("reports a missing indexed file as a separate corpus error", () => {
    const model = loadCorpus({ facetrc, index, records });
    expect(model.corpusErrors).toEqual([{ path: "missing.yaml", message: localized.text12 }]);
  });

  it("propagates parser failures instead of hiding them as broken records", () => {
    const original = yamlModule.parseYaml;
    const spy = jest.spyOn(yamlModule, "parseYaml").mockImplementation((text: string) => {
      if (text.includes("BOOM")) throw new TypeError("actual programming error");
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

  it("still throws when the configuration itself is broken", () => {
    expect(() => loadCorpus({ facetrc: labelText.text452, index, records })).toThrow(YamlError);
  });

  it("still throws when the record index itself is broken", () => {
    expect(() => loadCorpus({ facetrc, index: labelText.text452, records })).toThrow(YamlError);
  });
});

describe("Calibration from the host", () => {
  const source = {
    facetrc: "",
    index: "records: []\n",
    records: {},
  };

  it("handles null in place of a list", () => {
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

    expect(model.calibration!.readings.some((r) => r.includes("bands"))).toBe(false);
  });

  it("preserves null for missing calibration", () => {
    expect(loadCorpus(source).calibration).toBeNull();
  });
});
