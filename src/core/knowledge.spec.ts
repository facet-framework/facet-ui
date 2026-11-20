import { remainingText } from "../i18n/legacy/remaining";
import { germanText as germanLabels } from "../i18n/legacy/shared";
import { localized } from "../i18n/legacy/core/knowledge.spec.text";
import { buildModel } from "./model";
import type { RawRecord } from "./types";
import { KNOWLEDGE_SLOT_KEYS, knowledgeCoverage, slotStateFor } from "./knowledge";

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
  prerequisite_knowledge: { question: remainingText.text25, answer: "Nichts." },
  not_for: { question: localized.text1, answer: localized.text2 },
  success_signal: { question: "Woran erkennbar?", answer: remainingText.text26 },
  common_pitfalls: { question: remainingText.text27, answer: localized.text3 },
  discoverability: { question: germanLabels.text124, answer: germanLabels.text125 },
});

const partialSlots = knowledgeBlock({
  prerequisite_knowledge: { question: remainingText.text25, answer: "Auszahlungslimit kennen." },
  not_for: { question: localized.text4, answer: localized.text5 },
  discoverability: { question: germanLabels.text124, derive_from: ["anchors", "tests"] },
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

  it("reports a question without an answer as question-only", () => {
    expect(slotStateFor(refund, "discoverability")).toBe("question");
  });

  it("reports derive_from without a local answer as question-only", () => {
    expect(slotStateFor(refund, "discoverability")).not.toBe("answered");
  });

  it("reports empty slots as missing", () => {
    expect(slotStateFor(refund, "common_pitfalls")).toBe("missing");
  });

  it("reports all slots as missing without a knowledge block", () => {
    KNOWLEDGE_SLOT_KEYS.forEach((key) => expect(slotStateFor(missing, key)).toBe("missing"));
  });
});

describe("Unit tests for knowledgeCoverage", () => {
  const coverage = knowledgeCoverage(model);

  it("groups by area and capability rather than individual records", () => {
    const keys = coverage.map((group) => `${group.domain}/${group.capability}`);
    expect(keys).toEqual(["wallet/core", "wallet/payouts"]);
  });

  it("keeps capabilities without knowledge visible with zero counts", () => {
    const payouts = coverage.find((group) => group.capability === "payouts");
    expect(payouts).toBeDefined();
    expect(payouts!.answered).toBe(0);
    expect(payouts!.total).toBe(KNOWLEDGE_SLOT_KEYS.length);
    KNOWLEDGE_SLOT_KEYS.forEach((key) => expect(payouts!.slots[key].missing).toBe(1));
    expect(payouts!.noKnowledge).toHaveLength(1);
  });

  it("combines answered and open counts across a capability's records", () => {
    const core = coverage.find((group) => group.capability === "core")!;

    expect(core.answered).toBe(7);
    expect(core.total).toBe(2 * KNOWLEDGE_SLOT_KEYS.length);
    expect(core.slots.discoverability).toEqual({ answered: 1, question: 1, missing: 0 });
    expect(core.slots.common_pitfalls).toEqual({ answered: 1, question: 0, missing: 1 });
  });

  it("excludes planned records from answered-knowledge requirements", () => {
    expect(coverage.some((group) => group.domain === "billing")).toBe(false);
  });

  it("matches the model's global answered count without exceeding it", () => {
    const totalAnswered = coverage.reduce((sum, group) => sum + group.answered, 0);
    expect(totalAnswered).toBeLessThanOrEqual(model.knowAnswered);
  });

  it("counts five slots per record including missing slots", () => {
    coverage.forEach((group) => {
      expect(group.total).toBe(group.records.length * KNOWLEDGE_SLOT_KEYS.length);
    });
  });

  it("sorts areas before capabilities alphabetically", () => {
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
