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
  it("makes file names readable without inventing anything", () => {
    expect(humanize("quick-add")).toBe("Quick add");
    expect(humanize("last_write_wins")).toBe("Last write wins");
    expect(humanize("")).toBe("");
  });

  it("computes shares and guards against zero", () => {
    expect(pct(31, 38)).toBe(82);
    expect(pct(5, 0)).toBe(0);
  });

  it("separates thousands", () => {
    expect(formatNumber(84200)).toBe("84,200");
    expect(formatNumber(1000, "en")).toBe("1,000");
    expect(formatNumber(1000, "de")).toBe("1.000");
  });

  it("derives the record kind from the id", () => {
    expect(recordKindOf("tasks/create/quick-add")).toBe("feature");
    expect(recordKindOf("policy/notifications/quiet-hours")).toBe("policy");
    expect(recordKindOf("assumption/sync/clock-skew")).toBe("assumption");
    expect(recordKindOf("data/tasks/task-item")).toBe("entity");
  });

  it("recognises rendered field paths, also via prefixes", () => {
    expect(isRenderedPath("intent.summary")).toBe(true);
    expect(isRenderedPath("contract.scenarios[].pre_state.count")).toBe(true);
    expect(isRenderedPath("intent.unbekanntes_feld")).toBe(false);
  });

  it("collects field paths with their frequency", () => {
    const out: Record<string, number> = {};
    collectPaths({ intent: { summary: "a" }, tags: ["x", "y"] }, "", out);
    expect(out["intent.summary"]).toBe(1);
    expect(out["tags[]"]).toBe(2);
  });

  it("collapses knowledge slots and test levels into patterns", () => {
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

  // variants carries arbitrary variant names as keys, just as knowledge
  // carries arbitrary slot names: both are collapsed to "*", otherwise every
  // variant name would be its own path that never recurs.
  it("collapses variants keys into one pattern", () => {
    const out: Record<string, number> = {};
    collectPaths(
      { variants: { web: { lifecycle: "active" }, native: { lifecycle: "planned" } } },
      "",
      out,
    );
    expect(out["variants.*.lifecycle"]).toBe(2);
  });

  it("recognises variants, flags, observation.dashboards and observability as rendered", () => {
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
          contract: { scenarios: [{ id: "task-added", statement: "Then it is created" }] },
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

  it("reads backing — a missing block counts as backed", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          contract: {
            scenarios: [
              { id: "no-block" },
              {
                id: "explicit-unbacked",
                backing: {
                  state: "unbacked",
                  reason: "Column is still missing.",
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
      reason: "Column is still missing.",
      unblockedBy: "billing/categories/assign-category",
    });
  });

  it("reads deviation — a missing block claims nothing", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          contract: {
            scenarios: [
              { id: "no-block" },
              {
                id: "full",
                deviation: {
                  reason: "A tenant filter is built and never applied.",
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

    // No block means: nobody has declared this behaviour a defect — not that
    // somebody vouches for it. Hence `null` and not an empty block.
    expect(record.scenarios[0].deviation).toBeNull();
    expect(record.scenarios[1].deviation).toEqual({
      reason: "A tenant filter is built and never applied.",
      confirmedBy: "code-review",
      trackedAs: "#212",
    });
  });

  it("reads deviation also without confirmed_by and with tracked_as: null", () => {
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
                deviation: { reason: "The bar never ends at 100 %.", tracked_as: null },
              },
            ],
          },
        },
      },
      {},
    );

    // Both are missing in the same way: not written down. Inventing a word for
    // this ("unconfirmed", "not tracked") would be a measurement nobody has
    // taken.
    expect(record.scenarios[0].deviation).toEqual({
      reason: "The bar never ends at 100 %.",
      confirmedBy: "",
      trackedAs: "",
    });
  });

  it("reads audience — and a missing field assigns nobody", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          contract: {
            scenarios: [
              { id: "no-field" },
              { id: "for-product", audience: "product" },
              { id: "for-engineering", audience: "engineering" },
            ],
          },
        },
      },
      {},
    );

    // The case the field was built for in the first place: every record ever
    // written omits it. If `null` became `product` here, the registry would
    // claim, in a thousand places, an audience nobody vouches for.
    expect(record.scenarios[0].audience).toBeNull();
    expect(record.scenarios[1].audience).toBe("product");
    expect(record.scenarios[2].audience).toBe("engineering");
  });

  it("accepts no audience the schema does not know", () => {
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

    // A value outside the two is a schema error; `facet lint` reports it.
    // Passing it through here would turn it into a third audience, and the
    // same filter would mean something different in this registry than elsewhere.
    expect(record.scenarios[0].audience).toBeNull();
  });

  it("renders audience — otherwise completeness would list the field as not shown", () => {
    // The reader writes the audience out at depth 3. If the path were missing
    // here, "fields, complete" would report a field as not rendered that sits
    // right next to it.
    expect(isRenderedPath("contract.scenarios[].audience")).toBe(true);
  });

  it("marks unbacked promises", () => {
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

  it("reads the defect register and computes the total and the per-file count", () => {
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
                subject: "fix: the empty list showed a zero row",
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
    // Newest first — the question is what broke most recently.
    expect(record.defects.fixes[0].date).toBe("2026-03-02");
    expect(record.defects.fixes[0].issue).toBe("#42");
    expect(record.defects.lastFix).toBe("2026-03-02");
    // The per-file count is computed, not read: list.ts in both.
    expect(record.defects.byFile).toEqual([
      { path: "src/list.ts", count: 2 },
      { path: "src/page.ts", count: 1 },
    ]);
  });

  it("reads a missing register as “nobody looked”, not as zero", () => {
    const record = shapeRecord({ path: "a.yaml", raw: "", doc: { id: "a/b/c" } }, {});
    expect(record.defects.present).toBe(false);
    expect(record.defects.total).toBe(0);
    expect(record.defects.fixes).toEqual([]);

    // An empty block is the other statement: somebody looked here.
    const looked = shapeRecord(
      { path: "b.yaml", raw: "", doc: { id: "a/b/d", defects: { fixes: [] } } },
      {},
    );
    expect(looked.defects.present).toBe(true);
    expect(looked.defects.total).toBe(0);
  });

  it("skips an entry without a commit — no evidence, no count", () => {
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

  it("copes with an empty document", () => {
    const record = shapeRecord({ path: "leer.yaml", raw: "", doc: {} }, {});
    expect(record.id).toBe("leer.yaml");
    expect(record.lifecycle).toBe("—");
    expect(record.present.intent).toBe(false);
  });

  it("takes anchors from the scan, not from the record", () => {
    const record = shapeRecord(
      { path: "a.yaml", raw: "", doc: { id: "a/b/c" } },
      { anchors: { "a/b/c": [{ path: "src/a.ts", line: 12, role: "primary" }] } },
    );
    expect(record.anchors).toHaveLength(1);
    expect(record.present.anchors).toBe(true);
  });

  // FACET 1.4 `variants` replaces the top-level `lifecycle` for multi-client
  // features with one map per variant; the schema forbids carrying both. A
  // variants record therefore never carries a `lifecycle`.
  describe("variants (FACET 1.4)", () => {
    it("reads variants and leaves lifecycle raw at '—' — no invented aggregate", () => {
      const record = shapeRecord(
        {
          path: "a.yaml",
          raw: "",
          doc: {
            id: "web/auth/login",
            variants: {
              web: { lifecycle: "active" },
              native: { lifecycle: "planned", notes: "not started yet" },
            },
          },
        },
        {},
      );

      expect(record.lifecycle).toBe("—");
      expect(record.variants).toEqual({
        web: { lifecycle: "active", notes: undefined },
        native: { lifecycle: "planned", notes: "not started yet" },
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

    it("falls back to the scalar lifecycle for an ordinary record", () => {
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

  it("reads flags (FACET 1.4) — exposure, orthogonal to the lifecycle", () => {
    const record = shapeRecord(
      {
        path: "a.yaml",
        raw: "",
        doc: {
          id: "a/b/c",
          flags: [
            { key: "new-inbox", system: "launchdarkly", default: false, rollout: "10% internal" },
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

  it("reads observation.dashboards[].url", () => {
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

  it("reads observability (metrics, spans, log events) — a peer of observation", () => {
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

describe("Unit tests for the implementation of a scenario (implementedBy)", () => {
  it("binds an anchor to the scenario its `proves` names", () => {
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

  it("binds an anchor to several scenarios when `proves` names several", () => {
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

  it("leaves a scenario without a fulfilling anchor with an empty list, not undefined", () => {
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

  it("reports `anchorsAdopted: false` as long as no anchor in the whole scan carries `proves`", () => {
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

  it("reports `anchorsAdopted: true` as soon as any anchor in the scan carries `proves` — even in another record", () => {
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

  it("copes without scan anchors — `implementedBy` stays empty, `anchorsAdopted` stays false", () => {
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

describe("Integration tests for buildModel over the demo corpus", () => {
  const model = taskflowModel();

  it("reads all 17 records", () => {
    expect(model.recs).toHaveLength(17);
    expect(
      model.features.length +
        model.policies.length +
        model.assumptions.length +
        model.entities.length,
    ).toBe(17);
  });

  it("groups core features by area", () => {
    expect(model.domains.length).toBeGreaterThan(1);
    expect(model.domains.every((domain) => domain.items.length > 0)).toBe(true);
  });

  it("counts promises and evidence consistently", () => {
    expect(model.scnTotal).toBe(model.allScn.length);
    expect(model.scnProven).toBe(model.allScn.filter((scenario) => scenario.proven).length);
    expect(model.scnProven).toBeLessThanOrEqual(model.scnTotal);
  });

  it("detects overdue reviews against the scan date", () => {
    expect(model.overdue).toBe(model.overdueList.length);
    model.overdueList.forEach((entry) => expect(entry.check.overdue).toBe(true));
  });

  it("finds references without a record as ghosts", () => {
    model.ghosts.forEach((ghost) => expect(model.byId[ghost]).toBeUndefined());
  });

  it("computes depth and degree for every node", () => {
    model.edges.forEach((edge) => {
      expect(model.depth[edge.to]).toBeGreaterThanOrEqual(model.depth[edge.from] + 1);
    });
    expect(model.maxDepth).toBeGreaterThan(0);
  });

  it("keeps every rendered field path verifiable", () => {
    expect(model.fieldPaths.length).toBeGreaterThan(0);
    expect(model.notRendered.every((field) => !field.rendered)).toBe(true);
  });

  it("lists ownership per team", () => {
    Object.values(model.teams).forEach((team) => expect(team.items.length).toBeGreaterThan(0));
  });

  it("returns a single record by its id", () => {
    const record = taskflowRecord("tasks/create/quick-add");
    expect(record.summary).not.toBe("");
    expect(record.adrs.length).toBeGreaterThan(0);
  });

  it("throws when an id does not exist", () => {
    expect(() => taskflowRecord("does/not/exist")).toThrow(/not found/);
  });
});

describe("Unit tests for the three lifecycle filters with variants", () => {
  // Reproduction from the issue: a variants record, active on "web", without
  // an anchor for "web/auth/login". `f.lifecycle === "active"` always excludes
  // such a record, because by the schema it carries no `lifecycle` at all —
  // the three signals below must find it anyway.
  const variantsRaw = (path: string, id: string): RawRecord => ({
    path,
    raw: "",
    doc: {
      id,
      variants: { web: { lifecycle: "active" }, native: { lifecycle: "planned" } },
      intent: { summary: "Signs in through the web interface." },
      contract: { scenarios: [{ id: "login-ok", statement: "Then they are signed in" }] },
      verification: { unit_tests: [{ id: "logs_in", proves: ["login-ok"] }] },
    },
  });

  it("counts an active, unanchored variants record as unanchored", () => {
    const raws = [variantsRaw("a.yaml", "web/auth/login")];
    const model = buildModel({}, [raws[0].path], raws, {});

    expect(model.unanchored.map((f) => f.id)).toContain("web/auth/login");
  });

  it("counts an active, anchored and fully proven variants record as complete", () => {
    const raws = [variantsRaw("a.yaml", "web/auth/login")];
    const model = buildModel({}, [raws[0].path], raws, {
      anchors: { "web/auth/login": [{ path: "src/login.ts", line: 3, role: "primary" }] },
    });

    expect(model.unanchored).toHaveLength(0);
    expect(model.complete.map((f) => f.id)).toContain("web/auth/login");
  });

  it("counts an active variants record without SLOs/alerts as noObs", () => {
    const raws = [variantsRaw("a.yaml", "web/auth/login")];
    const model = buildModel({}, [raws[0].path], raws, {});

    expect(model.noObs.map((f) => f.id)).toContain("web/auth/login");
  });

  it("lets a merely planned variant trigger none of the three signals", () => {
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

/**
 * `decisionTargets` collapses the references from `intent.decision_records`
 * across the whole registry into distinct targets, descending by frequency.
 * Each entry names the records that point at that target.
 */
describe("Unit tests for decisionTargets", () => {
  const raw = (path: string, decisionRecords: string[] = []): RawRecord => ({
    path,
    raw: "",
    doc: { id: path, intent: { decision_records: decisionRecords } },
  });

  // a names ADR-1 and ADR-2, b names only ADR-1, c names ADR-3 and ADR-2, d
  // names nothing. ADR-1 and ADR-2 are thus tied at two mentions — this
  // checks both the frequency branch and the tie branch of the sort.
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

  it("counts each distinct target, not the strings per record", () => {
    expect(model.decisionTargets).toHaveLength(3);
    expect(model.decisionTargets.reduce((sum, entry) => sum + entry.count, 0)).toBe(5);
  });

  it("sorts descending by frequency, by target on a tie", () => {
    expect(model.decisionTargets.map((entry) => entry.target)).toEqual(["ADR-1", "ADR-2", "ADR-3"]);
    expect(model.decisionTargets.map((entry) => entry.count)).toEqual([2, 2, 1]);
  });

  it("names, for each target, the records that reference it", () => {
    const adr1 = model.decisionTargets.find((entry) => entry.target === "ADR-1");
    const adr3 = model.decisionTargets.find((entry) => entry.target === "ADR-3");
    expect(adr1?.recordIds).toEqual(["a", "b"]);
    expect(adr3?.recordIds).toEqual(["c"]);
  });

  it("stays empty when no record names a decision reference", () => {
    const empty = buildModel({}, ["d"], [raw("d")]);
    expect(empty.decisionTargets).toEqual([]);
  });
});

describe("Unit tests for the depth in a cycle", () => {
  // Two records with a mutual `depends_on` form a cycle.
  // Its depth must not grow with the number of loop iterations.
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

  it("does not let the depth grow with the loop count instead of the chain length", () => {
    // Root has no dependency (depth 0); the cycle does not depend on Root but
    // still gets a place — bounded, not the number of nodes or a multiple of it.
    expect(model.maxDepth).toBeLessThanOrEqual(raws.length);
  });

  it("reports the cycle nodes instead of silently computing through them", () => {
    expect(new Set(model.cyclic)).toEqual(new Set(["tasks/a/cycle-one", "tasks/a/cycle-two"]));
    expect(model.cyclic).not.toContain("tasks/a/root");
  });

  it("puts both cycle nodes on the same layer", () => {
    // A cycle has no distinguished entry point — so both nodes get the same
    // depth, instead of inventing an arbitrary order between them.
    expect(model.depth["tasks/a/cycle-one"]).toBe(model.depth["tasks/a/cycle-two"]);
  });
});

describe("Unit tests for mentioned but undeclared ids", () => {
  // Mention an id in prose without declaring lineage, exposing undocumented coupling.
  const raw = (path: string, summary: string, dependsOn: string[] = []): RawRecord => ({
    path,
    raw: "",
    doc: {
      id: path,
      intent: { summary },
      ...(dependsOn.length ? { lineage: { depends_on: dependsOn } } : {}),
    },
  });

  it("finds an id in free text that has no edge", () => {
    const raws = [
      raw("billing/plans/upgrade", "Uses the same session check as identity/access/role-check."),
      raw("identity/access/role-check", "Checks whether the role allows access."),
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

  it("reports nothing when the mention already has a declared edge — in whichever direction", () => {
    const raws = [
      raw("billing/plans/upgrade", "Uses the same session check as identity/access/role-check.", [
        "identity/access/role-check",
      ]),
      raw("identity/access/role-check", "Checks whether the role allows access."),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    expect(model.undeclaredMentions).toEqual([]);
  });

  it("reports nothing when no other id appears in the text", () => {
    const raws = [
      raw("billing/plans/upgrade", "Raises the limit."),
      raw("identity/access/role-check", "Checks the role."),
    ];
    const model = buildModel(
      {},
      raws.map((r) => r.path),
      raws,
    );
    expect(model.undeclaredMentions).toEqual([]);
  });

  it("also reads the Gherkin steps of the scenarios, not just the summary", () => {
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
                statement: "Given identity/access/role-check has agreed\nThen it is upgraded",
              },
            ],
          },
        },
      },
      raw("identity/access/role-check", "Checks the role."),
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

describe("Unit tests for the error code register", () => {
  // One record per field mentioned, so that each of the three locations can be
  // cross-checked on its own: `intent.summary`,
  // `contract.scenarios[].statement`, `knowledge.common_pitfalls`.
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

  it("finds a code in intent.summary", () => {
    const raws = [
      withSummary("api/errors/reject", "Rejects with E2042 when the file name is missing."),
    ];
    const entries = extractErrorCodes(raws.map((r) => shapeRecord(r, {})));
    expect(entries).toEqual([
      {
        code: "E2042",
        band: "E2xxx",
        records: [
          {
            id: "api/errors/reject",
            statement: "Rejects with E2042 when the file name is missing.",
          },
        ],
      },
    ]);
  });

  it("finds a code in contract.scenarios[].statement, also across Gherkin steps", () => {
    const raws = [
      withScenario(
        "storage/errors/open",
        "Given an unreadable file\nThen the store answers with E1010",
      ),
    ];
    const entries = extractErrorCodes(raws.map((r) => shapeRecord(r, {})));
    expect(entries).toHaveLength(1);
    expect(entries[0].code).toBe("E1010");
    expect(entries[0].records[0].id).toBe("storage/errors/open");
    expect(entries[0].records[0].statement).toMatch(/E1010/);
  });

  it("finds a code in knowledge.common_pitfalls, but not in other knowledge slots", () => {
    const raws = [
      withPitfall("catalog/errors/rate-limit", "Easily confuses E4090 with the global limit."),
      {
        path: "catalog/errors/other-slot",
        raw: "",
        doc: {
          id: "catalog/errors/other-slot",
          knowledge: { rollout: { answer: "Concerns E4099, but not as a pitfall." } },
        },
      } satisfies RawRecord,
    ];
    const entries = extractErrorCodes(raws.map((r) => shapeRecord(r, {})));
    expect(entries.map((e) => e.code)).toEqual(["E4090"]);
  });

  it("counts a repeated mention in the same record only once", () => {
    const raws = [withSummary("api/errors/reject", "E2042 occurs when E2042 is returned.")];
    const entries = extractErrorCodes(raws.map((r) => shapeRecord(r, {})));
    expect(entries).toHaveLength(1);
    expect(entries[0].records).toHaveLength(1);
  });

  it("groups by band — leading numeral, rest masked", () => {
    expect(errorCodeBand("E1042")).toBe("E1xxx");
    expect(errorCodeBand("E2999")).toBe("E2xxx");
    expect(errorCodeBand("E9000")).toBe("E9xxx");
  });

  it("accepts a configurable pattern instead of the default pattern", () => {
    const raws = [withSummary("market/errors/checkout", "Answers with W-42 instead of E1042.")];
    const entries = extractErrorCodes(
      raws.map((r) => shapeRecord(r, {})),
      /W-\d{2}/g,
    );
    expect(entries.map((e) => e.code)).toEqual(["W-42"]);
  });

  it("marks a code as a collision as soon as more than one feature id names it", () => {
    const raws = [
      withSummary("api/errors/reject", "Rejects with E2042."),
      withSummary(
        "catalog/errors/import-reject",
        "Reports the same E2042 on import as the file API.",
      ),
    ];
    const entries = extractErrorCodes(raws.map((r) => shapeRecord(r, {})));
    expect(entries).toHaveLength(1);
    expect(entries[0].records.map((r) => r.id).sort()).toEqual([
      "api/errors/reject",
      "catalog/errors/import-reject",
    ]);
  });

  it("builds the register via buildModel — grouped, sorted, with a visible gap", () => {
    const raws = [
      withSummary("api/errors/a", "E2042 occurs."),
      withSummary("api/errors/b", "E2010 occurs as well."),
      withSummary("storage/errors/a", "E1010 occurs."),
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
    // E2000-E2009 are free before E2010 starts taking numbers.
    expect(e2xxx.nextFree).toBe("E2000");

    expect(model.errorCodeRegister.collisions).toEqual([]);
  });

  it("reports no free number once a band is full", () => {
    // A two-place pattern whose leading numeral stays 0 (X-00 … X-09): the
    // whole band can be filled completely with ten records, without having to
    // rebuild a four-place range.
    const digits = Array.from({ length: 10 }, (_, n) => n);
    const raws = digits.map((n) =>
      withSummary(`market/errors/x${n}`, `Answers with X-${String(n).padStart(2, "0")}.`),
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

  it("finds the smallest free number, even when a gap sits in the middle", () => {
    const raws = [
      withSummary("market/errors/a", "Answers with X-01."),
      withSummary("market/errors/b", "Answers with X-03."),
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
  // Three recurring, project-defined vocabularies that lie outside
  // `canonical_schema` and are therefore not covered by its ENUM check: alert
  // severities, SLO sources, retention periods.

  describe("model.alertSeverities", () => {
    const raw = (path: string, alerts: Record<string, YamlValue>[]): RawRecord => ({
      path,
      raw: "",
      doc: { id: path, observation: { alerts } },
    });

    it("counts each raw value on its own, with frequency and affected records", () => {
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

    it("collapses near-duplicates (`warn`/`warning`) into one group but keeps both raw values", () => {
      const raws = [
        raw("ops/alerts/a", [{ severity: "warning" }, { severity: "warning" }]),
        raw("ops/alerts/b", [{ severity: "warn" }]),
      ];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );

      // The most frequent raw value determines the group key.
      const group = model.alertSeverities.find((g) => g.key === "warning");
      expect(group).toBeDefined();
      expect(group!.merged).toBe(true);
      expect(group!.count).toBe(3);
      expect(group!.recordIds).toEqual(["ops/alerts/a", "ops/alerts/b"]);
      expect(group!.values).toEqual([
        { value: "warning", count: 2, recordIds: ["ops/alerts/a"] },
        { value: "warn", count: 1, recordIds: ["ops/alerts/b"] },
      ]);
      // No second, separate entry for "warn".
      expect(model.alertSeverities.some((g) => g.key === "warn")).toBe(false);
    });

    it("keeps real differences apart, even when they are short and sound similar", () => {
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

    it("records alerts without a severity as their own group instead of hiding them", () => {
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

    it("separates SLOs with a source from SLOs without one", () => {
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

    it("reports no missing source when every SLO carries one", () => {
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

    it("collects every raw spelling with its data entities", () => {
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

    it("keeps ISO-8601 and free-text spellings of the same period apart instead of guessing", () => {
      // `30d` and `P30D` mean the same, but are not near-duplicates in the
      // sense of the prefix heuristic (neither value is a prefix of the other)
      // — Atlas guesses nothing, it only shows what is written.
      const raws = [entity("data/x/h", "30d"), entity("data/x/g", "P30D")];
      const model = buildModel(
        {},
        raws.map((r) => r.path),
        raws,
      );
      expect(model.retentionSpellings.every((g) => !g.merged)).toBe(true);
      expect(model.retentionSpellings.map((g) => g.key).sort()).toEqual(["30d", "p30d"]);
    });

    it("skips data entities without any retention statement", () => {
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
  it("recognises `enum: a|b|c`", () => {
    expect(parseEnumConstraint("enum: free|pro|enterprise")).toEqual(["free", "pro", "enterprise"]);
  });

  it("recognises `values:a|b|c`", () => {
    expect(parseEnumConstraint("values:free|pro|enterprise")).toEqual([
      "free",
      "pro",
      "enterprise",
    ]);
  });

  it("recognises `values:[a,b,c]`", () => {
    expect(parseEnumConstraint("values:[free, pro, enterprise]")).toEqual([
      "free",
      "pro",
      "enterprise",
    ]);
  });

  it("recognises the `csv:` and `variant:` prefix variants", () => {
    expect(parseEnumConstraint("csv:free,pro,enterprise")).toEqual(["free", "pro", "enterprise"]);
    expect(parseEnumConstraint("variant: free, pro, enterprise")).toEqual([
      "free",
      "pro",
      "enterprise",
    ]);
  });

  it("is case-tolerant for the prefix", () => {
    expect(parseEnumConstraint("ENUM: a|b")).toEqual(["a", "b"]);
    expect(parseEnumConstraint("Values: a|b")).toEqual(["a", "b"]);
  });

  it("strips quotes around single values", () => {
    expect(parseEnumConstraint("values:[\"free\", 'pro']")).toEqual(["free", "pro"]);
  });

  it("rejects free text without one of the four prefixes, even with a comma or pipe in it", () => {
    expect(parseEnumConstraint("primary key")).toBeNull();
    expect(parseEnumConstraint("1..200 characters")).toBeNull();
    expect(parseEnumConstraint("UTC, optional")).toBeNull();
    expect(parseEnumConstraint("user_id to role")).toBeNull();
    expect(parseEnumConstraint("")).toBeNull();
  });

  it("rejects a prefix with no values after it", () => {
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

  it("groups the same value set across several entities into one entry, without divergence", () => {
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

  it("marks different value sets of the same field name as divergence", () => {
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

  it("is insensitive to the order of values within a value set", () => {
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

  it("counts fieldCount as the number of distinct field names", () => {
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

  it("ignores constraints that are not enum-shaped", () => {
    const raws = [
      entityRaw("data/tasks/task-item", [
        { name: "id", constraints: "primary key" },
        { name: "title", constraints: "1..200 characters" },
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

  it("tolerates `constraints` as an array of strings", () => {
    const raws = [
      entityRaw("data/services/subscription", [
        { name: "status", constraints: ["free text without meaning", "enum: active|past_due"] },
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

  it("finds the divergence: `tier` with `suspended` against three entities without it", () => {
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
