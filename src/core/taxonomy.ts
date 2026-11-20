/**
 * The declared product decomposition (FACET §4.4) — `docs/facets/taxonomy.yaml`.
 *
 * Every ID is `domain/capability/feature`. Up to 1.8 the upper two segments
 * were checked against nothing but the segment grammar: a segment could not
 * be wrong and was therefore never right. Atlas read them accordingly — as
 * whatever happened to stand in the IDs.
 *
 * With a declared taxonomy the order is reversed. The tree is the project's
 * statement about which areas *exist*; the records are what has been written
 * of them. The difference between the two is the actual finding — a declared
 * capability without records is not nothing but a visible hole, and that is
 * exactly why it stands in the tree here.
 *
 * If the file is missing, it is missing. `parseTaxonomy` then returns `null`
 * and not an empty taxonomy: "not declared" and "declared, but empty" are
 * opposite statements, and a view that confuses them claims something about a
 * project without the file that nobody said.
 */

import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import { parseYaml, YamlError } from "./yaml";
import type { YamlValue } from "./yaml";

/** Strategic weight of a node — Evans' core/supporting/generic. */
export type Classification = "core" | "supporting" | "generic";

export type TaxonomyCapability = {
  name: string;
  title: string;
  purpose: string;
  /** Own classification, otherwise the domain's — `null` means undecided. */
  classification: Classification | null;
  /** Whether the classification was inherited from the domain. */
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

/**
 * Reads the taxonomy text. Empty text — i.e. no file — yields `null`.
 *
 * So does broken YAML: the tree is a reading aid, and a reader that does not
 * open because of a file a project does not even need to have has lost every
 * other view along with it. The linter is the place that makes a faulty
 * taxonomy loud, not this one.
 */
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
          // Inherited instead of defaulted: a missing value means "not
          // decided", and a default would write a judgement into every report
          // that nobody made.
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

/** A node of the rendered tree, with the number of records below it. */
export type TaxonomyNode = {
  domain: string;
  capability: string;
  title: string;
  purpose: string;
  classification: Classification | null;
  /** IDs of the records below this node. */
  ids: string[];
  /** Declared, but without a record — the visible hole. */
  empty: boolean;
  /** Used, but not declared — an ID the linter reports as an error. */
  undeclared: boolean;
};

export type TaxonomyBranch = {
  domain: TaxonomyDomain;
  nodes: TaxonomyNode[];
  ids: string[];
};

/**
 * Interlaces the taxonomy with the record IDs that actually exist.
 *
 * Both directions are in the result because each means something different: a
 * declared node without records is work not yet done, a used capability
 * without a declaration is an error. Showing only the first direction would
 * present a registry as all the healthier the more of it is missing.
 */
export function taxonomyTree(
  taxonomy: Taxonomy | null,
  ids: string[],
  text: FacetText = ENGLISH_TEXT,
): TaxonomyBranch[] {
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

  // What is left over is used and not declared. It hangs under a pseudo
  // domain so the tree shows it instead of swallowing it — otherwise the only
  // view in which a wrong ID stands out would be the linter.
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
        title: text.t("core.taxonomy.undeclared"),
        purpose: text.t("core.taxonomy.undeclaredPurpose"),
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
