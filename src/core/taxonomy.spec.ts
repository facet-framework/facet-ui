import { parseTaxonomy, taxonomyTree } from "./taxonomy";

const DOC = `schema_version: "1.8"
domains:
  registry:
    title: Registry
    purpose: Holding records and keeping them honest.
    classification: core
    owner:
      team: facet
    capabilities:
      integrity:
        title: Integrity checks
        purpose: What must be true for a build to pass.
      layout:
        title: Layout and scope
        classification: supporting
  delivery:
    title: Delivery
    capabilities:
      ci:
        title: Continuous integration
`;

describe("parseTaxonomy", () => {
  it("reads domains and capabilities alphabetically", () => {
    const tax = parseTaxonomy(DOC)!;
    expect(tax.schemaVersion).toBe("1.8");
    expect(tax.domains.map((d) => d.name)).toEqual(["delivery", "registry"]);
    expect(tax.domains[1].capabilities.map((c) => c.name)).toEqual(["integrity", "layout"]);
    expect(tax.domains[1].ownerTeam).toBe("facet");
  });

  it("inherits domain classification when the capability has none", () => {
    const registry = parseTaxonomy(DOC)!.domains[1];
    const integrity = registry.capabilities[0];
    const layout = registry.capabilities[1];

    expect(integrity.classification).toBe("core");
    expect(integrity.inherited).toBe(true);
    expect(layout.classification).toBe("supporting");
    expect(layout.inherited).toBe(false);
  });

  it("leaves unclassified domains undecided", () => {
    const delivery = parseTaxonomy(DOC)!.domains[0];
    expect(delivery.classification).toBeNull();
    expect(delivery.capabilities[0].classification).toBeNull();
    expect(delivery.capabilities[0].inherited).toBe(false);
  });

  it("returns null without a taxonomy", () => {
    expect(parseTaxonomy(undefined)).toBeNull();
    expect(parseTaxonomy("")).toBeNull();
    expect(parseTaxonomy("   \n")).toBeNull();
    expect(parseTaxonomy('schema_version: "1.8"\ndomains: {}\n')).toBeNull();
  });

  it("handles invalid YAML without blocking the reader", () => {
    expect(parseTaxonomy("domains:\n  - [unclosed\n")).toBeNull();
  });

  it("ignores unknown classifications", () => {
    const tax = parseTaxonomy(
      'schema_version: "1.8"\ndomains:\n  a:\n    title: A\n    classification: critical\n    capabilities:\n      b:\n        title: B\n',
    )!;
    expect(tax.domains[0].classification).toBeNull();
  });
});

describe("taxonomyTree", () => {
  const tax = parseTaxonomy(DOC);

  it("places each identifier under its node", () => {
    const tree = taxonomyTree(tax, [
      "registry/integrity/record-validation",
      "registry/integrity/backing-gaps",
      "delivery/ci/runner-lifecycle",
    ]);
    const integrity = tree.find((b) => b.domain.name === "registry")!.nodes[0];
    expect(integrity.ids).toEqual([
      "registry/integrity/backing-gaps",
      "registry/integrity/record-validation",
    ]);
    expect(integrity.empty).toBe(false);
  });

  it("keeps declared nodes without records visible as gaps", () => {
    const tree = taxonomyTree(tax, ["registry/integrity/record-validation"]);
    const registry = tree.find((b) => b.domain.name === "registry")!;
    expect(registry.nodes.map((n) => [n.capability, n.empty])).toEqual([
      ["integrity", false],
      ["layout", true],
    ]);
  });

  it("shows undeclared identifiers separately", () => {
    const tree = taxonomyTree(tax, ["infra/cicd/facet-lsp"]);
    const leftovers = tree[tree.length - 1];
    expect(leftovers.domain.name).toBe("");
    expect(leftovers.nodes[0].undeclared).toBe(true);
    expect(leftovers.nodes[0].ids).toEqual(["infra/cicd/facet-lsp"]);
  });

  it("stays empty without a declared taxonomy", () => {
    expect(taxonomyTree(null, ["a/b/c"])).toEqual([]);
  });

  it("ignores identifiers without three segments", () => {
    const tree = taxonomyTree(tax, ["nonsense"]);
    expect(tree.every((b) => b.ids.length === 0)).toBe(true);
  });
});
