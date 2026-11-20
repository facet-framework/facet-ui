import { createText } from "../facet/i18n/text";
import { taskflowModel } from "./fixtures";
import { buildModel } from "./model";
import { buildQuietLines } from "./quietLines";
import type { RawRecord } from "./types";

const germanText = createText("de");

describe("Unit tests for buildQuietLines", () => {
  it("states every reassurance in the demo corpus when the population is not empty", () => {
    const model = taskflowModel();
    // The demo corpus has active core features, records with a team, edges and
    // checks with a due date — every population is non-empty, so every line
    // may stand as soon as its count is 0.
    const quiet = {
      ...model,
      overdue: 0,
      overdueList: [],
      unanchored: [],
      noOwner: [],
      ghosts: [],
    };
    const lines = buildQuietLines(quiet);
    expect(lines).toContain("No review is overdue.");
    expect(lines).toContain("Every active record has an entry point in code.");
    expect(lines).toContain("Every record has a team.");
    expect(lines).toContain("No reference points into nothing.");
    expect(buildQuietLines(quiet, createText("de"))).toEqual([
      germanText.t("core.quiet.noOverdue"),
      germanText.t("core.quiet.allAnchored"),
      germanText.t("core.quiet.allOwned"),
      germanText.t("core.quiet.noGhosts"),
    ]);
  });

  // A negation that checked nothing is no reassurance. A corpus with no
  // active core features at all must not claim that "every active record"
  // has an entry point — there is none the statement could have checked.
  it("suppresses 'Every active record has an entry point in code' when there is no active core feature", () => {
    const plannedOnly: RawRecord = {
      path: "a.yaml",
      raw: "",
      doc: { id: "a/b/c", lifecycle: "planned" },
    };
    const model = buildModel({}, [plannedOnly.path], [plannedOnly], {});

    expect(model.features.some((f) => f.activeAnywhere)).toBe(false);
    expect(model.unanchored).toHaveLength(0);
    expect(buildQuietLines(model)).not.toContain("Every active record has an entry point in code.");
  });

  it("suppresses 'No review is overdue' when no check exists", () => {
    const noChecks: RawRecord = {
      path: "policy/x/y.yaml",
      raw: "",
      doc: { id: "policy/x/y" },
    };
    const model = buildModel({}, [noChecks.path], [noChecks], {});

    expect(model.policies.some((p) => p.complianceChecks.length > 0)).toBe(false);
    expect(model.overdue).toBe(0);
    expect(buildQuietLines(model)).not.toContain("No review is overdue.");
  });

  it("suppresses 'Every record has a team' when the corpus is empty", () => {
    const model = buildModel({}, [], [], {});

    expect(model.recs).toHaveLength(0);
    expect(model.noOwner).toHaveLength(0);
    expect(buildQuietLines(model)).not.toContain("Every record has a team.");
  });

  it("suppresses 'No reference points into nothing' when there is no edge", () => {
    const noEdges: RawRecord = {
      path: "a.yaml",
      raw: "",
      doc: { id: "a/b/c", lifecycle: "active" },
    };
    const model = buildModel({}, [noEdges.path], [noEdges], {});

    expect(model.edges).toHaveLength(0);
    expect(model.ghosts).toHaveLength(0);
    expect(buildQuietLines(model)).not.toContain("No reference points into nothing.");
  });

  // The original bug: an active variants record that never counted as active
  // because of `f.lifecycle === "active"` made the population wrongly empty.
  // With activeAnywhere it is not, and the line may claim something again —
  // but only as long as it is true.
  it("counts an active variant as a non-empty population for the entry-points line", () => {
    const variantsRecord: RawRecord = {
      path: "a.yaml",
      raw: "",
      doc: { id: "web/auth/login", variants: { web: { lifecycle: "active" } } },
    };
    const anchored = buildModel({}, [variantsRecord.path], [variantsRecord], {
      anchors: { "web/auth/login": [{ path: "src/login.ts", line: 1, role: "primary" }] },
    });
    expect(buildQuietLines(anchored)).toContain("Every active record has an entry point in code.");

    const unanchored = buildModel({}, [variantsRecord.path], [variantsRecord], {});
    expect(buildQuietLines(unanchored)).not.toContain(
      "Every active record has an entry point in code.",
    );
  });
});
