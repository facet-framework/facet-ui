import { createText } from "../facet/i18n/text";
import { parseTaxonomy, taxonomyTree } from "./taxonomy";

const germanText = createText("de");

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

  it("passes the domain's classification on to a capability without its own", () => {
    const registry = parseTaxonomy(DOC)!.domains[1];
    const integrity = registry.capabilities[0];
    const layout = registry.capabilities[1];

    expect(integrity.classification).toBe("core");
    expect(integrity.inherited).toBe(true);
    expect(layout.classification).toBe("supporting");
    expect(layout.inherited).toBe(false);
  });

  // Missing means undecided, not "supporting" — a default would write a
  // verdict into every report that nobody made.
  it("leaves an unclassified domain undecided", () => {
    const delivery = parseTaxonomy(DOC)!.domains[0];
    expect(delivery.classification).toBeNull();
    expect(delivery.capabilities[0].classification).toBeNull();
    expect(delivery.capabilities[0].inherited).toBe(false);
  });

  // "Not declared" and "declared but empty" are opposite statements.
  it("returns null when there is no taxonomy", () => {
    expect(parseTaxonomy(undefined)).toBeNull();
    expect(parseTaxonomy("")).toBeNull();
    expect(parseTaxonomy("   \n")).toBeNull();
    expect(parseTaxonomy('schema_version: "1.8"\ndomains: {}\n')).toBeNull();
  });

  // The linter makes a broken taxonomy loud. A reader that fails to open
  // because of it has lost every other view along with it.
  it("swallows broken YAML instead of blocking the reader", () => {
    expect(parseTaxonomy("domains:\n  - [unclosed\n")).toBeNull();
  });

  it("ignores an unknown classification", () => {
    const tax = parseTaxonomy(
      'schema_version: "1.8"\ndomains:\n  a:\n    title: A\n    classification: critical\n    capabilities:\n      b:\n        title: B\n',
    )!;
    expect(tax.domains[0].classification).toBeNull();
  });
});

describe("taxonomyTree", () => {
  const tax = parseTaxonomy(DOC);

  it("hangs every id under its node", () => {
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

  // The 30-record case from outside: the decomposition is declared, most
  // of it is empty. A tree that leaves out empty nodes shows a registry
  // as healthier the more of it is missing.
  it("keeps a declared node without records as a visible hole", () => {
    const tree = taxonomyTree(tax, ["registry/integrity/record-validation"]);
    const registry = tree.find((b) => b.domain.name === "registry")!;
    expect(registry.nodes.map((n) => [n.capability, n.empty])).toEqual([
      ["integrity", false],
      ["layout", true],
    ]);
  });

  // The other direction: populated and not declared is a lint error, and
  // otherwise the tree would be the only view in which it disappears.
  it("shows an undeclared id separately instead of swallowing it", () => {
    const tree = taxonomyTree(tax, ["infra/cicd/facet-lsp"]);
    const leftovers = tree[tree.length - 1];
    expect(leftovers.domain.name).toBe("");
    expect(leftovers.nodes[0].undeclared).toBe(true);
    expect(leftovers.nodes[0].ids).toEqual(["infra/cicd/facet-lsp"]);
    expect(leftovers.domain.title).toBe("Not declared");
    const german = taxonomyTree(tax, ["infra/cicd/facet-lsp"], createText("de"));
    expect(german[german.length - 1].domain.title).toBe(germanText.t("core.taxonomy.undeclared"));
  });

  it("is empty as long as no taxonomy is declared", () => {
    expect(taxonomyTree(null, ["a/b/c"])).toEqual([]);
  });

  it("ignores an id that does not have three segments", () => {
    const tree = taxonomyTree(tax, ["nonsense"]);
    expect(tree.every((b) => b.ids.length === 0)).toBe(true);
  });
});
