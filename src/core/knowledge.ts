import type { AtlasModel, FacetRecord } from "./types";

export const KNOWLEDGE_SLOT_KEYS = [
  "prerequisite_knowledge",
  "not_for",
  "success_signal",
  "common_pitfalls",
  "discoverability",
] as const;

export type KnowledgeSlotKey = (typeof KNOWLEDGE_SLOT_KEYS)[number];

export type KnowledgeCellState = "answered" | "question" | "missing";

export type KnowledgeSlotCounts = Record<KnowledgeCellState, number>;

export type CapabilityKnowledge = {
  domain: string;
  capability: string;

  records: FacetRecord[];

  noKnowledge: FacetRecord[];
  slots: Record<KnowledgeSlotKey, KnowledgeSlotCounts>;

  answered: number;

  total: number;
};

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
