import { buildModel } from "./model";
import type { RawRecord } from "./types";
import { KNOWLEDGE_SLOT_KEYS, knowledgeCoverage, slotStateFor } from "./knowledge";

/**
 * A hand-built set, so every cell can be checked against a known result
 * instead of being guessed against real data — the same approach as in
 * `DomainMatrix.spec.tsx` and `DomainDetail.spec.tsx`.
 *
 * wallet/core/settle   — all five slots answered
 * wallet/core/refund   — two slots answered, `discoverability` only with
 *                        `derive_from` (no answer — counts as "question only")
 * wallet/payouts/export — no `knowledge` block at all (missing entirely)
 * billing/core/invoice — planned, not active: counts nowhere
 */
function knowledgeBlock(
  entries: Record<string, { question?: string; answer?: string; derive_from?: string[] }>,
) {
  return entries;
}

const raw = (
  path: string,
  lifecycle: string,
  knowledge?: Record<string, { question?: string; answer?: string; derive_from?: string[] }>,
): RawRecord => ({
  path,
  raw: "",
  doc: {
    id: path,
    lifecycle,
    ...(knowledge ? { knowledge } : {}),
  },
});

const fullSlots = knowledgeBlock({
  prerequisite_knowledge: { question: "What do you need to know?", answer: "Nothing." },
  not_for: { question: "Not for what?", answer: "Not for partial payments." },
  success_signal: { question: "How do you notice it?", answer: "The balance updates at once." },
  common_pitfalls: { question: "What goes wrong?", answer: "Double execution on retry." },
  discoverability: { question: "Where in the code?", answer: "settle() call in checkout." },
});

const partialSlots = knowledgeBlock({
  prerequisite_knowledge: {
    question: "What do you need to know?",
    answer: "Know the payout limit.",
  },
  not_for: { question: "Not for what?", answer: "Not for advances." },
  discoverability: { question: "Where in the code?", derive_from: ["anchors", "tests"] },
});

const raws = [
  raw("wallet/core/settle", "active", fullSlots),
  raw("wallet/core/refund", "active", partialSlots),
  raw("wallet/payouts/export", "active"),
  raw("billing/core/invoice", "planned", fullSlots),
];

const model = buildModel(
  {},
  raws.map((r) => r.path),
  raws,
);

describe("Unit tests for slotStateFor", () => {
  const settle = model.byId["wallet/core/settle"];
  const refund = model.byId["wallet/core/refund"];
  const missing = model.byId["wallet/payouts/export"];

  it("reports an answered slot", () => {
    expect(slotStateFor(settle, "prerequisite_knowledge")).toBe("answered");
  });

  it("reports a slot with a question but no answer as 'question only'", () => {
    // derive_from requests derivation; it does not supply an answer.
    expect(slotStateFor(refund, "discoverability")).toBe("question");
  });

  it("also reports a `derive_from` slot without its own answer as 'question only', not as answered", () => {
    expect(slotStateFor(refund, "discoverability")).not.toBe("answered");
  });

  it("reports a slot without any entry as missing", () => {
    expect(slotStateFor(refund, "common_pitfalls")).toBe("missing");
  });

  it("reports every slot as missing when the record has no `knowledge` block at all", () => {
    KNOWLEDGE_SLOT_KEYS.forEach((key) => expect(slotStateFor(missing, key)).toBe("missing"));
  });
});

describe("Unit tests for knowledgeCoverage", () => {
  const coverage = knowledgeCoverage(model);

  it("groups by domain and capability, not by individual record", () => {
    const keys = coverage.map((group) => `${group.domain}/${group.capability}`);
    expect(keys).toEqual(["wallet/core", "wallet/payouts"]);
  });

  it("keeps a capability with no knowledge at all in the list — with zeros, not vanished", () => {
    const payouts = coverage.find((group) => group.capability === "payouts");
    expect(payouts).toBeDefined();
    expect(payouts!.answered).toBe(0);
    expect(payouts!.total).toBe(KNOWLEDGE_SLOT_KEYS.length);
    KNOWLEDGE_SLOT_KEYS.forEach((key) => expect(payouts!.slots[key].missing).toBe(1));
    expect(payouts!.noKnowledge).toHaveLength(1);
  });

  it("sums answered and open across both records of a capability", () => {
    const core = coverage.find((group) => group.capability === "core")!;
    // settle: 5 answered. refund: 2 answered, 1 question only, 2 missing.
    expect(core.answered).toBe(7);
    expect(core.total).toBe(2 * KNOWLEDGE_SLOT_KEYS.length);
    expect(core.slots.discoverability).toEqual({ answered: 1, question: 1, missing: 0 });
    expect(core.slots.common_pitfalls).toEqual({ answered: 1, question: 0, missing: 1 });
  });

  it("leaves a planned record out — it has no claim to answered knowledge yet", () => {
    expect(coverage.some((group) => group.domain === "billing")).toBe(false);
  });

  it("the answered slots agree with the model's global count without exceeding it", () => {
    // model.knowAnswered counts over *all* core features, not only the active
    // ones — the sum here (active only) may therefore be smaller or equal, but
    // never larger. `total`, on the other hand, is not a fitting comparison:
    // model.knowSlots counts only entries actually present in the YAML, while
    // `total` here counts through the five canonical slots per record — the
    // missing ones too, because those are exactly what this view is meant to
    // make visible.
    const totalAnswered = coverage.reduce((sum, group) => sum + group.answered, 0);
    expect(totalAnswered).toBeLessThanOrEqual(model.knowAnswered);
  });

  it("`total` of a capability is always records times five — missing slots count too", () => {
    coverage.forEach((group) => {
      expect(group.total).toBe(group.records.length * KNOWLEDGE_SLOT_KEYS.length);
    });
  });

  it("sorts area before capability, alphabetically", () => {
    const raws2 = [
      raw("z/b", "active", fullSlots),
      raw("a/c", "active", fullSlots),
      raw("a/a", "active", fullSlots),
    ];
    const model2 = buildModel(
      {},
      raws2.map((r) => r.path),
      raws2,
    );
    const keys = knowledgeCoverage(model2).map((group) => `${group.domain}/${group.capability}`);
    expect(keys).toEqual(["a/a", "a/c", "z/b"]);
  });
});
