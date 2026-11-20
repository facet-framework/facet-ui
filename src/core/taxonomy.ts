import { localized } from "../i18n/legacy/core/taxonomy";

import { parseYaml, YamlError } from "./yaml";
import type { YamlValue } from "./yaml";

export type Classification = "core" | "supporting" | "generic";

export type TaxonomyCapability = {
  name: string;
  title: string;
  purpose: string;

  classification: Classification | null;

  inherited: boolean;
};

export type TaxonomyDomain = {
  name: string;
  title: string;
  purpose: string;
  classification: Classification | null;
  ownerTeam: string;
  capabilities: TaxonomyCapability[];
};

export type Taxonomy = {
  schemaVersion: string;
  domains: TaxonomyDomain[];
};

const CLASSIFICATIONS: readonly string[] = ["core", "supporting", "generic"];

function asRecord(value: YamlValue): Record<string, YamlValue> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, YamlValue>)
    : {};
}

function asText(value: YamlValue): string {
  return typeof value === "string" ? value.trim() : "";
}

function asClassification(value: YamlValue): Classification | null {
  const text = asText(value);
  return CLASSIFICATIONS.includes(text) ? (text as Classification) : null;
}

export function parseTaxonomy(text: string | undefined): Taxonomy | null {
  if (!text || !text.trim()) return null;

  let doc: Record<string, YamlValue>;
  try {
    doc = asRecord(parseYaml(text));
  } catch (error) {
    if (!(error instanceof YamlError)) throw error;
    return null;
  }

  const domainsDoc = asRecord(doc.domains);
  const names = Object.keys(domainsDoc);
  if (names.length === 0) return null;

  const domains: TaxonomyDomain[] = names.sort().map((name) => {
    const d = asRecord(domainsDoc[name]);
    const classification = asClassification(d.classification);
    const capsDoc = asRecord(d.capabilities);
    const capabilities: TaxonomyCapability[] = Object.keys(capsDoc)
      .sort()
      .map((capName) => {
        const c = asRecord(capsDoc[capName]);
        const own = asClassification(c.classification);
        return {
          name: capName,
          title: asText(c.title) || capName,
          purpose: asText(c.purpose),

          classification: own ?? classification,
          inherited: own === null && classification !== null,
        };
      });

    return {
      name,
      title: asText(d.title) || name,
      purpose: asText(d.purpose),
      classification,
      ownerTeam: asText(asRecord(d.owner).team),
      capabilities,
    };
  });

  return { schemaVersion: asText(doc.schema_version), domains };
}

export type TaxonomyNode = {
  domain: string;
  capability: string;
  title: string;
  purpose: string;
  classification: Classification | null;

  ids: string[];

  empty: boolean;

  undeclared: boolean;
};

export type TaxonomyBranch = {
  domain: TaxonomyDomain;
  nodes: TaxonomyNode[];
  ids: string[];
};

export function taxonomyTree(taxonomy: Taxonomy | null, ids: string[]): TaxonomyBranch[] {
  if (!taxonomy) return [];

  const byNode: Record<string, string[]> = {};
  ids.forEach((id) => {
    const seg = id.split("/");
    if (seg.length !== 3) return;
    const key = `${seg[0]}/${seg[1]}`;
    (byNode[key] ||= []).push(id);
  });

  const branches: TaxonomyBranch[] = taxonomy.domains.map((domain) => {
    const nodes: TaxonomyNode[] = domain.capabilities.map((cap) => {
      const key = `${domain.name}/${cap.name}`;
      const own = (byNode[key] ?? []).sort();
      delete byNode[key];
      return {
        domain: domain.name,
        capability: cap.name,
        title: cap.title,
        purpose: cap.purpose,
        classification: cap.classification,
        ids: own,
        empty: own.length === 0,
        undeclared: false,
      };
    });
    return { domain, nodes, ids: nodes.flatMap((n) => n.ids) };
  });

  const leftovers = Object.keys(byNode).sort();
  if (leftovers.length > 0) {
    const nodes: TaxonomyNode[] = leftovers.map((key) => {
      const [domain, capability] = key.split("/");
      return {
        domain,
        capability,
        title: capability,
        purpose: "",
        classification: null,
        ids: byNode[key].sort(),
        empty: false,
        undeclared: true,
      };
    });
    branches.push({
      domain: {
        name: "",
        title: localized.text1,
        purpose: localized.text2,
        classification: null,
        ownerTeam: "",
        capabilities: [],
      },
      nodes,
      ids: nodes.flatMap((n) => n.ids),
    });
  }

  return branches;
}
