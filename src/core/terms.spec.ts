import { buildModel } from "./model";
import type { RawRecord } from "./types";
import {
  buildTermIndex,
  MIN_SUBSTANTIAL_CAPABILITY_RECORDS,
  termOwner,
  type TermEntry,
} from "./terms";

/**
 * A hand-wired inventory, large enough to check each of the five lists
 * against a hand-computed result — real data would only run the same
 * computation a second time, not cross-check it.
 *
 * Domains: wallet (3 records, 2 capabilities), billing (1 record)
 * Capabilities: wallet/core (2 records — below the threshold),
 *               wallet/sync (1 record — below the threshold),
 *               billing/core (1 record — below the threshold)
 * To get one capability *above* the threshold, three more
 * wallet/core records are added (5 in total) — only this group should appear.
 */
const feature = (
  id: string,
  opts: { team?: string; dependsOn?: string[]; relatedEntities?: string[] } = {},
): RawRecord => ({
  path: id,
  raw: "",
  doc: {
    id,
    lifecycle: "active",
    ...(opts.team ? { lineage: { owner: { team: opts.team }, ...ownerExtras(opts) } } : {}),
  },
});

function ownerExtras(opts: { dependsOn?: string[]; relatedEntities?: string[] }) {
  const out: Record<string, unknown> = {};
  if (opts.dependsOn) out.depends_on = opts.dependsOn;
  if (opts.relatedEntities) out.related_data_entities = opts.relatedEntities;
  return out;
}

const policy = (
  id: string,
  opts: { team?: string; scopeFeatures?: string[]; scopeDomains?: string[] } = {},
): RawRecord => ({
  path: id,
  raw: "",
  doc: {
    id,
    ...(opts.team ? { lineage: { owner: { team: opts.team } } } : {}),
    ...(opts.scopeFeatures || opts.scopeDomains
      ? { scope: { features: opts.scopeFeatures ?? [], domains: opts.scopeDomains ?? [] } }
      : {}),
  },
});

const assumption = (
  id: string,
  opts: { team?: string; referencedBy?: string[] } = {},
): RawRecord => ({
  path: id,
  raw: "",
  doc: {
    id,
    ...(opts.team ? { lineage: { owner: { team: opts.team } } } : {}),
    ...(opts.referencedBy ? { referenced_by: opts.referencedBy } : {}),
  },
});

const entity = (
  id: string,
  opts: { team?: string; readBy?: string[]; mutatedBy?: string[] } = {},
): RawRecord => ({
  path: id,
  raw: "",
  doc: {
    id,
    ...(opts.team ? { lineage: { owner: { team: opts.team } } } : {}),
    ...(opts.readBy ? { read_by: opts.readBy } : {}),
    ...(opts.mutatedBy ? { mutated_by: opts.mutatedBy } : {}),
  },
});

const raws: RawRecord[] = [
  // wallet/core — 5 records, all team "Wallet": above the threshold.
  feature("wallet/core/one", { team: "Wallet" }),
  feature("wallet/core/two", { team: "Wallet" }),
  feature("wallet/core/three", { team: "Wallet" }),
  feature("wallet/core/four", { team: "Wallet" }),
  feature("wallet/core/five", { team: "Wallet" }),
  // wallet/sync — 1 record, below the threshold.
  feature("wallet/sync/six", { team: "Wallet", relatedEntities: ["data/wallet/account"] }),
  // billing/core — 1 record, a different team, below the threshold.
  feature("billing/core/seven", { team: "Billing" }),

  policy("policy/wallet/limits", {
    team: "Wallet",
    scopeFeatures: ["wallet/core/one"],
  }),
  policy("policy/billing/retention", { scopeDomains: ["billing"] }),

  assumption("assumption/wallet/latency", {
    team: "Wallet",
    referencedBy: ["wallet/core/two"],
  }),
  assumption("assumption/orphan/unused", { team: "Ops" }),

  entity("data/wallet/account", { team: "Wallet", mutatedBy: ["wallet/core/three"] }),
  entity("data/billing/invoice", {}),
];

const model = buildModel(
  {},
  raws.map((r) => r.path),
  raws,
);
const index = buildTermIndex(model);

describe("Unit tests for buildTermIndex", () => {
  describe("domains", () => {
    it("lists every domain from model.domains without deriving anything anew", () => {
      expect(index.domains.map((d) => d.key).sort()).toEqual(
        model.domains.map((d) => d.name).sort(),
      );
    });

    it("counts the records per domain correctly", () => {
      const wallet = index.domains.find((d) => d.key === "wallet")!;
      const billing = index.domains.find((d) => d.key === "billing")!;
      expect(wallet.count).toBe(6);
      expect(billing.count).toBe(1);
    });

    it("fills in a uniform team, otherwise empty", () => {
      const wallet = index.domains.find((d) => d.key === "wallet")!;
      expect(wallet.owner).toBe("Wallet");
      const billing = index.domains.find((d) => d.key === "billing")!;
      // billing/core/seven is the only billing feature — one team is enough.
      expect(billing.owner).toBe("Billing");
    });

    it("links every domain to its record ids", () => {
      const wallet = index.domains.find((d) => d.key === "wallet")!;
      expect(wallet.records).toContain("wallet/core/one");
      expect(wallet.records).toContain("wallet/sync/six");
      expect(wallet.records.length).toBe(6);
    });
  });

  describe("capabilities — only from the threshold up", () => {
    it(`includes only capabilities with at least ${MIN_SUBSTANTIAL_CAPABILITY_RECORDS} records`, () => {
      expect(index.capabilities.map((c) => c.key)).toEqual(["wallet/core"]);
    });

    it("leaves out wallet/sync and billing/core below the threshold", () => {
      expect(index.capabilities.find((c) => c.key === "wallet/sync")).toBeUndefined();
      expect(index.capabilities.find((c) => c.key === "billing/core")).toBeUndefined();
    });

    it("counts exactly the records of the capability", () => {
      const walletCore = index.capabilities.find((c) => c.key === "wallet/core")!;
      expect(walletCore.count).toBe(5);
      expect(walletCore.records.sort()).toEqual(
        [
          "wallet/core/one",
          "wallet/core/two",
          "wallet/core/three",
          "wallet/core/four",
          "wallet/core/five",
        ].sort(),
      );
    });

    it("is still included exactly at the threshold (>=, not just >)", () => {
      const raws3: RawRecord[] = [feature("x/y/a"), feature("x/y/b"), feature("x/y/c")];
      const model3 = buildModel(
        {},
        raws3.map((r) => r.path),
        raws3,
      );
      const idx3 = buildTermIndex(model3);
      expect(idx3.capabilities.map((c) => c.key)).toEqual(["x/y"]);
    });

    it("leaves out two records below the threshold", () => {
      const raws2: RawRecord[] = [feature("x/y/a"), feature("x/y/b")];
      const model2 = buildModel(
        {},
        raws2.map((r) => r.path),
        raws2,
      );
      const idx2 = buildTermIndex(model2);
      expect(idx2.capabilities).toEqual([]);
    });
  });

  describe("entities", () => {
    it("lists every data entity", () => {
      expect(index.entities.map((e) => e.key).sort()).toEqual(
        ["data/wallet/account", "data/billing/invoice"].sort(),
      );
    });

    it("fills in lineage.owner.team where present", () => {
      const account = index.entities.find((e) => e.key === "data/wallet/account")!;
      expect(account.owner).toBe("Wallet");
      const invoice = index.entities.find((e) => e.key === "data/billing/invoice")!;
      expect(invoice.owner).toBe("");
    });

    it("links an entity to every record that declares it uses it", () => {
      const account = index.entities.find((e) => e.key === "data/wallet/account")!;
      // wallet/sync/six declares related_data_entities, wallet/core/three is
      // in the entity's own mutated_by — both directions count.
      expect(account.records.sort()).toEqual(["wallet/core/three", "wallet/sync/six"].sort());
      expect(account.count).toBe(2);
    });

    it("an entity with no use at all has occurrence count 0, not an invented one", () => {
      const invoice = index.entities.find((e) => e.key === "data/billing/invoice")!;
      expect(invoice.count).toBe(0);
      expect(invoice.records).toEqual([]);
    });
  });

  describe("policies", () => {
    it("lists every policy", () => {
      expect(index.policies.map((p) => p.key).sort()).toEqual(
        ["policy/wallet/limits", "policy/billing/retention"].sort(),
      );
    });

    it("adds direct and area-wide coverage together (coverage())", () => {
      const limits = index.policies.find((p) => p.key === "policy/wallet/limits")!;
      // direct: scope.features contains wallet/core/one.
      expect(limits.records).toEqual(["wallet/core/one"]);
      const retention = index.policies.find((p) => p.key === "policy/billing/retention")!;
      // area-wide: scope.domains contains billing — covers billing/core/seven.
      expect(retention.records).toEqual(["billing/core/seven"]);
    });
  });

  describe("assumptions", () => {
    it("lists every assumption", () => {
      expect(index.assumptions.map((a) => a.key).sort()).toEqual(
        ["assumption/wallet/latency", "assumption/orphan/unused"].sort(),
      );
    });

    it("reads referenced_by as occurrences", () => {
      const latency = index.assumptions.find((a) => a.key === "assumption/wallet/latency")!;
      expect(latency.records).toEqual(["wallet/core/two"]);
      expect(latency.count).toBe(1);
    });

    it("an assumption without referenced_by has occurrence count 0", () => {
      const orphan = index.assumptions.find((a) => a.key === "assumption/orphan/unused")!;
      expect(orphan.count).toBe(0);
      expect(orphan.records).toEqual([]);
    });
  });

  describe("use in both directions (declared edges, none invented)", () => {
    it("adds referenced_by on the assumption and lineage.related_assumptions on the record together", () => {
      const raws4: RawRecord[] = [
        assumption("assumption/x/shared", { referencedBy: ["feat/a/one"] }),
        feature("feat/a/one"),
        {
          path: "feat/a/two",
          raw: "",
          doc: { id: "feat/a/two", lineage: { related_assumptions: ["assumption/x/shared"] } },
        },
      ];
      const model4 = buildModel(
        {},
        raws4.map((r) => r.path),
        raws4,
      );
      const idx4 = buildTermIndex(model4);
      const shared = idx4.assumptions.find((a) => a.key === "assumption/x/shared")!;
      expect(shared.records).toEqual(["feat/a/one", "feat/a/two"]);
      expect(shared.count).toBe(2);
    });

    it("adds read_by/mutated_by on the entity and lineage.related_data_entities on the record together", () => {
      const raws5: RawRecord[] = [
        entity("data/x/thing", { readBy: ["feat/a/one"] }),
        feature("feat/a/one"),
        {
          path: "feat/a/two",
          raw: "",
          doc: { id: "feat/a/two", lineage: { related_data_entities: ["data/x/thing"] } },
        },
      ];
      const model5 = buildModel(
        {},
        raws5.map((r) => r.path),
        raws5,
      );
      const idx5 = buildTermIndex(model5);
      const thing = idx5.entities.find((e) => e.key === "data/x/thing")!;
      expect(thing.records).toEqual(["feat/a/one", "feat/a/two"]);
      expect(thing.count).toBe(2);
    });

    it("counts a record only once when it appears on both paths", () => {
      const raws6: RawRecord[] = [
        entity("data/x/thing2", { readBy: ["feat/a/one"] }),
        {
          path: "feat/a/one",
          raw: "",
          doc: { id: "feat/a/one", lineage: { related_data_entities: ["data/x/thing2"] } },
        },
      ];
      const model6 = buildModel(
        {},
        raws6.map((r) => r.path),
        raws6,
      );
      const idx6 = buildTermIndex(model6);
      const thing = idx6.entities.find((e) => e.key === "data/x/thing2")!;
      expect(thing.records).toEqual(["feat/a/one"]);
      expect(thing.count).toBe(1);
    });
  });

  describe("order", () => {
    it("sorts every list by occurrence count descending, then by id", () => {
      const lists: TermEntry[][] = [
        index.domains,
        index.capabilities,
        index.entities,
        index.policies,
        index.assumptions,
      ];
      lists.forEach((list) => {
        for (let i = 1; i < list.length; i += 1) {
          const prev = list[i - 1];
          const cur = list[i];
          expect(prev.count > cur.count || (prev.count === cur.count && prev.key <= cur.key)).toBe(
            true,
          );
        }
      });
    });
  });
});

describe("Unit tests for termOwner", () => {
  it("returns the shared team when every record carries the same one", () => {
    const teamRecs = [{ team: "Wallet" } as never, { team: "Wallet" } as never];
    expect(termOwner(teamRecs)).toBe("Wallet");
  });

  it("returns empty when teams diverge — no invented consensus", () => {
    const teamRecs = [{ team: "Wallet" } as never, { team: "Billing" } as never];
    expect(termOwner(teamRecs)).toBe("");
  });

  it("ignores records without a team in the uniformity check", () => {
    const teamRecs = [{ team: "Wallet" } as never, { team: "" } as never];
    expect(termOwner(teamRecs)).toBe("Wallet");
  });

  it("returns empty when no record carries a team", () => {
    expect(termOwner([{ team: "" } as never])).toBe("");
    expect(termOwner([])).toBe("");
  });
});
