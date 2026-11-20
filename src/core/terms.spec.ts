import { localized } from "../i18n/legacy/core/terms.spec.text";
import { buildModel } from "./model";
import type { RawRecord } from "./types";
import {
  buildTermIndex,
  MIN_SUBSTANTIAL_CAPABILITY_RECORDS,
  termOwner,
  type TermEntry,
} from "./terms";

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
  feature("wallet/core/one", { team: "Wallet" }),
  feature("wallet/core/two", { team: "Wallet" }),
  feature("wallet/core/three", { team: "Wallet" }),
  feature("wallet/core/four", { team: "Wallet" }),
  feature("wallet/core/five", { team: "Wallet" }),

  feature("wallet/sync/six", { team: "Wallet", relatedEntities: ["data/wallet/account"] }),

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
    it("lists model.domains without deriving them again", () => {
      expect(index.domains.map((d) => d.key).sort()).toEqual(
        model.domains.map((d) => d.name).sort(),
      );
    });

    it("counts records per domain correctly", () => {
      const wallet = index.domains.find((d) => d.key === "wallet")!;
      const billing = index.domains.find((d) => d.key === "billing")!;
      expect(wallet.count).toBe(6);
      expect(billing.count).toBe(1);
    });

    it("uses a shared team or leaves it empty", () => {
      const wallet = index.domains.find((d) => d.key === "wallet")!;
      expect(wallet.owner).toBe("Wallet");
      const billing = index.domains.find((d) => d.key === "billing")!;

      expect(billing.owner).toBe("Billing");
    });

    it("links each domain to its record identifiers", () => {
      const wallet = index.domains.find((d) => d.key === "wallet")!;
      expect(wallet.records).toContain("wallet/core/one");
      expect(wallet.records).toContain("wallet/sync/six");
      expect(wallet.records.length).toBe(6);
    });
  });

  describe("capabilities at or above the threshold", () => {
    it(`${localized.text6}${MIN_SUBSTANTIAL_CAPABILITY_RECORDS} Records auf`, () => {
      expect(index.capabilities.map((c) => c.key)).toEqual(["wallet/core"]);
    });

    it("omits wallet/sync and billing/core below the threshold", () => {
      expect(index.capabilities.find((c) => c.key === "wallet/sync")).toBeUndefined();
      expect(index.capabilities.find((c) => c.key === "billing/core")).toBeUndefined();
    });

    it("counts exactly the capability's records", () => {
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

    it("includes values exactly at the threshold", () => {
      const raws3: RawRecord[] = [feature("x/y/a"), feature("x/y/b"), feature("x/y/c")];
      const model3 = buildModel(
        {},
        raws3.map((r) => r.path),
        raws3,
      );
      const idx3 = buildTermIndex(model3);
      expect(idx3.capabilities.map((c) => c.key)).toEqual(["x/y"]);
    });

    it("keeps two records below the threshold", () => {
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
    it("lists every assumption", () => {
      expect(index.entities.map((e) => e.key).sort()).toEqual(
        ["data/wallet/account", "data/billing/invoice"].sort(),
      );
    });

    it("reads lineage.owner.team when present", () => {
      const account = index.entities.find((e) => e.key === "data/wallet/account")!;
      expect(account.owner).toBe("Wallet");
      const invoice = index.entities.find((e) => e.key === "data/billing/invoice")!;
      expect(invoice.owner).toBe("");
    });

    it("links entities to records with declared usage", () => {
      const account = index.entities.find((e) => e.key === "data/wallet/account")!;

      expect(account.records.sort()).toEqual(["wallet/core/three", "wallet/sync/six"].sort());
      expect(account.count).toBe(2);
    });

    it("counts zero uses for unused entities", () => {
      const invoice = index.entities.find((e) => e.key === "data/billing/invoice")!;
      expect(invoice.count).toBe(0);
      expect(invoice.records).toEqual([]);
    });
  });

  describe("policies", () => {
    it("sorts each list by descending occurrence count, then by identifier", () => {
      expect(index.policies.map((p) => p.key).sort()).toEqual(
        ["policy/wallet/limits", "policy/billing/retention"].sort(),
      );
    });

    it("combines direct and area-wide coverage", () => {
      const limits = index.policies.find((p) => p.key === "policy/wallet/limits")!;

      expect(limits.records).toEqual(["wallet/core/one"]);
      const retention = index.policies.find((p) => p.key === "policy/billing/retention")!;

      expect(retention.records).toEqual(["billing/core/seven"]);
    });
  });

  describe("assumptions", () => {
    it("aggregates by the first path segment in alphabetical order", () => {
      expect(index.assumptions.map((a) => a.key).sort()).toEqual(
        ["assumption/wallet/latency", "assumption/orphan/unused"].sort(),
      );
    });

    it("counts referenced_by as usage", () => {
      const latency = index.assumptions.find((a) => a.key === "assumption/wallet/latency")!;
      expect(latency.records).toEqual(["wallet/core/two"]);
      expect(latency.count).toBe(1);
    });

    it("counts zero uses without referenced_by", () => {
      const orphan = index.assumptions.find((a) => a.key === "assumption/orphan/unused")!;
      expect(orphan.count).toBe(0);
      expect(orphan.records).toEqual([]);
    });
  });

  describe("bidirectional usage through declared edges", () => {
    it("combines assumption references from both directions", () => {
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

    it("combines entity references from both directions", () => {
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

    it("counts records appearing in both directions only once", () => {
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

  describe("Order", () => {
    it("marks different value sets for the same field as divergent", () => {
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
  it("returns the shared team when all records agree", () => {
    const teamRecs = [{ team: "Wallet" } as never, { team: "Wallet" } as never];
    expect(termOwner(teamRecs)).toBe("Wallet");
  });

  it("returns empty for differing teams", () => {
    const teamRecs = [{ team: "Wallet" } as never, { team: "Billing" } as never];
    expect(termOwner(teamRecs)).toBe("");
  });

  it("ignores records without teams when checking agreement", () => {
    const teamRecs = [{ team: "Wallet" } as never, { team: "" } as never];
    expect(termOwner(teamRecs)).toBe("Wallet");
  });

  it("returns empty when no record has a team", () => {
    expect(termOwner([{ team: "" } as never])).toBe("");
    expect(termOwner([])).toBe("");
  });
});
