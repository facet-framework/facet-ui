import { createText } from "../facet/i18n/text";
import { taskflowModel } from "./fixtures";
import { leadFor, type ProbeKey } from "./lead";
import { formatNumber } from "./model";
import { probeOf } from "./probes";
import { ROLES } from "./roles";

const germanText = createText("de");

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
  it("formats probe counts in the active locale", () => {
    const counted = { ...model, scnProven: 1000, scnTotal: 2000 };
    expect(probeOf(counted, "coverage").rows[0].value).toBe("1,000/2,000");
    expect(probeOf(counted, "coverage", createText("de")).rows[0].value).toBe("1.000/2.000");
    expect(probeOf(counted, "coverage", createText("de")).rows[1].value).toBe("1.000");
  });

  it("answers every probe with a heading and items", () => {
    ALL.forEach((key) => {
      const view = probeOf(model, key);
      expect(view.head).not.toBe("");
      expect(view.rows.length).toBeGreaterThan(0);
    });
  });

  it("leaves no number in the lead sentence without its calculation", () => {
    // A number that can be clicked and shows nothing is a dead end.
    ROLES.forEach((role) => {
      leadFor(model, role.key)
        .filter((segment) => segment.kind === "probe")
        .forEach((segment) => {
          if (segment.kind !== "probe") return;
          expect(probeOf(model, segment.probe).rows.length).toBeGreaterThan(0);
        });
    });
  });

  it("counts coverage as a fraction and the gap as a number", () => {
    const view = probeOf(model, "coverage");
    expect(view.head).toBe("TEST MAPPINGS");
    expect(view.rows[0]).toEqual({
      label: "TEST MAPPED",
      value: `${model.scnProven}/${model.scnTotal}`,
      meaning: "neutral",
    });
    expect(view.rows[1].label).toBe("NO TEST");
  });

  it("marks a gap, but not zero", () => {
    const view = probeOf(model, "open");
    const zeros = view.rows.filter((row) => row.value === "0").map((row) => row.meaning);
    expect(zeros.every((meaning) => meaning === "neutral")).toBe(true);
  });

  it("tells an elapsed deadline from an open gap", () => {
    const view = probeOf(model, "overdue");
    const row = view.rows.find((entry) => entry.label === "OVERDUE");
    expect(row?.meaning).toBe(model.overdue > 0 ? "due" : "neutral");
  });

  it("says nothing is there for empty evidence instead of staying silent", () => {
    expect(probeOf(model, "edges").note.length).toBeGreaterThan(0);
    expect(probeOf(model, "know").note.length).toBeGreaterThan(0);
    expect(probeOf(model, "ops").note.length).toBeGreaterThan(0);
  });

  // The count and click target must refer to the same full decision-target list.
  it("makes DECISION REFERENCES clickable to the full list of their targets", () => {
    const view = probeOf(model, "know");
    const row = view.rows.find((entry) => entry.label === "DECISION REFERENCES");
    expect(row?.sectionKey).toBe("decisions");
    expect(row?.value).toBe(
      formatNumber(model.decisionTargets.reduce((sum, entry) => sum + entry.count, 0)),
    );
  });

  it("leaves other probe rows without a sectionKey — they are no dead end, but no jump target either", () => {
    const view = probeOf(model, "know");
    const row = view.rows.find((entry) => entry.label === "ANSWERED");
    expect(row?.sectionKey).toBeUndefined();
  });

  it("names every team with its contact", () => {
    const view = probeOf(model, "teams");
    expect(view.note.length).toBe(Object.keys(model.teams).length);
    view.note.forEach((line) => expect(line).toContain(" · "));
  });

  it("claims no line coverage where only test code was counted", () => {
    const scanned = {
      ...model,
      scan: { ...model.scan, testLoc: 400, totalLoc: 2000, testFiles: 9 },
    };
    const view = probeOf(scanned, "coverage");
    expect(view.note[0]).toContain("Test code share 20%");
    expect(view.note[1]).toContain("line coverage not connected");
    const german = probeOf(scanned, "coverage", createText("de"));
    expect(german.head).toBe(germanText.t("core.probes.head.coverage"));
    expect(german.note[0]).toContain(
      germanText.t("core.probes.testCodeShare", { pct: 20, test: 400, total: 2000 }),
    );
    expect(german.note[1]).toContain(germanText.t("core.probes.testFiles", { count: 9 }));
  });

  it("stays silent about lines as long as the scan has counted none", () => {
    const bare = { ...model, scan: { ...model.scan, testLoc: undefined, totalLoc: undefined } };
    expect(probeOf(bare, "coverage").note).toEqual([]);
  });

  it("lists the core features without a policy among the open points", () => {
    const view = probeOf(model, "open");
    const row = view.rows.find((entry) => entry.label === "NO POLICY");
    expect(row?.value).toBe(String(model.uncovered.length));
  });

  it("names test levels in capitals in the active language", () => {
    const kinds = Object.keys(model.testKinds).filter((kind) => model.testKinds[kind]);
    expect(kinds.length).toBeGreaterThan(0);
    const labels = (locale: string) =>
      probeOf(model, "coverage", createText(locale))
        .rows.slice(2)
        .map((row) => row.label);
    expect(labels("en")).toContain("UNIT");
    expect(labels("de")).toContain(germanText.t("core.label.testKind.unit").toUpperCase());
  });

  it("fills every probe's notes in German without leaving a placeholder", () => {
    const de = createText("de");
    const drifted = {
      ...model,
      scan: { ...model.scan, drift: [{ id: "tasks/create/quick-add" }] },
    } as unknown as typeof model;
    for (const key of ALL) {
      const view = probeOf(drifted, key, de);
      expect(view.head).not.toMatch(/[a-z]\./);
      [...view.note, ...view.rows.map((row) => row.label)].forEach((line) =>
        expect(line).not.toMatch(/\{\{/),
      );
    }
    expect(probeOf(drifted, "anchors", de).note).toContain(
      germanText.t("core.probes.movedLine", { id: "tasks/create/quick-add" }),
    );
  });
});
