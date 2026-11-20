import { localized } from "../i18n/legacy/core/quietLines.spec.text";
import { taskflowModel } from "./fixtures";
import { buildModel } from "./model";
import { buildQuietLines } from "./quietLines";
import type { RawRecord } from "./types";

describe("Unit tests for buildQuietLines", () => {
  it("states each reassurance for nonempty demo populations", () => {
    const model = taskflowModel();

    const quiet = {
      ...model,
      overdue: 0,
      overdueList: [],
      unanchored: [],
      noOwner: [],
      ghosts: [],
    };
    const lines = buildQuietLines(quiet);
    expect(lines).toContain(localized.text2);
    expect(lines).toContain(localized.text3);
    expect(lines).toContain(localized.text4);
    expect(lines).toContain(localized.text5);
  });

  it("suppresses anchor reassurance without active core functions", () => {
    const plannedOnly: RawRecord = {
      path: "a.yaml",
      raw: "",
      doc: { id: "a/b/c", lifecycle: "planned" },
    };
    const model = buildModel({}, [plannedOnly.path], [plannedOnly], {});

    expect(model.features.some((f) => f.activeAnywhere)).toBe(false);
    expect(model.unanchored).toHaveLength(0);
    expect(buildQuietLines(model)).not.toContain(localized.text7);
  });

  it("suppresses overdue reassurance when no reviews exist", () => {
    const noChecks: RawRecord = {
      path: "policy/x/y.yaml",
      raw: "",
      doc: { id: "policy/x/y" },
    };
    const model = buildModel({}, [noChecks.path], [noChecks], {});

    expect(model.policies.some((p) => p.complianceChecks.length > 0)).toBe(false);
    expect(model.overdue).toBe(0);
    expect(buildQuietLines(model)).not.toContain(localized.text9);
  });

  it("suppresses team reassurance for an empty corpus", () => {
    const model = buildModel({}, [], [], {});

    expect(model.recs).toHaveLength(0);
    expect(model.noOwner).toHaveLength(0);
    expect(buildQuietLines(model)).not.toContain(localized.text11);
  });

  it("suppresses reference reassurance when no edges exist", () => {
    const noEdges: RawRecord = {
      path: "a.yaml",
      raw: "",
      doc: { id: "a/b/c", lifecycle: "active" },
    };
    const model = buildModel({}, [noEdges.path], [noEdges], {});

    expect(model.edges).toHaveLength(0);
    expect(model.ghosts).toHaveLength(0);
    expect(buildQuietLines(model)).not.toContain(localized.text13);
  });

  it("counts active variants in the anchor population", () => {
    const variantsRecord: RawRecord = {
      path: "a.yaml",
      raw: "",
      doc: { id: "web/auth/login", variants: { web: { lifecycle: "active" } } },
    };
    const anchored = buildModel({}, [variantsRecord.path], [variantsRecord], {
      anchors: { "web/auth/login": [{ path: "src/login.ts", line: 1, role: "primary" }] },
    });
    expect(buildQuietLines(anchored)).toContain(localized.text15);

    const unanchored = buildModel({}, [variantsRecord.path], [variantsRecord], {});
    expect(buildQuietLines(unanchored)).not.toContain(localized.text16);
  });
});
