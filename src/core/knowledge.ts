/**
 * Knowledge coverage per capability counts model data without inference.
 * Only active core features count, matching model.unanchored and model.complete;
 * planned and superseded records are outside this population.
 */
import type { AtlasModel, FacetRecord } from "./types";

/** The five knowledge slots of the FACET schema, in fixed order. */
export const KNOWLEDGE_SLOT_KEYS = [
  "prerequisite_knowledge",
  "not_for",
  "success_signal",
  "common_pitfalls",
  "discoverability",
] as const;

export type KnowledgeSlotKey = (typeof KNOWLEDGE_SLOT_KEYS)[number];

/** The state of a single slot on a single record. */
export type KnowledgeCellState = "answered" | "question" | "missing";

/** Counts of one slot across all records of a capability. */
export type KnowledgeSlotCounts = Record<KnowledgeCellState, number>;

export type CapabilityKnowledge = {
  domain: string;
  capability: string;
  /** The active core features of this capability. */
  records: FacetRecord[];
  /** Records without any `knowledge` block — the actual gap. */
  noKnowledge: FacetRecord[];
  slots: Record<KnowledgeSlotKey, KnowledgeSlotCounts>;
  /** Answered, across all five slots and all records of this capability. */
  answered: number;
  /** Slots in total — `records.length * 5`. */
  total: number;
};

/**
 * Return a record slot's state: missing if absent, answered for a nonempty
 * answer, and question-only otherwise. derive_from instructs derivation from
 * code; it is not itself an answer and must not count as coverage.
 */
export function slotStateFor(record: FacetRecord, key: KnowledgeSlotKey): KnowledgeCellState {
  const slot = record.knowledge.find((s) => s.key === key);
  if (!slot) return "missing";
  return slot.answer ? "answered" : "question";
}

function emptyCounts(): Record<KnowledgeSlotKey, KnowledgeSlotCounts> {
  return Object.fromEntries(
    KNOWLEDGE_SLOT_KEYS.map((key) => [key, { answered: 0, question: 0, missing: 0 }]),
  ) as Record<KnowledgeSlotKey, KnowledgeSlotCounts>;
}

/**
 * Groups the active core features by area and capability and computes the
 * slot counts for each group. A capability without any knowledge stays in the
 * list — with all zeros, not vanished: the zero is the finding, not an empty
 * row one would have filtered out.
 */
export function knowledgeCoverage(model: AtlasModel): CapabilityKnowledge[] {
  const groups = new Map<string, CapabilityKnowledge>();

  model.features
    .filter((record) => record.lifecycle === "active")
    .forEach((record) => {
      const groupKey = `${record.domain}/${record.capability}`;
      let group = groups.get(groupKey);
      if (!group) {
        group = {
          domain: record.domain,
          capability: record.capability,
          records: [],
          noKnowledge: [],
          slots: emptyCounts(),
          answered: 0,
          total: 0,
        };
        groups.set(groupKey, group);
      }

      group.records.push(record);
      if (!record.present.knowledge) group.noKnowledge.push(record);

      KNOWLEDGE_SLOT_KEYS.forEach((slotKey) => {
        const state = slotStateFor(record, slotKey);
        group!.slots[slotKey][state] += 1;
        group!.total += 1;
        if (state === "answered") group!.answered += 1;
      });
    });

  return [...groups.values()].sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    return a.capability.localeCompare(b.capability);
  });
}
