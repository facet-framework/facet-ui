import { labelText } from "../i18n/legacy/labels";
import { localized } from "../i18n/legacy/core/probes.spec.text";
import { taskflowModel } from "./fixtures";
import { leadFor, type ProbeKey } from "./lead";
import { formatNumber } from "./model";
import { probeOf } from "./probes";
import { ROLES } from "./roles";

const model = taskflowModel();

const ALL: ProbeKey[] = [
  "features",
  "coverage",
  "open",
  "overdue",
  "edges",
  "anchors",
  "teams",
  "know",
  "ops",
  "pii",
];

describe("Unit tests for probeOf", () => {
  it("answers every probe with a heading and items", () => {
    ALL.forEach((key) => {
      const view = probeOf(model, key);
      expect(view.head).not.toBe("");
      expect(view.rows.length).toBeGreaterThan(0);
    });
  });

  it("provides a calculation for every lead figure", () => {
    ROLES.forEach((role) => {
      leadFor(model, role.key)
        .filter((segment) => segment.kind === "probe")
        .forEach((segment) => {
          if (segment.kind !== "probe") return;
          expect(probeOf(model, segment.probe).rows.length).toBeGreaterThan(0);
        });
    });
  });

  it("counts coverage as a fraction and gaps as a number", () => {
    const view = probeOf(model, "coverage");
    expect(view.head).toBe("TESTZUORDNUNGEN");
    expect(view.rows[0]).toEqual({
      label: "TEST ZUGEORDNET",
      value: `${model.scnProven}/${model.scnTotal}`,
      meaning: "neutral",
    });
    expect(view.rows[1].label).toBe(localized.text4);
  });

  it("marks nonzero gaps", () => {
    const view = probeOf(model, "open");
    const zeros = view.rows.filter((row) => row.value === "0").map((row) => row.meaning);
    expect(zeros.every((meaning) => meaning === "neutral")).toBe(true);
  });

  it("distinguishes expired deadlines from open gaps", () => {
    const view = probeOf(model, "overdue");
    const row = view.rows.find((entry) => entry.label === localized.text7);
    expect(row?.meaning).toBe(model.overdue > 0 ? "deadline" : "neutral");
  });

  it("reports missing evidence explicitly", () => {
    expect(probeOf(model, "edges").note.length).toBeGreaterThan(0);
    expect(probeOf(model, "know").note.length).toBeGreaterThan(0);
    expect(probeOf(model, "ops").note.length).toBeGreaterThan(0);
  });

  it("links decision references to the complete target list", () => {
    const view = probeOf(model, "know");
    const row = view.rows.find((entry) => entry.label === "ENTSCHEIDUNGSVERWEISE");
    expect(row?.sectionKey).toBe("decisions");
    expect(row?.value).toBe(
      formatNumber(model.decisionTargets.reduce((sum, entry) => sum + entry.count, 0)),
    );
  });

  it("leaves other probe rows without sectionKey", () => {
    const view = probeOf(model, "know");
    const row = view.rows.find((entry) => entry.label === "BEANTWORTET");
    expect(row?.sectionKey).toBeUndefined();
  });

  it("names every team and contact", () => {
    const view = probeOf(model, "teams");
    expect(view.note.length).toBe(Object.keys(model.teams).length);
    view.note.forEach((line) => expect(line).toContain(" · "));
  });

  it("makes no line-coverage claim from test-code counts", () => {
    const scanned = {
      ...model,
      scan: { ...model.scan, testLoc: 400, totalLoc: 2000, testFiles: 9 },
    };
    const view = probeOf(scanned, "coverage");
    expect(view.note[0]).toContain(labelText.text346);
    expect(view.note[1]).toContain(localized.text13);
  });

  it("omits line claims when the scan has no counts", () => {
    const bare = { ...model, scan: { ...model.scan, testLoc: undefined, totalLoc: undefined } };
    expect(probeOf(bare, "coverage").note).toEqual([]);
  });

  it("lists core functions without policies among open issues", () => {
    const view = probeOf(model, "open");
    const row = view.rows.find((entry) => entry.label === localized.text16);
    expect(row?.value).toBe(String(model.uncovered.length));
  });
});
