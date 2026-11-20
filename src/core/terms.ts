import { coverage } from "./model";
import type { AtlasModel, FacetRecord } from "./types";

export type TermCategoryKind = "domain" | "capability" | "entity" | "policy" | "assumption";

export type TermEntry = {
  key: string;
  kind: TermCategoryKind;
  label: string;

  count: number;

  owner: string;

  records: string[];
};

export type TermIndex = {
  domains: TermEntry[];
  capabilities: TermEntry[];
  entities: TermEntry[];
  policies: TermEntry[];
  assumptions: TermEntry[];
};

export const MIN_SUBSTANTIAL_CAPABILITY_RECORDS = 3;

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

export function buildTermIndex(model: AtlasModel): TermIndex {
  return {
    domains: domainEntries(model),
    capabilities: capabilityEntries(model),
    entities: entityEntries(model),
    policies: policyEntries(model),
    assumptions: assumptionEntries(model),
  };
}
