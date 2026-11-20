import { germanText as germanLabels } from "../i18n/legacy/shared";
import { localized } from "../i18n/legacy/core/model.spec.text";
import { taskflowModel, taskflowRecord } from "./fixtures";
import {
  buildErrorCodeRegister,
  buildModel,
  collectPaths,
  errorCodeBand,
  extractErrorCodes,
  formatNumber,
  humanize,
  isRenderedPath,
  parseEnumConstraint,
  pct,
  recordKindOf,
  shapeRecord,
} from "./model";
import type { RawRecord } from "./types";
import type { YamlValue } from "./yaml";

describe("Unit tests for model helpers", () => {
  it("makes filenames readable without inventing content", () => {
    expect(humanize("quick-add")).toBe("Quick add");
    expect(humanize("last_write_wins")).toBe("Last write wins");
    expect(humanize("")).toBe("");
  });

  it("calculates shares and handles zero totals", () => {
    expect(pct(31, 38)).toBe(82);
    expect(pct(5, 0)).toBe(0);
  });

  it("separates thousands", () => {
    expect(formatNumber(84200)).toBe("84 200");
  });

  it("derives record kinds from identifiers", () => {
    expect(recordKindOf("tasks/create/quick-add")).toBe("feature");
    expect(recordKindOf("policy/notifications/quiet-hours")).toBe("policy");
    expect(recordKindOf("assumption/sync/clock-skew")).toBe("assumption");
    expect(recordKindOf("data/tasks/task-item")).toBe("entity");
  });

  it("recognizes rendered field paths including prefixes", () => {
    expect(isRenderedPath("intent.summary")).toBe(true);
    expect(isRenderedPath("contract.scenarios[].pre_state.count")).toBe(true);
    expect(isRenderedPath("intent.unbekanntes_feld")).toBe(false);
  });

  it("collects field paths and frequencies", () => {
    const out: Record<string, number> = {};
    collectPaths({ intent: { summary: "a" }, tags: ["x", "y"] }, "", out);
    expect(out["intent.summary"]).toBe(1);
    expect(out["tags[]"]).toBe(2);
  });

  it("generalizes knowledge slots and test levels into patterns", () => {
    const out: Record<string, number> = {};
    collectPaths(
      {
        knowledge: { a: { question: "?" }, b: { question: "?" } },
        verification: { unit_tests: [{ id: "t" }] },
      },
      "",
      out,
    );
    expect(out["knowledge.*.question"]).toBe(2);
    expect(out["verification.*_tests[].id"]).toBe(1);
  });

  it("generalizes variant keys into a pattern", () => {
    const out: Record<string, number> = {};
    collectPaths(
      { variants: { web: { lifecycle: "active" }, native: { lifecycle: "planned" } } },
      "",
      out,
    );
    expect(out["variants.*.lifecycle"]).toBe(2);
  });

  it("recognizes variants, flags, dashboards and observability as rendered", () => {
    expect(isRenderedPath("variants.*.lifecycle")).toBe(true);
    expect(isRenderedPath("flags[].key")).toBe(true);
    expect(isRenderedPath("observation.dashboards[].url")).toBe(true);
    expect(isRenderedPath("observability.metrics_emitted[].name")).toBe(true);
    expect(isRenderedPath("observability.traces_emitted[].span_name")).toBe(true);
  });
});

describe("Unit tests for shapeRecord", () => {
  it("reads promises, tests and evidence together", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "tasks/create/quick-add",
          lifecycle: "active",
          contract: { scenarios: [{ id: "task-added", statement: localized.text11 }] },
          verification: { unit_tests: [{ id: "creates_task", proves: ["task-added"] }] },
        },
      },
      {},
    );

    expect(record.kind).toBe("feature");
    expect(record.label).toBe("Quick add");
    expect(record.total).toBe(1);
    expect(record.proven).toBe(1);
    expect(record.tests[0].kind).toBe("unit");
  });

  it("treats missing backing as backed", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          contract: {
            scenarios: [
              { id: "without-block" },
              {
                id: "explizit-unbacked",
                backing: {
                  state: "unbacked",
                  reason: localized.text14,
                  unblocked_by: "billing/categories/assign-category",
                },
              },
            ],
          },
        },
      },
      {},
    );

    expect(record.scenarios[0].backing).toEqual({ state: "backed", reason: "", unblockedBy: "" });
    expect(record.scenarios[1].backing).toEqual({
      state: "unbacked",
      reason: localized.text15,
      unblockedBy: "billing/categories/assign-category",
    });
  });

  it("makes no deviation claim without a block", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          contract: {
            scenarios: [
              { id: "without-block" },
              {
                id: "full",
                deviation: {
                  reason: localized.text18,
                  confirmed_by: "code-review",
                  tracked_as: "#212",
                },
              },
            ],
          },
        },
      },
      {},
    );

    expect(record.scenarios[0].deviation).toBeNull();
    expect(record.scenarios[1].deviation).toEqual({
      reason: localized.text19,
      confirmedBy: "code-review",
      trackedAs: "#212",
    });
  });

  it("reads deviation without confirmed_by and with null tracked_as", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          contract: {
            scenarios: [
              {
                id: "sparse",
                deviation: { reason: localized.text21, tracked_as: null },
              },
            ],
          },
        },
      },
      {},
    );

    expect(record.scenarios[0].deviation).toEqual({
      reason: localized.text22,
      confirmedBy: "",
      trackedAs: "",
    });
  });

  it("reads audience without inventing it when absent", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          contract: {
            scenarios: [
              { id: "without-field" },
              { id: "for-product", audience: "product" },
              { id: "for-engineering", audience: "engineering" },
            ],
          },
        },
      },
      {},
    );

    expect(record.scenarios[0].audience).toBeNull();
    expect(record.scenarios[1].audience).toBe("product");
    expect(record.scenarios[2].audience).toBe("engineering");
  });

  it("rejects audiences unknown to the schema", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          contract: {
            scenarios: [{ id: "invented", audience: "technical-function" }],
          },
        },
      },
      {},
    );

    expect(record.scenarios[0].audience).toBeNull();
  });

  it("marks audience as rendered for completeness", () => {
    expect(isRenderedPath("contract.scenarios[].audience")).toBe(true);
  });

  it("marks unproven promises", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: { id: "a/b/c", contract: { scenarios: [{ id: "open" }] } },
      },
      {},
    );
    expect(record.proven).toBe(0);
    expect(record.scenarios[0].proven).toBe(false);
  });

  it("reads the defect register and calculates totals and file counts", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          defects: {
            fixes: [
              {
                commit: "a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1",
                date: "2026-01-09",
                files: ["src/list.ts"],
                subject: localized.text30,
                recorded_by: "manual",
              },
              {
                commit: "b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2",
                date: "2026-03-02",
                files: ["src/list.ts", "src/page.ts"],
                issue: "#42",
                recorded_by: "git-history",
              },
            ],
          },
        },
      },
      {},
    );

    expect(record.defects.present).toBe(true);
    expect(record.defects.total).toBe(2);

    expect(record.defects.fixes[0].date).toBe("2026-03-02");
    expect(record.defects.fixes[0].issue).toBe("#42");
    expect(record.defects.lastFix).toBe("2026-03-02");

    expect(record.defects.byFile).toEqual([
      { path: "src/list.ts", count: 2 },
      { path: "src/page.ts", count: 1 },
    ]);
  });

  it("treats a missing register as unchecked rather than zero", () => {
    const record = shapeRecord({ path: "a.yaml", raw: "", doc: { id: "a/b/c" } }, {});
    expect(record.defects.present).toBe(false);
    expect(record.defects.total).toBe(0);
    expect(record.defects.fixes).toEqual([]);

    const looked = shapeRecord(
      { path: "b.yaml", raw: "", doc: { id: "a/b/d", defects: { fixes: [] } } },
      {},
    );
    expect(looked.defects.present).toBe(true);
    expect(looked.defects.total).toBe(0);
  });

  it("skips entries without a commit as they lack evidence", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          defects: {
            fixes: [
              { date: "2026-01-09", files: ["src/list.ts"] },
              { commit: "c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3", date: "2026-01-10", files: [] },
            ],
          },
        },
      },
      {},
    );
    expect(record.defects.total).toBe(1);
    expect(record.defects.fixes[0].commit).toBe("c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3");
  });

  it("handles an empty document", () => {
    const record = shapeRecord({ path: "empty.yaml", raw: "", doc: {} }, {});
    expect(record.id).toBe("empty.yaml");
    expect(record.lifecycle).toBe("—");
    expect(record.present.intent).toBe(false);
  });

  it("takes anchors from the scan rather than the record", () => {
    const record = shapeRecord(
      { path: "a.yaml", raw: "", doc: { id: "a/b/c" } },
      { anchors: { "a/b/c": [{ path: "src/a.ts", line: 12, role: "primary" }] } },
    );
    expect(record.anchors).toHaveLength(1);
    expect(record.present.anchors).toBe(true);
  });

  describe("variants (FACET 1.4)", () => {
    it("reads variants without inventing an aggregate lifecycle", () => {
      const record = shapeRecord(
        {
          path: "a.yaml",
          raw: "",
          doc: {
            id: "web/auth/login",
            variants: {
              web: { lifecycle: "active" },
              native: { lifecycle: "planned", notes: localized.text36 },
            },
          },
        },
        {},
      );

      expect(record.lifecycle).toBe("—");
      expect(record.variants).toEqual({
        web: { lifecycle: "active", notes: undefined },
        native: { lifecycle: "planned", notes: localized.text37 },
      });
    });

    it("is activeAnywhere when any variant is active", () => {
      const activeOnOne = shapeRecord(
        {
          path: "a.yaml",
          raw: "",
          doc: {
            id: "a/b/c",
            variants: { web: { lifecycle: "active" }, native: { lifecycle: "planned" } },
          },
        },
        {},
      );
      expect(activeOnOne.activeAnywhere).toBe(true);

      const activeOnNone = shapeRecord(
        {
          path: "b.yaml",
          raw: "",
          doc: { id: "a/b/d", variants: { native: { lifecycle: "planned" } } },
        },
        {},
      );
      expect(activeOnNone.activeAnywhere).toBe(false);
    });

    it("uses scalar lifecycle for ordinary records", () => {
      const active = shapeRecord(
        { path: "a.yaml", raw: "", doc: { id: "a/b/c", lifecycle: "active" } },
        {},
      );
      expect(active.variants).toBeNull();
      expect(active.activeAnywhere).toBe(true);

      const planned = shapeRecord(
        { path: "b.yaml", raw: "", doc: { id: "a/b/d", lifecycle: "planned" } },
        {},
      );
      expect(planned.activeAnywhere).toBe(false);
    });
  });

  it("reads exposure flags independently of lifecycle", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          flags: [
            {
              key: "new-inbox",
              system: "launchdarkly",
              default: false,
              rollout: "10% internal",
            },
          ],
        },
      },
      {},
    );
    expect(record.flags).toEqual([
      {
        key: "new-inbox",
        system: "launchdarkly",
        default: false,
        variants: [],
        rollout: "10% internal",
        retireBy: undefined,
      },
    ]);
  });

  it("reads dashboard URLs", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          observation: { dashboards: [{ url: "https://grafana.example/d/1" }] },
        },
      },
      {},
    );
    expect(record.dashboards).toEqual([{ url: "https://grafana.example/d/1" }]);
  });

  it("reads observability alongside observation", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          observability: {
            metrics_emitted: [{ name: "gate_subscribe_messages_total", kind: "counter" }],
            traces_emitted: [{ span_name: "gate.subscribe", attributes: ["account_id"] }],
            log_events: [{ event: "subscribe.failed", level: "error" }],
          },
        },
      },
      {},
    );
    expect(record.metricsEmitted).toEqual([
      {
        name: "gate_subscribe_messages_total",
        kind: "counter",
        labels: [],
        description: undefined,
      },
    ]);
    expect(record.tracesEmitted).toEqual([
      { spanName: "gate.subscribe", parentSpan: undefined, attributes: ["account_id"] },
    ]);
    expect(record.logEvents).toEqual([
      { event: "subscribe.failed", level: "error", attributes: [] },
    ]);
  });
});

describe("scenario implementation through implementedBy", () => {
  it("binds an anchor to the scenario named in proves", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: { id: "a/b/c", contract: { scenarios: [{ id: "task-added" }] } },
      },
      {
        anchors: {
          "a/b/c": [
            { path: "src/a.ts", line: 12, role: "primary", proves: ["task-added"] },
            { path: "src/b.ts", line: 7, role: "secondary" },
          ],
        },
      },
    );

    expect(record.scenarios[0].implementedBy).toHaveLength(1);
    expect(record.scenarios[0].implementedBy[0]).toEqual({
      path: "src/a.ts",
      line: 12,
      role: "primary",
      proves: ["task-added"],
    });
  });

  it("binds an anchor to every scenario named in proves", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          contract: { scenarios: [{ id: "s1" }, { id: "s2" }] },
        },
      },
      {
        anchors: {
          "a/b/c": [{ path: "src/a.ts", line: 12, role: "primary", proves: ["s1", "s2"] }],
        },
      },
    );

    expect(record.scenarios[0].implementedBy).toHaveLength(1);
    expect(record.scenarios[1].implementedBy).toHaveLength(1);
  });

  it("uses an empty list for scenarios without implementing anchors", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: { id: "a/b/c", contract: { scenarios: [{ id: "open" }] } },
      },
      { anchors: { "a/b/c": [{ path: "src/a.ts", line: 12, role: "primary" }] } },
    );

    expect(record.scenarios[0].implementedBy).toEqual([]);
  });

  it("keeps anchorsAdopted false when no scan anchor has proves", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: { id: "a/b/c", contract: { scenarios: [{ id: "open" }] } },
      },
      { anchors: { "a/b/c": [{ path: "src/a.ts", line: 12, role: "primary" }] } },
    );

    expect(record.scenarios[0].anchorsAdopted).toBe(false);
  });

  it("sets anchorsAdopted when any scan anchor has proves", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: { id: "a/b/c", contract: { scenarios: [{ id: "open" }] } },
      },
      {
        anchors: {
          "a/b/c": [{ path: "src/a.ts", line: 12, role: "primary" }],
          "x/y/z": [{ path: "src/z.ts", line: 3, role: "primary", proves: ["z-scenario"] }],
        },
      },
    );

    expect(record.scenarios[0].anchorsAdopted).toBe(true);
  });

  it("keeps implementedBy empty and anchorsAdopted false without scan anchors", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: { id: "a/b/c", contract: { scenarios: [{ id: "open" }] } },
      },
      {},
    );

    expect(record.scenarios[0].implementedBy).toEqual([]);
    expect(record.scenarios[0].anchorsAdopted).toBe(false);
  });
});

describe("buildModel integration with the demo corpus", () => {
  const model = taskflowModel();

  it("reads all seventeen records", () => {
    expect(model.recs).toHaveLength(17);
    expect(
      model.features.length +
        model.policies.length +
        model.assumptions.length +
        model.entities.length,
    ).toBe(17);
  });

  it("groups core functions by area", () => {
    expect(model.domains.length).toBeGreaterThan(1);
    expect(model.domains.every((domain) => domain.items.length > 0)).toBe(true);
  });

  it("counts promises and evidence consistently", () => {
    expect(model.scnTotal).toBe(model.allScn.length);
    expect(model.scnProven).toBe(model.allScn.filter((scenario) => scenario.proven).length);
    expect(model.scnProven).toBeLessThanOrEqual(model.scnTotal);
  });

  it("checks overdue reviews against the scan date", () => {
    expect(model.overdue).toBe(model.overdueList.length);
    model.overdueList.forEach((entry) => expect(entry.check.overdue).toBe(true));
  });

  it("finds references without records as ghosts", () => {
    model.ghosts.forEach((ghost) => expect(model.byId[ghost]).toBeUndefined());
  });

  it("calculates depth and degree for each node", () => {
    model.edges.forEach((edge) => {
      expect(model.depth[edge.to]).toBeGreaterThanOrEqual(model.depth[edge.from] + 1);
    });
    expect(model.maxDepth).toBeGreaterThan(0);
  });

  it("keeps every rendered field path auditable", () => {
    expect(model.fieldPaths.length).toBeGreaterThan(0);
    expect(model.notRendered.every((field) => !field.rendered)).toBe(true);
  });

  it("tracks team ownership", () => {
    Object.values(model.teams).forEach((team) => expect(team.items.length).toBeGreaterThan(0));
  });

  it("finds a record by identifier", () => {
    const record = taskflowRecord("tasks/create/quick-add");
    expect(record.summary).not.toBe("");
    expect(record.adrs.length).toBeGreaterThan(0);
  });

  it("throws for unknown identifiers", () => {
    expect(() => taskflowRecord(localized.text65)).toThrow(localized.text66);
  });
});

describe("three lifecycle filters for variants", () => {
  const variantsRaw = (path: string, id: string): RawRecord => ({
    path,
    raw: "",
    doc: {
      id,
      variants: { web: { lifecycle: "active" }, native: { lifecycle: "planned" } },
      intent: { summary: localized.text68 },
      contract: { scenarios: [{ id: "login-ok", statement: localized.text69 }] },
      verification: { unit_tests: [{ id: "logs_in", proves: ["login-ok"] }] },
    },
  });

  it("counts an active variant without anchors as unanchored", () => {
    const raws = [variantsRaw("a.yaml", "web/auth/login")];
    const model = buildModel({}, [raws[0].path], raws, {});

    expect(model.unanchored.map((f) => f.id)).toContain("web/auth/login");
  });

  it("counts a fully proven anchored active variant as complete", () => {
    const raws = [variantsRaw("a.yaml", "web/auth/login")];
    const model = buildModel({}, [raws[0].path], raws, {
      anchors: { "web/auth/login": [{ path: "src/login.ts", line: 3, role: "primary" }] },
    });

    expect(model.unanchored).toHaveLength(0);
    expect(model.complete.map((f) => f.id)).toContain("web/auth/login");
  });

  it("counts an active variant without SLOs or alerts as noObs", () => {
    const raws = [variantsRaw("a.yaml", "web/auth/login")];
    const model = buildModel({}, [raws[0].path], raws, {});

    expect(model.noObs.map((f) => f.id)).toContain("web/auth/login");
  });

  it("triggers none of the three signals for planned-only variants", () => {
    const plannedOnly: RawRecord = {
      path: "b.yaml",
      raw: "",
      doc: { id: "native/auth/login", variants: { native: { lifecycle: "planned" } } },
    };
    const model = buildModel({}, [plannedOnly.path], [plannedOnly], {});

    expect(model.unanchored.map((f) => f.id)).not.toContain("native/auth/login");
    expect(model.noObs.map((f) => f.id)).not.toContain("native/auth/login");
  });
});

describe("Unit tests for decisionTargets", () => {
  const raw = (path: string, decisionRecords: string[] = []): RawRecord => ({
    path,
    raw: "",
    doc: { id: path, intent: { decision_records: decisionRecords } },
  });

  const raws = [
    raw("a", ["ADR-1", "ADR-2"]),
    raw("b", ["ADR-1"]),
    raw("c", ["ADR-3", "ADR-2"]),
    raw("d"),
  ];
  const model = buildModel(
    {},
    raws.map((r) => r.path),
    raws,
  );

  it("counts distinct targets rather than strings per record", () => {
    expect(model.decisionTargets).toHaveLength(3);
    expect(model.decisionTargets.reduce((sum, entry) => sum + entry.count, 0)).toBe(5);
  });

  it("sorts by descending frequency and then target", () => {
    expect(model.decisionTargets.map((entry) => entry.target)).toEqual(["ADR-1", "ADR-2", "ADR-3"]);
    expect(model.decisionTargets.map((entry) => entry.count)).toEqual([2, 2, 1]);
  });

  it("lists the records referencing each target", () => {
    const adr1 = model.decisionTargets.find((entry) => entry.target === "ADR-1");
    const adr3 = model.decisionTargets.find((entry) => entry.target === "ADR-3");
    expect(adr1?.recordIds).toEqual(["a", "b"]);
    expect(adr3?.recordIds).toEqual(["c"]);
  });

  it("stays empty without decision references", () => {
    const empty = buildModel({}, ["d"], [raw("d")]);
    expect(empty.decisionTargets).toEqual([]);
  });
});

describe("depth calculation for cycles", () => {
  const raw = (path: string, dependsOn: string[]): RawRecord => ({
    path,
    raw: "",
    doc: { id: path, lineage: { depends_on: dependsOn } },
  });

  const raws = [
    raw("tasks/a/root", []),
    raw("tasks/a/cycle-one", ["tasks/a/cycle-two"]),
    raw("tasks/a/cycle-two", ["tasks/a/cycle-one"]),
  ];
  const model = buildModel(
    {},
    raws.map((r) => r.path),
    raws,
  );

  it("bounds depth by chain length rather than iteration count", () => {
    expect(model.maxDepth).toBeLessThanOrEqual(raws.length);
  });

  it("reports cycle nodes instead of silently processing them", () => {
    expect(new Set(model.cyclic)).toEqual(new Set(["tasks/a/cycle-one", "tasks/a/cycle-two"]));
    expect(model.cyclic).not.toContain("tasks/a/root");
  });

  it("places both cycle nodes on the same layer", () => {
    expect(model.depth["tasks/a/cycle-one"]).toBe(model.depth["tasks/a/cycle-two"]);
  });
});

describe("mentioned but undeclared identifiers", () => {
  const raw = (path: string, summary: string, dependsOn: string[] = []): RawRecord => ({
    path,
    raw: "",
    doc: {
      id: path,
      intent: { summary },
      ...(dependsOn.length ? { lineage: { depends_on: dependsOn } } : {}),
    },
  });

  it("finds identifiers in prose without an edge", () => {
    const raws = [
      raw("billing/plans/upgrade", localized.text84),
      raw("identity/access/role-check", localized.text85),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    expect(model.undeclaredMentions).toEqual([
      { from: "billing/plans/upgrade", to: "identity/access/role-check" },
    ]);
  });

  it("ignores mentions with an existing edge in either direction", () => {
    const raws = [
      raw("billing/plans/upgrade", localized.text87, ["identity/access/role-check"]),
      raw("identity/access/role-check", localized.text88),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    expect(model.undeclaredMentions).toEqual([]);
  });

  it("reports nothing without another identifier in the text", () => {
    const raws = [
      raw("billing/plans/upgrade", localized.text90),
      raw("identity/access/role-check", localized.text91),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    expect(model.undeclaredMentions).toEqual([]);
  });

  it("reads scenario steps as well as the summary", () => {
    const raws: RawRecord[] = [
      {
        path: "billing/plans/upgrade",
        raw: "",
        doc: {
          id: "billing/plans/upgrade",
          contract: {
            scenarios: [
              {
                id: "upgrade-checks-role",
                statement: localized.text93,
              },
            ],
          },
        },
      },
      raw("identity/access/role-check", localized.text94),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    expect(model.undeclaredMentions).toEqual([
      { from: "billing/plans/upgrade", to: "identity/access/role-check" },
    ]);
  });
});

describe("error code register", () => {
  const withSummary = (id: string, summary: string): RawRecord => ({
    path: id,
    raw: "",
    doc: { id, intent: { summary } },
  });

  const withScenario = (id: string, statement: string): RawRecord => ({
    path: id,
    raw: "",
    doc: { id, contract: { scenarios: [{ id: `${id}-scenario`, statement }] } },
  });

  const withPitfall = (id: string, answer: string): RawRecord => ({
    path: id,
    raw: "",
    doc: { id, knowledge: { common_pitfalls: { answer } } },
  });

  it("finds codes in intent.summary", () => {
    const raws = [withSummary("api/errors/reject", localized.text97)];
    const entries = extractErrorCodes(raws.map((r) => shapeRecord(r, {})));
    expect(entries).toEqual([
      {
        code: "E2042",
        band: "E2xxx",
        records: [{ id: "api/errors/reject", statement: localized.text98 }],
      },
    ]);
  });

  it("finds codes across Gherkin scenario steps", () => {
    const raws = [withScenario("storage/errors/open", localized.text100)];
    const entries = extractErrorCodes(raws.map((r) => shapeRecord(r, {})));
    expect(entries).toHaveLength(1);
    expect(entries[0].code).toBe("E1010");
    expect(entries[0].records[0].id).toBe("storage/errors/open");
    expect(entries[0].records[0].statement).toMatch(/E1010/);
  });

  it("finds codes in common pitfalls but not other knowledge slots", () => {
    const raws = [
      withPitfall("catalog/errors/rate-limit", localized.text102),
      {
        path: "catalog/errors/other-slot",
        raw: "",
        doc: {
          id: "catalog/errors/other-slot",
          knowledge: { rollout: { answer: localized.text103 } },
        },
      } satisfies RawRecord,
    ];
    const entries = extractErrorCodes(raws.map((r) => shapeRecord(r, {})));
    expect(entries.map((e) => e.code)).toEqual(["E4090"]);
  });

  it("counts repeated mentions within one record only once", () => {
    const raws = [withSummary("api/errors/reject", localized.text105)];
    const entries = extractErrorCodes(raws.map((r) => shapeRecord(r, {})));
    expect(entries).toHaveLength(1);
    expect(entries[0].records).toHaveLength(1);
  });

  it("groups by leading digit and masks the remainder", () => {
    expect(errorCodeBand("E1042")).toBe("E1xxx");
    expect(errorCodeBand("E2999")).toBe("E2xxx");
    expect(errorCodeBand("E9000")).toBe("E9xxx");
  });

  it("accepts a configurable matching pattern", () => {
    const raws = [withSummary("market/errors/checkout", localized.text108)];
    const entries = extractErrorCodes(
      raws.map((r) => shapeRecord(r, {})),
      /W-\d{2}/g,
    );
    expect(entries.map((e) => e.code)).toEqual(["W-42"]);
  });

  it("marks collisions when multiple feature IDs name a code", () => {
    const raws = [
      withSummary("api/errors/reject", localized.text110),
      withSummary("catalog/errors/import-reject", localized.text111),
    ];
    const entries = extractErrorCodes(raws.map((r) => shapeRecord(r, {})));
    expect(entries).toHaveLength(1);
    expect(entries[0].records.map((r) => r.id).sort()).toEqual([
      "api/errors/reject",
      "catalog/errors/import-reject",
    ]);
  });

  it("builds a grouped and sorted register with a visible gap", () => {
    const raws = [
      withSummary("api/errors/a", "E2042 tritt auf."),
      withSummary("api/errors/b", "E2010 tritt ebenfalls auf."),
      withSummary("storage/errors/a", "E1010 tritt auf."),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );

    expect(model.errorCodeRegister.pattern).toBe("E\\d{4}");
    expect(model.errorCodeRegister.entries.map((e) => e.code)).toEqual(["E1010", "E2010", "E2042"]);
    expect(model.errorCodeRegister.bands.map((b) => b.band)).toEqual(["E1xxx", "E2xxx"]);

    const e2xxx = model.errorCodeRegister.bands.find((b) => b.band === "E2xxx")!;
    expect(e2xxx.codes.map((c) => c.code)).toEqual(["E2010", "E2042"]);

    expect(e2xxx.nextFree).toBe("E2000");

    expect(model.errorCodeRegister.collisions).toEqual([]);
  });

  it("reports no free number in a full band", () => {
    const digits = Array.from({ length: 10 }, (_, n) => n);
    const raws = digits.map((n) =>
      withSummary(`market/errors/x${n}`, `${localized.text114}${String(n).padStart(2, "0")}.`),
    );
    const entries = extractErrorCodes(
      raws.map((r) => shapeRecord(r, {})),
      /X-\d{2}/g,
    );
    const bands = buildErrorCodeRegister(
      raws.map((r) => shapeRecord(r, {})),
      /X-\d{2}/g,
    ).bands;
    expect(entries).toHaveLength(10);
    expect(bands).toHaveLength(1);
    expect(bands[0].band).toBe("X-0x");
    expect(bands[0].nextFree).toBeNull();
  });

  it("finds the lowest free number including internal gaps", () => {
    const raws = [
      withSummary("market/errors/a", localized.text116),
      withSummary("market/errors/b", localized.text117),
    ];
    const bands = buildErrorCodeRegister(
      raws.map((r) => shapeRecord(r, {})),
      /X-\d{2}/g,
    ).bands;
    expect(bands[0].band).toBe("X-0x");
    expect(bands[0].nextFree).toBe("X-00");
  });
});

describe("Unit tests for vocabulary aggregation", () => {
  describe("model.alertSeverities", () => {
    const raw = (path: string, alerts: Record<string, YamlValue>[]): RawRecord => ({
      path,
      raw: "",
      doc: { id: path, observation: { alerts } },
    });

    it("counts each raw value with frequency and affected records", () => {
      const raws = [
        raw("ops/alerts/a", [{ severity: "critical" }]),
        raw("ops/alerts/b", [{ severity: "critical" }, { severity: "info" }]),
      ];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );

      const critical = model.alertSeverities.find((g) => g.key === "critical");
      expect(critical?.count).toBe(2);
      expect(critical?.merged).toBe(false);
      expect(critical?.values).toEqual([
        { value: "critical", count: 2, recordIds: ["ops/alerts/a", "ops/alerts/b"] },
      ]);

      const info = model.alertSeverities.find((g) => g.key === "info");
      expect(info?.count).toBe(1);
      expect(info?.recordIds).toEqual(["ops/alerts/b"]);
    });

    it("groups near-duplicates while retaining both raw values", () => {
      const raws = [
        raw("ops/alerts/a", [{ severity: "warning" }, { severity: "warning" }]),
        raw("ops/alerts/b", [{ severity: "warn" }]),
      ];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );

      const group = model.alertSeverities.find((g) => g.key === "warning");
      expect(group).toBeDefined();
      expect(group!.merged).toBe(true);
      expect(group!.count).toBe(3);
      expect(group!.recordIds).toEqual(["ops/alerts/a", "ops/alerts/b"]);
      expect(group!.values).toEqual([
        { value: "warning", count: 2, recordIds: ["ops/alerts/a"] },
        { value: "warn", count: 1, recordIds: ["ops/alerts/b"] },
      ]);

      expect(model.alertSeverities.some((g) => g.key === "warn")).toBe(false);
    });

    it("keeps distinct meanings separate despite similar short names", () => {
      const raws = [
        raw("ops/alerts/a", [{ severity: "info" }]),
        raw("ops/alerts/b", [{ severity: "page" }]),
      ];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );
      expect(model.alertSeverities.every((g) => !g.merged)).toBe(true);
      expect(model.alertSeverities.map((g) => g.key).sort()).toEqual(["info", "page"]);
    });

    it("groups alerts without severity explicitly", () => {
      const raws = [raw("ops/alerts/a", [{ severity: "critical" }, {}])];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );
      const missing = model.alertSeverities.find((g) => g.key === "");
      expect(missing?.count).toBe(1);
      expect(missing?.recordIds).toEqual(["ops/alerts/a"]);
    });
  });

  describe("model.sloSourceCoverage", () => {
    const raw = (path: string, slos: Record<string, YamlValue>[]): RawRecord => ({
      path,
      raw: "",
      doc: { id: path, observation: { slos } },
    });

    it("separates SLOs with and without sources", () => {
      const raws = [
        raw("ops/slo/d", [{ query_source: "prometheus" }]),
        raw("ops/slo/e", [{ query_source: "prometheus" }, {}]),
        raw("ops/slo/f", [{ query_source: "signoz" }]),
      ];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );

      expect(model.sloSourceCoverage.missing).toEqual({
        count: 1,
        recordIds: ["ops/slo/e"],
      });

      const prometheus = model.sloSourceCoverage.present.find((g) => g.key === "prometheus");
      expect(prometheus?.count).toBe(2);
      expect(prometheus?.recordIds).toEqual(["ops/slo/d", "ops/slo/e"]);

      const signoz = model.sloSourceCoverage.present.find((g) => g.key === "signoz");
      expect(signoz?.count).toBe(1);
      expect(signoz?.recordIds).toEqual(["ops/slo/f"]);
    });

    it("reports no missing sources when all SLOs have one", () => {
      const raws = [raw("ops/slo/d", [{ query_source: "prometheus" }])];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );
      expect(model.sloSourceCoverage.missing).toEqual({ count: 0, recordIds: [] });
    });
  });

  describe("model.retentionSpellings", () => {
    const entity = (path: string, duration: string | undefined): RawRecord => ({
      path,
      raw: "",
      doc: {
        id: path,
        ...(duration === undefined ? {} : { retention: { duration } }),
      },
    });

    it("collects raw spellings with their data entities", () => {
      const raws = [
        entity("data/x/h", "30d"),
        entity("data/x/i", "30d"),
        entity("data/x/g", "P30D"),
        entity("data/x/j", "indefinite"),
      ];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );

      const thirtyDaysLower = model.retentionSpellings.find((g) => g.key === "30d");
      expect(thirtyDaysLower?.count).toBe(2);
      expect(thirtyDaysLower?.recordIds).toEqual(["data/x/h", "data/x/i"]);
      expect(thirtyDaysLower?.merged).toBe(false);

      const indefinite = model.retentionSpellings.find((g) => g.key === "indefinite");
      expect(indefinite?.count).toBe(1);
    });

    it("keeps ISO durations and free-text retention periods separate", () => {
      const raws = [entity("data/x/h", "30d"), entity("data/x/g", "P30D")];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );
      expect(model.retentionSpellings.every((g) => !g.merged)).toBe(true);
      expect(model.retentionSpellings.map((g) => g.key).sort()).toEqual(["30d", "p30d"]);
    });

    it("skips entities without retention information", () => {
      const raws = [entity("data/x/h", "30d"), entity("data/x/k", undefined)];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );
      expect(model.retentionSpellings.reduce((n, g) => n + g.count, 0)).toBe(1);
    });
  });
});

describe("Unit tests for parseEnumConstraint", () => {
  it("recognizes pipe-separated enum constraints", () => {
    expect(parseEnumConstraint("enum: free|pro|enterprise")).toEqual(["free", "pro", "enterprise"]);
  });

  it("recognizes pipe-separated values constraints", () => {
    expect(parseEnumConstraint("values:free|pro|enterprise")).toEqual([
      "free",
      "pro",
      "enterprise",
    ]);
  });

  it("recognizes bracketed values constraints", () => {
    expect(parseEnumConstraint("values:[free, pro, enterprise]")).toEqual([
      "free",
      "pro",
      "enterprise",
    ]);
  });

  it("recognizes CSV and variant prefixes", () => {
    expect(parseEnumConstraint("csv:free,pro,enterprise")).toEqual(["free", "pro", "enterprise"]);
    expect(parseEnumConstraint("variant: free, pro, enterprise")).toEqual([
      "free",
      "pro",
      "enterprise",
    ]);
  });

  it("accepts case variations in prefixes", () => {
    expect(parseEnumConstraint("ENUM: a|b")).toEqual(["a", "b"]);
    expect(parseEnumConstraint("Values: a|b")).toEqual(["a", "b"]);
  });

  it("strips quotes from individual values", () => {
    expect(parseEnumConstraint("values:[\"free\", 'pro']")).toEqual(["free", "pro"]);
  });

  it("rejects free text without a recognized prefix", () => {
    expect(parseEnumConstraint("primary key")).toBeNull();
    expect(parseEnumConstraint("1..200 Zeichen")).toBeNull();
    expect(parseEnumConstraint("UTC, optional")).toBeNull();
    expect(parseEnumConstraint(germanLabels.text136)).toBeNull();
    expect(parseEnumConstraint("")).toBeNull();
  });

  it("rejects prefixes without values", () => {
    expect(parseEnumConstraint("enum:")).toBeNull();
    expect(parseEnumConstraint("values:   ")).toBeNull();
  });
});

describe("Unit tests for model.enumRegister", () => {
  const entityRaw = (
    path: string,
    fields: { name: string; constraints?: string | string[] }[],
  ): RawRecord => ({
    path,
    raw: "",
    doc: {
      id: path,
      canonical_schema: {
        fields: fields.map((f) => ({
          name: f.name,
          type: "string",
          constraints: f.constraints ?? null,
        })),
      },
    },
  });

  it("groups equal value sets across entities without divergence", () => {
    const raws = [
      entityRaw("data/billing/plan-a", [
        { name: "tier", constraints: "enum: free|pro|enterprise" },
      ]),
      entityRaw("data/billing/plan-b", [
        { name: "tier", constraints: "values:[free,pro,enterprise]" },
      ]),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    const entry = model.enumRegister.entries.find((e) => e.field === "tier");
    expect(entry).toBeDefined();
    expect(entry!.divergent).toBe(false);
    expect(entry!.valueSets).toHaveLength(1);
    expect([...entry!.valueSets[0].entities].sort()).toEqual([
      "data/billing/plan-a",
      "data/billing/plan-b",
    ]);
  });

  it("lists every policy", () => {
    const raws = [
      entityRaw("data/billing/plan-a", [
        { name: "tier", constraints: "enum: free|pro|enterprise" },
      ]),
      entityRaw("data/billing/plan-b", [
        { name: "tier", constraints: "enum: free|pro|enterprise|suspended" },
      ]),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    const entry = model.enumRegister.entries.find((e) => e.field === "tier");
    expect(entry).toBeDefined();
    expect(entry!.divergent).toBe(true);
    expect(entry!.valueSets).toHaveLength(2);
    expect(model.enumRegister.divergentFieldCount).toBe(1);
  });

  it("ignores value order within a set", () => {
    const raws = [
      entityRaw("data/billing/plan-a", [
        { name: "tier", constraints: "enum: free|pro|enterprise" },
      ]),
      entityRaw("data/billing/plan-b", [
        { name: "tier", constraints: "enum: enterprise|free|pro" },
      ]),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    const entry = model.enumRegister.entries.find((e) => e.field === "tier");
    expect(entry!.divergent).toBe(false);
    expect(entry!.valueSets).toHaveLength(1);
  });

  it("counts distinct field names in fieldCount", () => {
    const raws = [
      entityRaw("data/billing/plan-a", [{ name: "tier", constraints: "enum: free|pro" }]),
      entityRaw("data/services/status-log", [
        { name: "status", constraints: "enum: active|inactive" },
      ]),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    expect(model.enumRegister.fieldCount).toBe(2);
    expect(model.enumRegister.divergentFieldCount).toBe(0);
  });

  it("ignores constraints that are not enumerations", () => {
    const raws = [
      entityRaw("data/tasks/task-item", [
        { name: "id", constraints: "primary key" },
        { name: "title", constraints: "1..200 Zeichen" },
      ]),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    expect(model.enumRegister.entries).toEqual([]);
    expect(model.enumRegister.fieldCount).toBe(0);
  });

  it("accepts constraints as an array of strings", () => {
    const raws = [
      entityRaw("data/services/subscription", [
        { name: "status", constraints: [localized.text140, "enum: active|past_due"] },
      ]),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    const entry = model.enumRegister.entries.find((e) => e.field === "status");
    expect(entry!.valueSets[0].values).toEqual(["active", "past_due"]);
  });

  it("finds the extra suspended tier against three entities without it", () => {
    const raws = [
      entityRaw("data/billing/plan", [{ name: "tier", constraints: "enum: free|pro|enterprise" }]),
      entityRaw("data/billing/seat", [{ name: "tier", constraints: "enum: free|pro|enterprise" }]),
      entityRaw("data/billing/invoice", [
        { name: "tier", constraints: "enum: free|pro|enterprise" },
      ]),
      entityRaw("data/accounts/account", [
        { name: "tier", constraints: "enum: free|pro|enterprise|suspended" },
      ]),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    const entry = model.enumRegister.entries.find((e) => e.field === "tier")!;
    expect(entry.divergent).toBe(true);
    const consistent = entry.valueSets.find((vs) => vs.entities.length === 3)!;
    const outlier = entry.valueSets.find((vs) => vs.entities.length === 1)!;
    expect(consistent.values).toEqual(["free", "pro", "enterprise"]);
    expect(outlier.values).toEqual(["free", "pro", "enterprise", "suspended"]);
    expect(outlier.entities).toEqual(["data/accounts/account"]);
  });
});
