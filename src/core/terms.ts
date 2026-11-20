/**
 * Term index — the derivable domain vocabulary of a corpus, derived solely
 * from record ids and relationships that are already declared.
 *
 * Not a glossary: no field here carries a definition, and none is added. A
 * term without occurrences shows an occurrence count of 0 — that is the honest
 * state, not a gap this file would fill. The naive extraction (capitalised
 * tokens from free text) was tried and rejected: on a real corpus its
 * precision was one third, the rest were sentence starts from Gherkin steps.
 * What is here instead is anchored in identifiers — every term is a record id
 * segment or a relationship already declared in the model:
 *
 * - **Domains** — `model.domains`, taken over unchanged.
 * - **Capabilities** — `domain/capability` (second id segment) across all
 *   core features, filtered to the "substantial" ones (at least
 *   {@link MIN_SUBSTANTIAL_CAPABILITY_RECORDS} records) — otherwise the list
 *   would be 216 lines long and three quarters one-offs.
 * - **Data objects** — every `data/…` entity; its occurrence count is the
 *   union of what the entity itself names as `read_by` / `mutated_by` /
 *   `referenced_by` and every record that declares it via
 *   `lineage.related_data_entities` — both directions are allowed, neither
 *   invents the other.
 * - **Rule sets** — every policy; occurrence is exactly `coverage()` from
 *   `model.ts` (direct or area-wide), no second definition beside it.
 * - **Assumptions** — every assumption; occurrence is the union of its own
 *   `referenced_by` and every record that declares it via
 *   `lineage.related_assumptions`.
 */

import { coverage } from "./model";
import type { AtlasModel, FacetRecord } from "./types";

export type TermCategoryKind = "domain" | "capability" | "entity" | "policy" | "assumption";

export type TermEntry = {
  /** Stable id — domain name, `domain/capability`, or the record id. */
  key: string;
  kind: TermCategoryKind;
  label: string;
  /** = `records.length` — the same number, named twice: as a count and as a list. */
  count: number;
  /** `lineage.owner.team` where unambiguous — otherwise empty, never guessed. */
  owner: string;
  /** Ids of every record that carries or uses this term. */
  records: string[];
};

export type TermIndex = {
  domains: TermEntry[];
  capabilities: TermEntry[];
  entities: TermEntry[];
  policies: TermEntry[];
  assumptions: TermEntry[];
};

/** From how many records on a capability counts as "substantial". */
export const MIN_SUBSTANTIAL_CAPABILITY_RECORDS = 3;

/**
 * The shared team of a group of records — only if there is one. If several
 * records carry different teams, the field stays empty: an invented consensus
 * would be more wrong than no statement. Records without a team do not count
 * against uniformity — they just say nothing.
 */
export function termOwner(records: { team: string }[]): string {
  const teams = new Set(records.map((record) => record.team).filter(Boolean));
  return teams.size === 1 ? [...teams][0] : "";
}

function sortEntries(entries: TermEntry[]): TermEntry[] {
  return [...entries].sort((a, b) =>
    b.count !== a.count ? b.count - a.count : a.key.localeCompare(b.key),
  );
}

function domainEntries(model: AtlasModel): TermEntry[] {
  return sortEntries(
    model.domains.map((domain) => ({
      key: domain.name,
      kind: "domain",
      label: domain.name,
      count: domain.items.length,
      owner: termOwner(domain.items),
      records: domain.items.map((item) => item.id),
    })),
  );
}

function capabilityEntries(model: AtlasModel): TermEntry[] {
  const groups = new Map<string, FacetRecord[]>();
  model.features.forEach((feature) => {
    if (!feature.capability) return;
    const key = `${feature.domain}/${feature.capability}`;
    const list = groups.get(key);
    if (list) list.push(feature);
    else groups.set(key, [feature]);
  });

  const entries: TermEntry[] = [];
  groups.forEach((records, key) => {
    if (records.length < MIN_SUBSTANTIAL_CAPABILITY_RECORDS) return;
    entries.push({
      key,
      kind: "capability",
      label: key,
      count: records.length,
      owner: termOwner(records),
      records: records.map((record) => record.id),
    });
  });
  return sortEntries(entries);
}

/** Unites an entity's self-report with every declared mention from elsewhere. */
function usedByEntity(model: AtlasModel, entity: FacetRecord): string[] {
  const usedBy = new Set<string>([...entity.readBy, ...entity.mutatedBy, ...entity.referencedBy]);
  model.recs.forEach((record) => {
    if (record.id === entity.id) return;
    if (record.relatedEntities.includes(entity.id)) usedBy.add(record.id);
  });
  usedBy.delete(entity.id);
  return [...usedBy].filter(Boolean).sort();
}

function entityEntries(model: AtlasModel): TermEntry[] {
  return sortEntries(
    model.entities.map((entity) => {
      const records = usedByEntity(model, entity);
      return {
        key: entity.id,
        kind: "entity",
        label: entity.label,
        count: records.length,
        owner: entity.team,
        records,
      };
    }),
  );
}

function policyEntries(model: AtlasModel): TermEntry[] {
  return sortEntries(
    model.policies.map((policy) => {
      const records = model.features
        .filter((feature) => coverage(policy, feature) !== null)
        .map((feature) => feature.id)
        .sort();
      return {
        key: policy.id,
        kind: "policy",
        label: policy.label,
        count: records.length,
        owner: policy.team,
        records,
      };
    }),
  );
}

/** Unites an assumption's self-report with every declared mention from elsewhere. */
function usedByAssumption(model: AtlasModel, assumption: FacetRecord): string[] {
  const usedBy = new Set<string>(assumption.referencedBy);
  model.recs.forEach((record) => {
    if (record.id === assumption.id) return;
    if (record.relatedAssumptions.includes(assumption.id)) usedBy.add(record.id);
  });
  usedBy.delete(assumption.id);
  return [...usedBy].filter(Boolean).sort();
}

function assumptionEntries(model: AtlasModel): TermEntry[] {
  return sortEntries(
    model.assumptions.map((assumption) => {
      const records = usedByAssumption(model, assumption);
      return {
        key: assumption.id,
        kind: "assumption",
        label: assumption.label,
        count: records.length,
        owner: assumption.team,
        records,
      };
    }),
  );
}

/** Builds the complete term index — five lists, nothing guessed. */
export function buildTermIndex(model: AtlasModel): TermIndex {
  return {
    domains: domainEntries(model),
    capabilities: capabilityEntries(model),
    entities: entityEntries(model),
    policies: policyEntries(model),
    assumptions: assumptionEntries(model),
  };
}
