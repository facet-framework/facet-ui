import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/facet/screens/b-records/records.spec.text";
import { fireEvent, render as renderInEnglish, screen, within } from "@testing-library/react";
import { renderInGerman as render } from "../../i18n/testing";
import { en, type Dictionary } from "../../i18n/en";
import { de } from "../../i18n/de";
import { RecordsPage, Hit, type RecordsPageProps } from "./RecordsPage";
import {
  RecordDossierPage,
  type RecordDossier,
  type RecordDossierPageProps,
} from "./RecordDossierPage";
import { AnchorSheet, ConfigSheet, RuleSheet, TermSheet } from "./RecordSheets";
import { CodeView, CommitSpark, DependencyGraph, ProofBar, SectionRail } from "./parts";
import { TAG, dateText, parseSteps, pctText, roleLabel, share, words, type Text } from "./model";
import { SUMMARY } from "../../fixtures/summary";
import { DependencyNetwork } from "./DependencyNetwork";
import { COMMIT_GATE_YAML, TEST_COUNTS } from "./recordFacts";
import {
  COMMIT_GATE_CONFIG,
  COMMIT_GATE_EXCERPT,
  MANY_ROWS,
  REAL_ROWS,
  RULE_ANCHORED,
  anchorsIn,
  applyFilters,
  distributionsFor,
  dossierOf,
  facetsFor,
  featureById,
  fieldGroups,
  filterChips,
  matrixRows,
  recordYaml,
  networkOf,
  ruleAppliesTo,
  search,
  siblingsOf,
  sortRows,
  summaryOf,
  termOf,
} from "./storyData";

describe("parseSteps", () => {
  it("reads one step per line and continues unkeyworded lines", () => {
    expect(parseSteps("Given a\nWhen b\nThen c\ncontinued\nAnd d\nBut e")).toEqual([
      { kw: "given", text: "a" },
      { kw: "when", text: "b" },
      { kw: "then", text: "c continued" },
      { kw: "and", text: "d" },
      { kw: "and", text: "e" },
    ]);
  });

  it("splits a one-sentence scenario at its keywords", () => {
    const steps = parseSteps(
      'Given the bundled "adr" manifest, when its "reads" list is\ninspected, then it names exactly "docs/adr".',
    );
    expect(steps.map((s) => s.kw)).toEqual(["given", "when", "then"]);
    expect(steps[1].text).toBe('its "reads" list is inspected');
  });

  it("treats a statement without keywords as its premise", () => {
    expect(parseSteps("plain words")).toEqual([{ kw: "given", text: "plain words" }]);
  });
});

const textOf =
  (dict: Dictionary): Text =>
  (key, params) =>
    dict[key].replace(/\{\{(\w+)\}\}/g, (whole, name: string) => String(params?.[name] ?? whole));
const inGerman = textOf(de);
const inEnglish = textOf(en);

describe("model helpers", () => {
  it("never turns a missing share into zero", () => {
    expect(share(1, 0)).toBeNull();
    expect(pctText(null, inGerman)).toBe("—");
    expect(pctText(share(1, 4), inGerman)).toBe("25 %");
    expect(pctText(share(1, 4), inEnglish)).toBe("25%");
    expect(dateText(null, inGerman)).toBe("—");
    expect(dateText("2026-11-06T18:18:28Z", inGerman)).toBe("06.11.2026");
    expect(dateText("2026-11-06T18:18:28Z", inEnglish)).toBe("2026-11-06");
    expect(words("column")).toBe("column");
    expect(roleLabel("primary", inGerman)).toBe(localized.text1);
    expect(roleLabel("primary", inEnglish)).toBe("carries");
    expect(roleLabel("custom", inGerman)).toBe("custom");
    expect(TAG).toBe("@" + "facet");
  });
});

describe("story data", () => {
  it("maps the snapshot onto rows and keeps the real counts", () => {
    const gate = REAL_ROWS.find((r) => r.id === "lists/permissions/admin")!;
    expect(gate).toMatchObject({ proven: 23, scenarios: 23, anchors: 5, kind: "feature" });
    expect(MANY_ROWS).toHaveLength(4812);
    expect(summaryOf(REAL_ROWS).total).toBe(REAL_ROWS.length);
    expect(summaryOf([]).provenPct).toBeNull();
    expect(() => featureById("no/such/record")).toThrow("no record");
  });

  it("agrees with the headline figures every screen shows", () => {
    const s = summaryOf(REAL_ROWS);
    expect(s).toMatchObject({
      total: SUMMARY.records,
      provenPct: SUMMARY.provenPct,
      drift: SUMMARY.driftRecords,
      domains: SUMMARY.domains,
      assumptions: SUMMARY.records - SUMMARY.features,
      knowledgeOpen: SUMMARY.knowledgeOpen,
    });
  });

  it("treats an assumption as a type, never as a domain", () => {
    const facets = facetsFor(REAL_ROWS, { kind: "assumption" });
    expect(facets.find((f) => f.key === "kind:assumption")).toMatchObject({
      label: germanLabels.text19,
      count: 1,
      active: true,
    });
    expect(facets.some((f) => f.key === "domain:assumption")).toBe(false);
    expect(applyFilters(REAL_ROWS, { kind: "assumption" }).map((r) => r.id)).toEqual([
      "assumption/sync/push-optin-rate",
    ]);
    expect(filterChips({ kind: "assumption" })[0].label).toBe(germanLabels.text129);
    expect(fieldGroups(REAL_ROWS, "").find((g) => g.kind === "assumption")?.capability).toBe(
      "sync",
    );
    expect(distributionsFor(REAL_ROWS)[0].parts.map((p) => p.key)).toContain(germanLabels.text19);
  });

  it("lays the dependency network out in layers below each need", () => {
    const g = networkOf(REAL_ROWS, "column");
    const depth = new Map(g.nodes.map((n) => [n.id, n.depth]));

    const backwards = g.edges.filter(([from, to]) => depth.get(from)! <= depth.get(to)!);
    expect(backwards.length / g.edges.length).toBeLessThan(0.05);
    expect(g.nodes.find((n) => n.id === "workspace/board/column")?.match).toBe(true);
  });

  it("takes test counts and the raw record from the record file", () => {
    const adr = dossierOf("workspace/board/column");
    expect(adr.testKinds).toEqual({
      Unit: TEST_COUNTS["workspace/board/column"].Unit,
    });
    expect(adr.testCount).toBe(TEST_COUNTS["workspace/board/column"].Unit);
    expect(dossierOf("lists/permissions/admin").yaml).toBe(COMMIT_GATE_YAML);
    expect(dossierOf("assumption/sync/push-optin-rate").testCount).toBe(0);
  });

  it("filters, searches, sorts and groups", () => {
    const nav = applyFilters(REAL_ROWS, { domain: "navigation", drift: true, lifecycle: "active" });
    expect(nav.every((r) => r.domain === "navigation" && r.drift > 0)).toBe(true);
    expect(search(REAL_ROWS, "admin").map((r) => r.slug)).toContain("admin");
    expect(search(REAL_ROWS, " ")).toHaveLength(REAL_ROWS.length);
    expect(sortRows(REAL_ROWS, "anchors", "desc")[0].anchors).toBeGreaterThanOrEqual(
      sortRows(REAL_ROWS, "anchors", "asc")[0].anchors,
    );
    expect(
      sortRows(REAL_ROWS, "slug", "asc")[0].slug <= sortRows(REAL_ROWS, "slug", "desc")[0].slug,
    ).toBe(true);
    expect(
      facetsFor(REAL_ROWS, { lifecycle: "planned" }).find((f) => f.key === "lc:planned")?.active,
    ).toBe(true);
    expect(
      filterChips({ domain: "documentation", lifecycle: "deprecated", drift: true }).map(
        (c) => c.label,
      ),
    ).toEqual([labelText.text264, labelText.text265, localized.text3]);
    expect(filterChips({ lifecycle: "planned" })[0].label).toBe(remainingText.text133);
    expect(filterChips({ lifecycle: "active" })[0].label).toBe(remainingText.text134);
    const groups = fieldGroups(REAL_ROWS, "plugin");
    expect(groups.flatMap((g) => g.tiles).filter((t) => t.match).length).toBe(
      search(REAL_ROWS, "plugin").length,
    );
    const m = matrixRows(REAL_ROWS);
    expect(m.reduce((a, r) => a + r.active + r.planned + r.deprecated, 0)).toBe(SUMMARY.features);
    expect(m.some((r) => r.domain === "assumption")).toBe(false);
    expect(distributionsFor(REAL_ROWS).map((d) => d.label)).toEqual([
      localized.text4,
      germanLabels.text130,
    ]);
  });

  it("builds a dossier with dependents, drift dates and the yaml shape", () => {
    const d = dossierOf("workspace/board/column");
    expect(d.dependents.map((x) => x.id)).toContain("workspace/board/card");
    expect(d.drift[0].path).toBe("packages/task/import.go");
    expect(d.log).toHaveLength(4);
    expect(dossierOf("workspace/board/column", { allLog: true }).log?.length).toBe(
      featureById("workspace/board/column").log.length,
    );
    expect(d.yaml).toMatch(/^schema_version/);
    expect(JSON.parse(d.json).id).toBe(d.id);
    const ri = dossierOf("delivery/ci/cache");
    expect(ri.scenarios.filter((s) => s.proven)).toHaveLength(2);
    const assumption = featureById("assumption/sync/push-optin-rate");
    expect(recordYaml(assumption)).toContain("# unanswered");
    expect(siblingsOf("workspace/board/column").capabilities.map((c) => c.id)).toContain(
      "assistant",
    );
    expect(anchorsIn("packages/board/store.go").map((a) => a.recordId)).toContain(
      "lists/permissions/admin",
    );
    expect(ruleAppliesTo("guardrails").every((r) => r.holds)).toBe(true);
    expect(termOf(germanLabels.text4).term).toBe(germanLabels.text4);
    expect(termOf(labelText.text266).term).toBeTruthy();
  });
});

function recordsProps(over: Partial<RecordsPageProps> = {}): RecordsPageProps {
  const rows = REAL_ROWS;
  return {
    state: "ready",
    summary: summaryOf(rows),
    matched: rows.length,
    query: "",
    view: "list",
    facets: facetsFor(rows, {}),
    rows: rows.slice(0, 25),
    page: 1,
    pageSize: 25,
    sort: { key: "changedAt", dir: "desc" },
    field: fieldGroups(rows, ""),
    matrix: matrixRows(rows),
    ...over,
  };
}

describe("RecordsPage", () => {
  it("opens with the count and the proven share, and opens a record from the list", () => {
    const onOpen = jest.fn();
    render(<RecordsPage {...recordsProps({ onOpen })} />);
    expect(screen.getByTestId("records-total")).toHaveTextContent(String(REAL_ROWS.length));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(localized.text5);
    const list = screen.getByRole("list", { name: "Records" });
    const first = within(list).getAllByRole("listitem")[0];
    fireEvent.click(within(first).getByRole("button"));
    expect(onOpen).toHaveBeenCalledWith(REAL_ROWS[0].id);
    expect(screen.getByRole("navigation", { name: labelText.text35 })).toBeInTheDocument();
  });

  it("switches views, toggles facets and reports search input", () => {
    const onView = jest.fn();
    const onFacet = jest.fn();
    const onQuery = jest.fn();
    render(<RecordsPage {...recordsProps({ onView, onFacet, onQuery })} />);
    fireEvent.click(screen.getByRole("radio", { name: /Matrix/ }));
    expect(onView).toHaveBeenCalledWith("matrix");
    fireEvent.click(screen.getByRole("button", { name: remainingText.text135 }));
    expect(onFacet).toHaveBeenCalledWith("lc:planned");
    fireEvent.change(screen.getByRole("searchbox", { name: "Records durchsuchen" }), {
      target: { value: "gate" },
    });
    expect(onQuery).toHaveBeenCalledWith("gate");
  });

  it("sharpens matching tiles in the field and orders hit groups first", () => {
    const onOpen = jest.fn();
    const onCell = jest.fn();
    render(
      <RecordsPage
        {...recordsProps({
          view: "field",
          query: "admin",
          field: fieldGroups(REAL_ROWS, "admin"),
          onOpen,
          onCell,
        })}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(localized.text6);
    const groups = screen.getAllByRole("region");
    expect(groups[0]).toHaveAccessibleName("lists / permissions");
    const tile = within(groups[0]).getByTitle(/lists\/permissions\/admin ·/);
    fireEvent.click(tile);
    expect(onOpen).toHaveBeenCalledWith("lists/permissions/admin");
    fireEvent.click(within(groups[0]).getByRole("button", { name: /permissions/ }));
    expect(onCell).toHaveBeenCalledWith("lists", "permissions");
  });

  it("renders the matrix with clickable cells, and a card form on a phone", () => {
    const onCell = jest.fn();
    const { rerender } = render(<RecordsPage {...recordsProps({ view: "matrix", onCell })} />);
    const table = screen.getByRole("table", { name: localized.text7 });
    fireEvent.click(within(table).getByRole("button", { name: remainingText.text136 }));
    expect(onCell).toHaveBeenCalledWith("lists", "permissions", "active");
    expect(
      within(table).getByRole("button", { name: "lists/permissions: 0 geplant" }),
    ).toBeDisabled();
    rerender(<RecordsPage {...recordsProps({ view: "matrix", mobile: true, onCell })} />);
    expect(screen.queryByRole("table")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /sharing/ }));
    expect(onCell).toHaveBeenLastCalledWith("lists", "sharing");
  });

  it("sorts the table by its header and pages", () => {
    const onSort = jest.fn();
    const onPage = jest.fn();
    const many = MANY_ROWS.slice(0, 500);
    render(
      <RecordsPage
        {...recordsProps({ view: "table", rows: many.slice(0, 25), matched: 500, onSort, onPage })}
      />,
    );
    expect(screen.getByRole("columnheader", { name: localized.text8 })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text139 }));
    expect(onSort).toHaveBeenCalledWith("anchors");
    fireEvent.click(screen.getByRole("button", { name: labelText.text25 }));
    expect(onPage).toHaveBeenCalledWith(20);
    fireEvent.click(screen.getByRole("button", { name: localized.text9 }));
    expect(onSort).toHaveBeenLastCalledWith("changedAt");
  });

  it("shows active filters as removable chips and a distribution band that filters", () => {
    const onRemoveFilter = jest.fn();
    const onDistribution = jest.fn();
    render(
      <RecordsPage
        {...recordsProps({
          filters: [{ key: "domain", label: localized.text10 }],
          distributions: distributionsFor(MANY_ROWS),
          onRemoveFilter,
          onDistribution,
        })}
      />,
    );
    const chips = screen.getByRole("group", { name: "Aktive Filter" });
    fireEvent.click(within(chips).getByRole("button", { name: germanLabels.text6 }));
    expect(onRemoveFilter).toHaveBeenCalledWith("domain");
    fireEvent.click(screen.getByRole("button", { name: remainingText.text137 }));
    expect(onDistribution).toHaveBeenCalledWith(germanLabels.text130, "active");
  });

  it("offers the nearest records when nothing matches", () => {
    const onReset = jest.fn();
    const onOpen = jest.fn();
    render(
      <RecordsPage
        {...recordsProps({
          state: "filtered-empty",
          query: labelText.text267,
          matched: 0,
          suggestions: REAL_ROWS.slice(0, 2),
          onReset,
          onOpen,
        })}
      />,
    );
    expect(screen.getByText(localized.text11)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: localized.text12 }));
    expect(onReset).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: REAL_ROWS[1].id }));
    expect(onOpen).toHaveBeenCalledWith(REAL_ROWS[1].id);
  });

  it("shows dashes, not zeros, while loading — in list and in field form", () => {
    const blank = {
      total: null,
      provenPct: null,
      drift: null,
      knowledgeOpen: null,
      domains: null,
      assumptions: null,
    };
    const { rerender } = render(
      <RecordsPage {...recordsProps({ state: "loading", summary: blank })} />,
    );
    expect(screen.getByTestId("records-total")).toHaveTextContent("—");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(localized.text13);
    rerender(
      <RecordsPage {...recordsProps({ state: "loading", summary: blank, view: "field" })} />,
    );
    expect(screen.getByTestId("records-page").querySelector("[aria-busy='true']")).not.toBeNull();
  });

  it("names the empty register and the error with a retry", () => {
    const onRetry = jest.fn();
    const { rerender } = render(
      <RecordsPage
        {...recordsProps({ state: "empty", summary: { ...summaryOf([]), total: 0 } })}
      />,
    );
    expect(screen.getByText(localized.text15)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(localized.text16);
    rerender(<RecordsPage {...recordsProps({ state: "error", onRetry })} />);
    fireEvent.click(screen.getByRole("button", { name: labelText.text20 }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("names assumptions as such in the list and beside the matrix", () => {
    const { rerender } = render(
      <RecordsPage {...recordsProps({ rows: applyFilters(REAL_ROWS, { kind: "assumption" }) })} />,
    );
    expect(screen.getByRole("list", { name: "Records" })).toHaveTextContent(germanLabels.text140);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(germanLabels.text141);
    rerender(<RecordsPage {...recordsProps({ view: "matrix" })} />);
    expect(screen.getByTestId("matrix-assumptions")).toHaveTextContent(localized.text17);
    rerender(<RecordsPage {...recordsProps({ view: "field" })} />);
    expect(screen.getByRole("region", { name: labelText.text268 })).toBeInTheDocument();
  });

  it("draws the dependency network and opens a node", () => {
    const onOpen = jest.fn();
    render(
      <RecordsPage
        {...recordsProps({
          view: "network",
          query: "adr",
          network: networkOf(REAL_ROWS, "column"),
          onOpen,
        })}
      />,
    );
    expect(screen.getByRole("img", { name: localized.text18 })).toBeInTheDocument();
    fireEvent.click(screen.getByText("column", { selector: "text" }).closest("a")!);
    expect(onOpen).toHaveBeenCalledWith("workspace/board/column");
  });

  it("lists the network as needs per record on a phone, filtered by the search", () => {
    const onOpen = jest.fn();
    const g = networkOf(REAL_ROWS, "column");
    render(<DependencyNetwork graph={g} query="column" mobile onOpen={onOpen} />);
    const list = screen.getByRole("list", { name: localized.text19 });
    fireEvent.click(within(list).getAllByRole("button", { name: "workspace/board/column" })[0]);
    expect(onOpen).toHaveBeenCalledWith("workspace/board/column");
    fireEvent.click(
      within(list).getAllByRole("button", { name: "workspace/board/progress-group" })[0],
    );
    expect(onOpen).toHaveBeenLastCalledWith("workspace/board/progress-group");
    const { container } = render(<DependencyNetwork graph={{ nodes: [], edges: [] }} query="" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("marks the query inside text", () => {
    const { container } = render(<Hit text="plugin plugin" query="Plugin" />);
    expect(container.querySelectorAll("mark")).toHaveLength(2);
  });
});

function dossierProps(
  record: RecordDossier,
  over: Partial<RecordDossierPageProps> = {},
): RecordDossierPageProps {
  return {
    state: "ready",
    record,
    siblings: siblingsOf(record.id),
    tab: "record",
    now: "2026-11",
    ...over,
  };
}

describe("English source text", () => {
  it("renders the records page in English without a provider", () => {
    renderInEnglish(<RecordsPage {...recordsProps({})} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "96% of their promises proven",
    );
    expect(screen.getByRole("searchbox", { name: "Search records" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Focus map/ })).toBeInTheDocument();
    expect(screen.getByText("With drift")).toBeInTheDocument();
    expect(screen.queryByText(localized.text20)).not.toBeInTheDocument();
  });

  it("renders the record page in English without a provider", () => {
    const adr = dossierOf("workspace/board/column");
    renderInEnglish(<RecordDossierPage {...dossierProps(adr)} />);
    expect(screen.getByRole("heading", { level: 2, name: "Promises" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Drift" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Record" })).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("1 file changed");
    expect(screen.getAllByText("Given").length).toBeGreaterThan(0);
    expect(screen.queryByText(labelText.text195)).not.toBeInTheDocument();
  });

  it("names rule severity and term status in English", () => {
    const { unmount } = renderInEnglish(
      <RuleSheet {...RULE_ANCHORED} appliesTo={[]} severity="warning" open />,
    );
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Every affected record holds the rule.")).toBeInTheDocument();
    unmount();
    renderInEnglish(<TermSheet {...termOf("")} records={[]} status="proposed" open />);
    expect(screen.getByText("proposed")).toBeInTheDocument();
    expect(screen.getByText("Related terms")).toBeInTheDocument();
  });
});

describe("RecordDossierPage", () => {
  const adr = dossierOf("workspace/board/column");

  it("shows the head, figures and every section of a record", () => {
    render(<RecordDossierPage {...dossierProps(adr)} />);
    expect(screen.getByRole("heading", { level: 1, name: "column" })).toBeInTheDocument();
    expect(screen.getByTestId("figure-promise")).toHaveTextContent("19 / 19");
    for (const s of [
      "promises",
      "code",
      "knowledge",
      "drift",
      "history",
      "relations",
      "operations",
      "rules",
    ]) {
      expect(screen.getByTestId(`section-${s}`)).toBeInTheDocument();
    }
    expect(
      within(
        screen.getByTestId("scenario-the-request-is-refused-with-a-clear-message"),
      ).getAllByRole("listitem"),
    ).toHaveLength(3);
    expect(screen.getByRole("note")).toHaveTextContent(localized.text22);
    expect(screen.getByRole("img", { name: localized.text23 })).toBeInTheDocument();
  });

  it("makes every path segment a place and opens siblings", () => {
    const onNavigate = jest.fn();
    const onToggleSiblings = jest.fn();
    const { rerender } = render(
      <RecordDossierPage {...dossierProps(adr, { onNavigate, onToggleSiblings })} />,
    );
    const path = screen.getByRole("navigation", { name: labelText.text10 });
    fireEvent.click(within(path).getByRole("button", { name: labelText.text43 }));
    fireEvent.click(within(path).getByRole("button", { name: "workspace" }));
    fireEvent.click(within(path).getByRole("button", { name: "board" }));
    expect(onNavigate.mock.calls.map((c) => c[0])).toEqual([
      { kind: "product", id: "" },
      { kind: "domain", id: "workspace" },
      { kind: "capability", id: "workspace/board" },
    ]);
    fireEvent.click(within(path).getAllByRole("button", { name: remainingText.text12 })[1]);
    expect(onToggleSiblings).toHaveBeenCalledWith("capability");
    rerender(
      <RecordDossierPage {...dossierProps(adr, { onNavigate, siblingsOpen: "capability" })} />,
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /^assistant/ }));
    expect(onNavigate).toHaveBeenLastCalledWith({ kind: "capability", id: "workspace/assistant" });
  });

  it("reports interactions on scenarios, anchors, knowledge, log and relations", () => {
    const h = {
      onOpenTest: jest.fn(),
      onOpenAnchor: jest.fn(),
      onMore: jest.fn(),
      onOpenCommit: jest.fn(),
      onNavigate: jest.fn(),
      onSection: jest.fn(),
      onScenarioFilter: jest.fn(),
      onCopy: jest.fn(),
      onTab: jest.fn(),
      onOpenDrift: jest.fn(),
      onAsk: jest.fn(),
    };
    render(<RecordDossierPage {...dossierProps(adr, h)} />);
    fireEvent.click(
      within(
        screen.getByTestId("scenario-the-request-is-refused-with-a-clear-message"),
      ).getAllByRole("button")[0],
    );
    expect(h.onOpenTest).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "Unit",
        file: "plugins/InviteAnswer.spec.tsx",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /ActivityLayout\.tsx :14/ }));
    expect(h.onOpenAnchor).toHaveBeenCalledWith({
      path: "plugins/adr/src/ActivityLayout.tsx",
      line: 14,
      role: "primary",
    });
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text142 }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text143 }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text144 }));
    expect(h.onMore.mock.calls.map((c) => c[0])).toEqual(["scenarios", "anchors", "log"]);
    fireEvent.click(screen.getByRole("button", { name: adr.log![0].sha }));
    expect(h.onOpenCommit).toHaveBeenCalledWith(adr.log![0].sha);
    fireEvent.click(screen.getAllByRole("button", { name: "workspace/board/theme-check" })[0]);
    expect(h.onNavigate).toHaveBeenCalledWith({
      kind: "record",
      id: "workspace/board/theme-check",
    });
    fireEvent.click(screen.getByRole("link", { name: "workspace/board/progress-group" }));
    expect(h.onNavigate).toHaveBeenLastCalledWith({
      kind: "record",
      id: "workspace/board/progress-group",
    });
    fireEvent.click(screen.getByRole("link", { name: remainingText.text138 }));
    expect(h.onSection).toHaveBeenCalledWith("knowledge");
    fireEvent.click(screen.getByRole("button", { name: localized.text24 }));
    expect(h.onSection).toHaveBeenLastCalledWith("drift");
    fireEvent.click(screen.getByRole("radio", { name: localized.text25 }));
    expect(h.onScenarioFilter).toHaveBeenCalledWith("open");
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text145 }));
    expect(h.onCopy).toHaveBeenCalledWith("id");
    fireEvent.click(screen.getByRole("button", { name: "Record ansehen" }));
    expect(h.onTab).toHaveBeenCalledWith("raw");
    fireEvent.click(screen.getByRole("button", { name: localized.text27 }));
    expect(h.onOpenDrift).toHaveBeenCalledWith("packages/task/import.go");
    fireEvent.click(screen.getByRole("button", { name: localized.text28 }));
    expect(h.onAsk).toHaveBeenCalled();
  });

  it("marks an open scenario and filters to open and proven", () => {
    const ri = dossierOf("delivery/ci/cache");
    const { rerender } = render(
      <RecordDossierPage {...dossierProps(ri, { scenarioFilter: "open" })} />,
    );
    expect(screen.getAllByText(localized.text30)).toHaveLength(4);
    expect(screen.queryByText(labelText.text13, { selector: ".t-badge" })).toBeNull();
    rerender(<RecordDossierPage {...dossierProps(ri, { scenarioFilter: "proven" })} />);
    expect(screen.queryByText(localized.text31)).toBeNull();
    rerender(
      <RecordDossierPage
        {...dossierProps(
          { ...ri, scenarios: ri.scenarios.filter((s) => !s.proven) },
          { scenarioFilter: "proven" },
        )}
      />,
    );
    expect(screen.getByText(localized.text32)).toBeInTheDocument();
  });

  it("asks for open knowledge answers", () => {
    const onAnswer = jest.fn();
    render(
      <RecordDossierPage {...dossierProps(dossierOf("workspace/board/card"), { onAnswer })} />,
    );
    expect(screen.getByTestId("figure-knowledge")).toHaveTextContent("0 / 5");
    fireEvent.click(
      within(screen.getByTestId("slot-not_for")).getByRole("button", {
        name: remainingText.text139,
      }),
    );
    expect(onAnswer).toHaveBeenCalledWith("not_for");
  });

  it("shows each sibling's proven share in the path menu", () => {
    render(<RecordDossierPage {...dossierProps(adr, { siblingsOpen: "record" })} />);
    const item = screen.getAllByRole("menuitem", { name: /^admin|^card/ })[0];
    expect(item).toHaveTextContent(localized.text33);
    expect(item).toHaveTextContent(/%|—/);
  });

  it("puts an assumption under Assumptions, not under a domain", () => {
    const onNavigate = jest.fn();
    const a = dossierOf("assumption/sync/push-optin-rate");
    render(<RecordDossierPage {...dossierProps(a, { onNavigate })} />);
    const path = screen.getByRole("navigation", { name: labelText.text10 });
    expect(within(path).queryByText("assumption")).toBeNull();
    fireEvent.click(within(path).getByRole("button", { name: labelText.text269 }));
    expect(onNavigate).toHaveBeenCalledWith({ kind: "records", id: "kind:assumption" });
    fireEvent.click(within(path).getByRole("button", { name: "Records" }));
    expect(onNavigate).toHaveBeenLastCalledWith({ kind: "records", id: "" });
  });

  it("explains a planned record without an anchor and offers the anchor to copy", () => {
    const onCopy = jest.fn();
    const planned = {
      ...dossierOf("workspace/assistant/summary-restore"),
      anchors: [],
      anchorCount: 0,
    };
    render(<RecordDossierPage {...dossierProps(planned, { onCopy })} />);
    expect(screen.getByRole("note")).toHaveTextContent(localized.text34);
    expect(screen.getByRole("region", { name: localized.text35 })).toHaveTextContent(
      `${TAG}: workspace/assistant/summary-restore`,
    );
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text146 }));
    expect(onCopy).toHaveBeenCalledWith("anchor");
  });

  it("says a planned record already carries anchors when it does", () => {
    render(
      <RecordDossierPage {...dossierProps(dossierOf("workspace/assistant/summary-restore"))} />,
    );
    expect(screen.getByRole("note")).toHaveTextContent(localized.text36);
  });

  it("treats an assumption as a claim without proof, anchor or summary", () => {
    render(<RecordDossierPage {...dossierProps(dossierOf("assumption/sync/push-optin-rate"))} />);
    expect(screen.getByRole("note")).toHaveTextContent(germanLabels.text147);
    expect(screen.getByText(localized.text37)).toBeInTheDocument();
    expect(screen.getByText(localized.text38)).toBeInTheDocument();
    expect(screen.getByTestId("figure-promise")).toHaveTextContent(localized.text39);
    expect(screen.getByText(localized.text40)).toBeInTheDocument();
  });

  it("warns that a deprecated record is retired and points to its capability", () => {
    const onNavigate = jest.fn();
    render(
      <RecordDossierPage
        {...dossierProps(dossierOf("delivery/releases/mirror-sort"), { onNavigate })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: remainingText.text140 }));
    expect(onNavigate).toHaveBeenCalledWith({ kind: "capability", id: "delivery/releases" });
  });

  it("names a record without tests and a scenario-less feature", () => {
    const sl = dossierOf("lists/sharing/comment-archive");
    const { rerender } = render(<RecordDossierPage {...dossierProps(sl)} />);
    expect(screen.getByTestId("figure-test")).toHaveTextContent(localized.text41);
    rerender(
      <RecordDossierPage
        {...dossierProps({ ...sl, scenarios: [], scenarioCount: 0, provenCount: 0 })}
      />,
    );
    expect(screen.getByText(localized.text42)).toBeInTheDocument();
  });

  it("shows observation, rules and opens a rule", () => {
    const onOpenRule = jest.fn();
    const r = {
      ...dossierOf("workspace/search/ranking"),
      rules: [{ id: RULE_ANCHORED.id, title: RULE_ANCHORED.title, states: "" }],
    };
    render(<RecordDossierPage {...dossierProps(r, { onOpenRule })} />);
    expect(screen.getByText(labelText.text270)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(RULE_ANCHORED.title) }));
    expect(onOpenRule).toHaveBeenCalledWith(RULE_ANCHORED.id);
    expect(screen.getByText(localized.text43)).toBeInTheDocument();
  });

  it("shows the raw record as yaml or json and copies it", () => {
    const onRawFormat = jest.fn();
    const onCopy = jest.fn();
    const gate = dossierOf("lists/permissions/admin");
    const { rerender } = render(
      <RecordDossierPage {...dossierProps(gate, { tab: "raw", onRawFormat, onCopy })} />,
    );
    expect(screen.getByRole("region", { name: "Record als YAML" })).toHaveTextContent(
      "id: lists/permissions/admin",
    );
    fireEvent.click(screen.getByRole("radio", { name: "JSON" }));
    expect(onRawFormat).toHaveBeenCalledWith("json");
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text12 }));
    expect(onCopy).toHaveBeenCalledWith("raw");
    rerender(<RecordDossierPage {...dossierProps(gate, { tab: "raw", rawFormat: "json" })} />);
    expect(screen.getByRole("region", { name: "Record als JSON" })).toHaveTextContent(
      '"lifecycle": "active"',
    );
  });

  it("folds sections on a phone and indexes them as chips", () => {
    const onToggleSection = jest.fn();
    const onSection = jest.fn();
    render(
      <RecordDossierPage
        {...dossierProps(adr, {
          mobile: true,
          collapsed: ["code"],
          section: "knowledge",
          onToggleSection,
          onSection,
        })}
      />,
    );
    const code = screen.getByRole("button", { name: "Code" });
    expect(code).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(code);
    expect(onToggleSection).toHaveBeenCalledWith("code");
    const chips = screen.getByRole("navigation", { name: labelText.text8 });
    expect(within(chips).getByRole("button", { name: remainingText.text138 })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(within(chips).getByRole("button", { name: germanLabels.text148 }));
    expect(onSection).toHaveBeenCalledWith("history");
    expect(screen.queryByRole("img", { name: localized.text44 })).toBeNull();
  });

  it("says when a record does not exist and offers near ids", () => {
    const onNavigate = jest.fn();
    render(
      <RecordDossierPage
        state="not-found"
        tab="record"
        missingId="workspace/board/columns"
        nearest={["workspace/board/column"]}
        onNavigate={onNavigate}
      />,
    );
    expect(screen.getByTestId("dossier-not-found")).toHaveTextContent(localized.text45);
    fireEvent.click(screen.getByRole("button", { name: "workspace/board/column" }));
    expect(onNavigate).toHaveBeenCalledWith({ kind: "record", id: "workspace/board/column" });
    fireEvent.click(screen.getByRole("button", { name: remainingText.text141 }));
    expect(onNavigate).toHaveBeenLastCalledWith({
      kind: "records",
      id: "workspace/board/columns",
    });
  });
});

describe("sheets", () => {
  it("shows the anchor's source with its line marked and the file's other anchors", () => {
    const onOpenRecord = jest.fn();
    const onClose = jest.fn();
    render(
      <AnchorSheet
        open
        recordId="lists/permissions/admin"
        path="packages/board/store.go"
        line={1170}
        anchorRole="primary"
        excerpt={{ ...COMMIT_GATE_EXCERPT, lang: "go" }}
        fileAnchors={anchorsIn("packages/board/store.go")}
        lastCommit={featureById("lists/permissions/admin").log[0]}
        onOpenRecord={onOpenRecord}
        onClose={onClose}
      />,
    );
    const sheet = screen.getByRole("dialog", { name: "store.go:1170" });
    expect(within(sheet).getByRole("region", { name: germanLabels.text149 })).toHaveTextContent(
      "func hookPreToolUse",
    );
    expect(within(sheet).getByText(germanLabels.text150)).toBeInTheDocument();
    fireEvent.click(within(sheet).getByRole("button", { name: "lists/sharing/guest" }));
    expect(onOpenRecord).toHaveBeenCalledWith("lists/sharing/guest");
    fireEvent.click(within(sheet).getByRole("button", { name: localized.text46 }));
    expect(onClose).toHaveBeenCalled();
  });

  it("marks a drifted anchor and renders as a bottom sheet on a phone", () => {
    render(
      <AnchorSheet
        open
        mobile
        drifted
        recordId="x/y/z"
        path="a.go"
        line={1}
        anchorRole="config"
        excerpt={{ firstLine: 1, text: "package a", lang: "text" }}
        fileAnchors={[{ line: 1, role: "config", recordId: "x/y/z" }]}
      />,
    );
    expect(screen.getByText(germanLabels.text4)).toBeInTheDocument();
    expect(screen.getByTestId("anchor-sheet").closest("section")?.className).toContain(
      "t-sheet--bottom",
    );
  });

  it("lists who breaks a rule and who holds it", () => {
    const onOpenRecord = jest.fn();
    const { rerender } = render(
      <RuleSheet
        open
        {...RULE_ANCHORED}
        appliesTo={[
          { id: "a/b/ok", holds: true },
          { id: "a/b/bad", holds: false },
        ]}
        onOpenRecord={onOpenRecord}
      />,
    );
    expect(screen.getByText(labelText.text271)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "a/b/bad" }));
    expect(onOpenRecord).toHaveBeenCalledWith("a/b/bad");
    rerender(
      <RuleSheet
        open
        {...RULE_ANCHORED}
        severity="warning"
        appliesTo={ruleAppliesTo("guardrails")}
      />,
    );
    expect(screen.getByText(localized.text47)).toBeInTheDocument();
  });

  it("shows the effective value of a configuration key in all three states", () => {
    const { rerender } = render(
      <ConfigSheet
        open
        {...COMMIT_GATE_CONFIG}
        line={null}
        value={null}
        snippet={{ firstLine: 1, text: "hooks:\n  commit_gate: off" }}
      />,
    );
    expect(screen.getByText(localized.text48)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: localized.text49 })).toBeInTheDocument();
    rerender(
      <ConfigSheet
        open
        {...COMMIT_GATE_CONFIG}
        line={5}
        value="off"
        snippet={{ firstLine: 4, text: "hooks:\n  commit_gate: off" }}
      />,
    );
    expect(screen.getByText(labelText.text272)).toBeInTheDocument();
    rerender(
      <ConfigSheet open {...COMMIT_GATE_CONFIG} env={undefined} allowed={[]} line={5} value="of" />,
    );
    expect(screen.queryByText(localized.text50)).toBeNull();
    expect(screen.getByText(germanLabels.text151)).toBeInTheDocument();
    rerender(<ConfigSheet open mobile {...COMMIT_GATE_CONFIG} line={5} value="of" />);
    expect(screen.getByText(localized.text51)).toBeInTheDocument();
  });

  it("shows a term with its related terms and records", () => {
    const onTerm = jest.fn();
    const onPropose = jest.fn();
    const t = termOf(germanLabels.text4);
    const { rerender } = render(
      <TermSheet
        open
        {...t}
        translation="drift"
        records={["a/b/c"]}
        onTerm={onTerm}
        onPropose={onPropose}
      />,
    );
    expect(screen.getByRole("dialog", { name: germanLabels.text4 })).toHaveTextContent("EN: drift");
    fireEvent.click(screen.getByRole("button", { name: t.related[0] }));
    expect(onTerm).toHaveBeenCalledWith(t.related[0]);
    fireEvent.click(screen.getByRole("button", { name: localized.text52 }));
    expect(onPropose).toHaveBeenCalled();
    rerender(
      <TermSheet open mobile {...t} status="proposed" aliases={[]} related={[]} records={[]} />,
    );
    expect(screen.getByText(localized.text53)).toBeInTheDocument();
    expect(screen.getByText(labelText.text148)).toBeInTheDocument();
  });

  it("renders nothing while closed", () => {
    const { container } = render(
      <TermSheet open={false} {...termOf(germanLabels.text18)} records={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("parts", () => {
  it("draws a dash for a bar without scenarios and partial proof as open", () => {
    const { container, rerender } = render(<ProofBar proven={0} total={0} />);
    expect(container).toHaveTextContent("—");
    rerender(<ProofBar proven={1} total={3} wide />);
    expect(container.firstElementChild).toHaveAttribute("title", localized.text54);
  });

  it("counts commits into months and ignores those outside the window", () => {
    render(
      <CommitSpark
        dates={["2026-11-02", "2026-11-01", "2025-01-01", "2027-01-01"]}
        months={3}
        now="2026-11"
      />,
    );
    expect(
      screen.getByRole("img", { name: labelText.text273 }).querySelectorAll("rect"),
    ).toHaveLength(3);
  });

  it("highlights yaml keys, json keys and comments", () => {
    const { container, rerender } = render(
      <CodeView label="c" lang="yaml" text={"# note\nkey: v\nplain"} />,
    );
    expect(container.querySelectorAll("code")).toHaveLength(3);
    rerender(<CodeView label="c" lang="json" text={'{\n  "id": 1\n}'} />);
    expect(screen.getByRole("region", { name: "c" })).toHaveTextContent('"id": 1');
    rerender(<CodeView label="c" lang="go" text={"// plain comment\nx := 1"} />);
    expect(screen.getByRole("region", { name: "c" })).toHaveTextContent("x := 1");
  });

  it("says when a record needs nothing and nobody needs it", () => {
    render(<DependencyGraph center="a" upstream={[]} downstream={[]} />);
    expect(screen.getByText("braucht nichts")).toBeInTheDocument();
    expect(screen.getByText(localized.text55)).toBeInTheDocument();
  });

  it("marks the current rail entry", () => {
    render(
      <SectionRail
        items={[
          { key: "a", label: "A" },
          { key: "b", label: "B", count: 2, tone: "ok" },
        ]}
        current="b"
      />,
    );
    expect(screen.getByRole("link", { name: /B/ })).toHaveAttribute("aria-current", "location");
    fireEvent.click(screen.getByRole("link", { name: "A" }));
  });
});

describe("unread commit history on the record page", () => {
  const adr = dossierOf("workspace/board/column");

  it("says the history was not read instead of counting zero commits", () => {
    renderInEnglish(<RecordDossierPage {...dossierProps({ ...adr, logCount: null, log: null })} />);
    expect(screen.getByTestId("dossier-history-unmeasured")).toHaveTextContent(
      "— · History not read · not measured",
    );
    expect(screen.getByTestId("dossier-log-unmeasured")).toHaveTextContent("— · History not read");
    expect(screen.queryByText("0 commits")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dossier-log-empty")).not.toBeInTheDocument();
  });

  it("says a read history without commits has none", () => {
    renderInEnglish(<RecordDossierPage {...dossierProps({ ...adr, logCount: 0, log: [] })} />);
    expect(screen.getByTestId("dossier-log-empty")).toHaveTextContent(
      "No commit has touched this record yet.",
    );
    expect(screen.queryByTestId("dossier-log-unmeasured")).not.toBeInTheDocument();
    expect(screen.getAllByText(/0 commits/).length).toBeGreaterThan(0);
  });
});
