import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/facet/screens/c-contents/contents.spec.text";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import {
  fireEvent,
  render as renderInEnglish,
  renderHook,
  screen,
  within,
} from "@testing-library/react";
import { renderInGerman as render } from "../../i18n/testing";
import { FacetTextProvider, useText } from "../../i18n/TextProvider";
import {
  BandChart,
  BarList,
  CalendarHeatmap,
  layoutTreemap,
  nf,
  pct,
  ShareBar,
  Sparkline,
  Sunburst,
  toneVar,
  Treemap,
} from "./charts";
import {
  capOf,
  Gwt,
  InlineMd,
  KindFrame,
  MiniStat,
  PathRef,
  RecordRef,
  short,
  splitGwt,
  stripMd,
} from "./frame";
import { ContentsHub } from "./Hub";
import { PromisesPage } from "./Promises";
import { KnowledgePage, OperationsPage, ProvenancePage } from "./Registry";
import { CalibrationPage, TaxonomyPage } from "./Structure";
import { ageDays, ageWord, DeviationsPage, DriftPage, FixedPage, TestsPage } from "./Evidence";
import { AnchorsPage, FilesPage, RulesPage } from "./Code";
import { GlossaryPage, validateProposal, type ProposalState } from "./Glossary";
import { desk, mob, tab } from "./kit";
import { SUMMARY } from "../../fixtures/summary";
import * as D from "./data";
import type { GlossaryTerm, Tone } from "./model";

const noop = () => undefined;

function germanText() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <FacetTextProvider locale="de">{children}</FacetTextProvider>
  );
  return renderHook(() => useText(), { wrapper }).result.current.t;
}

describe("charts", () => {
  it("formats numbers in German and renders unmeasured shares as a dash", () => {
    expect(nf(4812)).toBe("4.812");
    expect(pct(null)).toBe("—");
    expect(pct(0.284)).toBe("28 %");
    expect(
      (["ok", "warn", "plan", "bad", "signal", "neutral", undefined] as (Tone | undefined)[]).map(
        toneVar,
      ),
    ).toHaveLength(7);
  });

  it("lays out a treemap that fills the rectangle", () => {
    const cells = layoutTreemap([{ value: 6 }, { value: 3 }, { value: 1 }], {
      x: 0,
      y: 0,
      w: 100,
      h: 50,
    });
    const area = cells.reduce((a, c) => a + c.w * c.h, 0);
    expect(cells).toHaveLength(3);
    expect(Math.round(area)).toBe(5000);
    expect(layoutTreemap([], { x: 0, y: 0, w: 1, h: 1 })).toEqual([]);
    expect(layoutTreemap([{ value: 1 }, { value: 1 }], { x: 0, y: 0, w: 10, h: 40 })[1].y).toBe(20);
  });

  it("reports picks from bars, calendar days, pyramid-free treemap cells", () => {
    const pick = jest.fn();
    render(
      <>
        <BarList
          label={labelText.text92}
          items={[{ key: "a", label: "A", value: 3, meta: "m" }]}
          onPick={pick}
        />
        <BarList label={localized.text1} items={[{ key: "b", label: "B", value: 1 }]} />
        <CalendarHeatmap
          label={labelText.text172}
          days={[
            { date: "2026-07-27", count: 4 },
            { date: "2026-08-01", count: 1 },
          ]}
          from="2026-07-27"
          to="2026-08-10"
          selected="2026-07-27"
          onPick={pick}
        />
        <Treemap
          label={labelText.text173}
          items={[
            { key: "x", label: "packages/task", value: 40, sub: "s", heat: 1 },
            { key: "y", label: "y", value: 1 },
          ]}
          onPick={pick}
          selected="x"
        />
        <Sparkline label={germanLabels.text86} values={[1, 3, 2]} />
        <Sparkline label={localized.text2} values={[1]} />
        <ShareBar label={labelText.text174} parts={[{ key: "a", value: 1, tone: "ok" }]} />
        <ShareBar label={labelText.text18} parts={[{ key: "a", value: 0, tone: "ok" }]} />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: /A\s*3/ }));
    fireEvent.click(
      within(screen.getByRole("group", { name: localized.text3 })).getAllByRole("button")[0],
    );
    fireEvent.click(screen.getByRole("button", { name: "packages/task: 40" }));
    expect(pick.mock.calls.map((c) => c[0])).toEqual(["a", "2026-07-27", "x"]);
    expect(screen.getByRole("img", { name: labelText.text172 })).toBeInTheDocument();
  });

  it("draws a sunburst and a band chart with their names", () => {
    render(
      <>
        <Sunburst
          label={labelText.text175}
          selected="d1/c1"
          nodes={[
            {
              key: "d1",
              label: "D",
              value: 2,
              children: [
                { key: "d1/c1", label: "C", value: 1, tone: "warn" },
                { key: "d1/c2", label: "C2", value: 1 },
              ],
            },
            { key: "d2", label: "E", value: 1 },
          ]}
          center={<span>{labelText.text176}</span>}
        />
        <Sunburst label={labelText.text18} nodes={[]} />
        <BandChart
          label="Band"
          min={2}
          max={33}
          median={9}
          band={{ low: 2, high: 9 }}
          values={[1, 5, 20]}
        />
      </>,
    );
    expect(screen.getByRole("img", { name: labelText.text175 })).toBeInTheDocument();
    expect(screen.getByText(labelText.text176)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Band" })).toBeInTheDocument();
  });
});

describe("frame", () => {
  it("splits Given/When/Then across lines and keywords", () => {
    expect(splitGwt("Given a\nAnd b\nWhen c\nThen d\ncontinued")).toEqual({
      given: "a and b",
      when: "c",
      then: "d continued",
    });
    expect(splitGwt(localized.text4)).toEqual({
      given: localized.text5,
      when: "y",
      then: "z",
    });
    expect(splitGwt("Then a\nBut b").then).toBe("a but b");
    expect(splitGwt(localized.text6)).toEqual({ given: "x", when: "y", then: "z" });
    expect(splitGwt("loose text")).toEqual({ given: "loose text", when: "", then: "" });
    expect(short("a/b/c")).toBe("c");
    expect(capOf("a/b/c")).toBe("a/b");
  });

  it("renders the path, the finding and the view switch, and reports both", () => {
    const onView = jest.fn();
    const onCrumb = jest.fn();
    render(
      <KindFrame
        kindLabel={localized.text7}
        group="Registry"
        figure={3}
        of={9}
        tone="warn"
        sentence={germanLabels.text42}
        lead="Lead"
        views={[
          { value: "a", label: "A", icon: "list" },
          { value: "b", label: "B", icon: "grid" },
        ]}
        view="a"
        onView={onView}
        onCrumb={onCrumb}
        toolbar={<span>{germanLabels.text11}</span>}
        aside={<span>{labelText.text46}</span>}
        stats={<MiniStat label={labelText.text14} value={null} />}
      >
        <Gwt text="Given g\nWhen w\nThen t" compact />
        <Gwt text="" />
        <RecordRef id="a/b/c" onOpen={onCrumb} />
        <PathRef path="x.go" />
      </KindFrame>,
    );
    fireEvent.click(screen.getByRole("radio", { name: /B/ }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text87 }));
    fireEvent.click(screen.getByRole("button", { name: "Registry" }));
    fireEvent.click(screen.getByTitle("a/b/c"));
    expect(onView).toHaveBeenCalledWith("b");
    expect(onCrumb.mock.calls.map((c) => c[0])).toEqual(["contents", "Registry", "a/b/c"]);
    expect(screen.getByRole("heading", { name: germanLabels.text42 })).toBeInTheDocument();
    expect(screen.getByTitle(localized.text8)).toHaveTextContent("—");
    expect(screen.getByText(germanLabels.text11)).toBeInTheDocument();
  });

  it("renders a toolbar without views", () => {
    render(
      <KindFrame kindLabel="K" group="G" sentence="S" toolbar={<span>{localized.text9}</span>}>
        x
      </KindFrame>,
    );
    expect(screen.getByText(localized.text10)).toBeInTheDocument();
  });
});

describe("ContentsHub", () => {
  it("shows all fourteen kinds with figures, and opens a kind or one of its views", () => {
    const onOpen = jest.fn();
    render(
      <ContentsHub state="ready" kinds={D.contentKinds} headline={D.hubHeadline} onOpen={onOpen} />,
    );
    expect(D.contentKinds).toHaveLength(14);
    const tile = screen.getByTestId("kind-promises");
    expect(within(tile).getByText(nf(D.promiseTotals.total))).toBeInTheDocument();
    fireEvent.click(within(tile).getByRole("button", { name: localized.text12 }));
    fireEvent.click(within(tile).getByRole("button", { name: labelText.text177 }));
    expect(onOpen.mock.calls).toEqual([["promises"], ["promises", "mosaic"]]);
    expect(
      within(screen.getByTestId("kind-glossary")).getByTitle(localized.text15),
    ).toBeInTheDocument();
  });

  it("loads as skeleton tiles with unmeasured figures", () => {
    render(<ContentsHub state="loading" kinds={[]} />);
    expect(screen.getByTestId("contents-hub")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("heading", { name: localized.text16 })).toBeInTheDocument();
  });
});

describe("PromisesPage", () => {
  const base = {
    totals: D.promiseTotals,
    records: D.promiseRecords,
    page: 1,
    pageSize: 25,
    total: D.promiseItems.length,
    query: "",
    facets: [{ key: "open", label: localized.text18 }],
  };

  it("lists promises and selects one into the Given/When/Then reader", () => {
    const onSelect = jest.fn();
    const onOpenRecord = jest.fn();
    const sel = D.promiseItems.find((i) => i.tests.length) ?? D.promiseItems[0];
    render(
      <PromisesPage
        {...base}
        view="list"
        items={D.promiseItems.slice(0, 25)}
        selected={sel}
        onSelect={onSelect}
        onOpenRecord={onOpenRecord}
      />,
    );
    fireEvent.click(
      within(screen.getByRole("list", { name: localized.text19 })).getAllByRole("button")[1],
    );
    expect(onSelect).toHaveBeenCalledWith(D.promiseItems[1].key);
    const detail = screen.getByTestId("promise-detail");
    expect(within(detail).getByText(labelText.text178)).toBeInTheDocument();
    fireEvent.click(within(detail).getByRole("button", { name: germanLabels.text88 }));
    expect(onOpenRecord).toHaveBeenCalledWith(sel.recordId);
    expect(screen.getByRole("heading", { name: localized.text20 })).toBeInTheDocument();
  });

  it("draws one mosaic field per scenario and opens the record", () => {
    const onOpenRecord = jest.fn();
    render(<PromisesPage {...base} view="mosaic" items={[]} onOpenRecord={onOpenRecord} />);
    const mosaic = screen.getByTestId("promise-mosaic");
    const first = within(mosaic).getAllByRole("button")[0];
    fireEvent.click(first);
    expect(onOpenRecord).toHaveBeenCalledWith(D.promiseRecords[0].id);
  });

  it("puts open promises first, grouped by record, and shows the reader as a sheet on mobile", () => {
    const onSelect = jest.fn();
    const item = { ...D.openPromises[0], state: "deviation" as const, tests: [] };
    render(
      <PromisesPage
        {...base}
        view={"open"}
        mobile
        items={[item, ...D.openPromises.slice(1, 5)]}
        selected={item}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByTestId("promise-open-first")).toBeInTheDocument();
    expect(screen.getAllByText(labelText.text179).length).toBeGreaterThan(0);
    const sheet = screen.getByRole("dialog", { name: germanLabels.text23 });
    expect(within(sheet).getByText(localized.text22)).toBeInTheDocument();
    fireEvent.click(within(sheet).getByRole("button", { name: localized.text23 }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("offers nearest records when the filter finds nothing", () => {
    const onReset = jest.fn();
    const onOpenRecord = jest.fn();
    render(
      <PromisesPage
        {...base}
        totals={{ ...D.promiseTotals, open: 0 }}
        view="list"
        state="filtered-empty"
        query="xyz"
        items={[]}
        suggestions={["a/b/c"]}
        onReset={onReset}
        onOpenRecord={onOpenRecord}
      />,
    );
    expect(screen.getByText(localized.text24)).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByTestId("promise-suggestions")).getByRole("button", { name: "c" }),
    );
    fireEvent.click(screen.getByRole("button", { name: localized.text25 }));
    expect(onOpenRecord).toHaveBeenCalledWith("a/b/c");
    expect(onReset).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: localized.text26 })).toBeInTheDocument();
  });
});

describe("KnowledgePage", () => {
  const props = {
    slots: D.KNOW_SLOTS,
    rows: D.knowledgeRows.slice(0, 10),
    totals: D.knowledgeTotals,
    openPerSlot: D.knowledgeOpenPerSlot,
    page: 1,
    pageSize: 10,
    total: D.knowledgeRows.length,
  };

  it("shows the matrix and lets an open slot be answered", () => {
    const onAnswer = jest.fn();
    render(<KnowledgePage {...props} view="matrix" onAnswer={onAnswer} />);
    const matrix = screen.getByTestId("knowledge-matrix");
    expect(within(matrix).getAllByRole("columnheader")).toHaveLength(6);
    const open = within(matrix).getAllByRole("button", { name: labelText.text180 })[0];
    fireEvent.click(open);
    expect(onAnswer).toHaveBeenCalled();
  });

  it("lists open questions per slot and switches slots", () => {
    const onSlot = jest.fn();
    const onAnswer = jest.fn();
    render(
      <KnowledgePage
        {...props}
        rows={D.knowledgeRows}
        view={"open"}
        slot={0}
        onSlot={onSlot}
        onAnswer={onAnswer}
        totals={{ ...props.totals, open: 0 }}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: labelText.text181 }));
    expect(onSlot).toHaveBeenCalledWith(2);
    const answer = screen.getAllByRole("button", { name: labelText.text182 });
    expect(answer.length).toBe(D.knowledgeRows.filter((r) => r.slots[0] == null).length);
    fireEvent.click(answer[0]);
    expect(onAnswer.mock.calls[0][1]).toBe(0);
  });
});

describe("OperationsPage and ProvenancePage", () => {
  it("groups observation entries by record and shows the empty step", () => {
    const onLearn = jest.fn();
    const { rerender } = render(
      <OperationsPage state="ready" entries={D.opsEntries} records={219} />,
    );
    expect(screen.getByText("p95 ≤ 400 ms")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: localized.text28 })).toBeInTheDocument();
    rerender(
      <OperationsPage
        state="ready"
        entries={[...D.opsEntries, { ...D.opsEntries[0], key: "z", recordId: "x/y/z" }]}
        records={219}
      />,
    );
    expect(screen.getByRole("heading", { name: /2 Records tragen/ })).toBeInTheDocument();
    rerender(<OperationsPage state="empty" entries={[]} records={219} onLearn={onLearn} />);
    fireEvent.click(screen.getByRole("button", { name: remainingText.text121 }));
    expect(onLearn).toHaveBeenCalled();
  });

  it("shows teams and the creation calendar with a picked day", () => {
    const onPickDay = jest.fn();
    const onTeam = jest.fn();
    const props = {
      teams: D.provenanceTeams,
      unowned: 3,
      days: D.provenanceDays,
      range: D.provenanceRange,
      months: D.provenanceMonths,
      undated: 1,
    };
    const { rerender } = render(<ProvenancePage {...props} view="team" onTeam={onTeam} />);
    fireEvent.click(screen.getByRole("button", { name: D.provenanceTeams[0].name }));
    expect(onTeam).toHaveBeenCalledWith(D.provenanceTeams[0].id);
    expect(screen.getByText(localized.text29)).toBeInTheDocument();
    const big = {
      date: "2026-08-01",
      count: 20,
      ids: Array.from({ length: 20 }, (_, i) => `a/b/r${i}`),
    };
    rerender(
      <ProvenancePage
        {...props}
        unowned={0}
        view="calendar"
        selectedDay={big}
        onPickDay={onPickDay}
      />,
    );
    expect(
      within(screen.getByTestId("provenance-day")).getByText("20 Records angelegt"),
    ).toBeInTheDocument();
    expect(screen.getByText(labelText.text183)).toBeInTheDocument();
    rerender(<ProvenancePage {...props} view="calendar" selectedDay={null} />);
    expect(
      within(screen.getByTestId("provenance-day")).getByText(remainingText.text122),
    ).toBeInTheDocument();
  });
});

describe("TaxonomyPage and CalibrationPage", () => {
  it("expands a domain in the tree and selects a capability", () => {
    const onToggle = jest.fn();
    const onSelect = jest.fn();
    render(
      <TaxonomyPage
        view="tree"
        domains={D.taxonomy}
        expanded={[D.taxonomy[0].id]}
        selected={D.taxonomy[0].capabilities[0].id}
        onToggle={onToggle}
        onSelect={onSelect}
      />,
    );
    const tree = screen.getByRole("tree", { name: labelText.text184 });
    fireEvent.click(
      within(tree).getByRole("button", { name: `${D.taxonomy[1].title}${labelText.text185}` }),
    );
    expect(onToggle).toHaveBeenCalledWith(D.taxonomy[1].id);
    fireEvent.click(
      within(tree).getByRole("button", { name: `${D.taxonomy[0].title}${labelText.text186}` }),
    );
    fireEvent.click(within(tree).getByText(D.taxonomy[0].capabilities[0].title));
    expect(onSelect).toHaveBeenCalledWith(D.taxonomy[0].capabilities[0].id);
  });

  it("draws the sunburst with a detail for a domain or a capability", () => {
    const onOpen = jest.fn();
    const empty = [
      {
        ...D.taxonomy[0],
        capabilities: [{ id: "x/y", title: labelText.text18, records: 0, proven: 0, scenarios: 0 }],
      },
    ];
    const { rerender } = render(
      <TaxonomyPage
        view="sunburst"
        domains={D.taxonomy}
        expanded={[]}
        selected={D.taxonomy[0].id}
        onOpenOverview={onOpen}
      />,
    );
    fireEvent.click(
      within(screen.getByTestId("taxonomy-detail")).getByRole("button", {
        name: localized.text30,
      }),
    );
    expect(onOpen).toHaveBeenCalledWith(D.taxonomy[0].id);
    rerender(<TaxonomyPage view="sunburst" mobile domains={empty} expanded={[]} selected="x/y" />);
    expect(
      within(screen.getByTestId("taxonomy-detail")).getByText(localized.text31),
    ).toBeInTheDocument();
    rerender(<TaxonomyPage view="sunburst" domains={empty} expanded={[]} />);
    expect(screen.getByText(localized.text32)).toBeInTheDocument();
  });

  it("draws one band per metric and jumps to the outliers", () => {
    const onMetric = jest.fn();
    const onView = jest.fn();
    render(
      <CalibrationPage
        view="bands"
        metrics={D.calibration}
        outliers={D.outliers}
        onMetric={onMetric}
        onView={onView}
      />,
    );
    expect(screen.getAllByRole("img").length).toBe(D.calibration.length);
    fireEvent.click(screen.getAllByRole("button", { name: /darunter/ })[0]);
    expect(onMetric).toHaveBeenCalledWith(D.calibration[0].key);
    expect(onView).toHaveBeenCalledWith("outliers");
  });

  it("lists outliers of the chosen metric", () => {
    const onOpen = jest.fn();
    const off = { ...D.calibration[0], median: 50 };
    const { rerender } = render(
      <CalibrationPage
        view="outliers"
        metrics={[off, ...D.calibration.slice(1)]}
        outliers={D.outliers}
        onOpenRecord={onOpen}
      />,
    );
    const table = screen.getByRole("table", { name: localized.text33 });
    fireEvent.click(within(table).getAllByRole("row")[1]);
    expect(onOpen).toHaveBeenCalledWith(D.outliers[0].id);
    rerender(
      <CalibrationPage
        view="outliers"
        metrics={D.calibration}
        outliers={[]}
        metric={D.calibration[2].key}
      />,
    );
    expect(screen.getByText(localized.text34)).toBeInTheDocument();
  });
});

describe("Evidence pages", () => {
  const testProps = {
    kinds: D.testKinds,
    runners: D.testRunners,
    files: D.testFiles.slice(0, 30),
    page: 3,
    pageSize: 25,
    total: D.testFiles.length,
  };

  it("shows the pyramid with runners, the file tree and the sortable table", () => {
    const onKind = jest.fn();
    const onToggle = jest.fn();
    const onSort = jest.fn();
    const onOpenFile = jest.fn();
    const dir = D.testFiles[0].path.split("/").slice(0, -1).join("/");
    const { rerender } = render(
      <TestsPage {...testProps} view="pyramid" kind="Unit" onKind={onKind} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^E2E/ }));
    expect(onKind).toHaveBeenCalledWith("E2E");
    expect(screen.getByText(D.testRunners[0].id)).toBeInTheDocument();
    rerender(
      <TestsPage
        {...testProps}
        view="tree"
        expanded={[dir]}
        onToggle={onToggle}
        onOpenFile={onOpenFile}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${dir}/`) }));
    expect(onToggle).toHaveBeenCalledWith(dir);
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(D.testFiles[0].path.split("/").pop() as string),
      }),
    );
    expect(onOpenFile).toHaveBeenCalledWith(D.testFiles[0].path);
    rerender(
      <TestsPage
        {...testProps}
        view="table"
        sort={{ key: "promises", dir: "desc" }}
        onSort={onSort}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: localized.text35 }));
    expect(onSort).toHaveBeenCalledWith("promises");
    expect(screen.getByRole("button", { name: labelText.text23 })).toHaveAttribute(
      "aria-current",
      "page",
    );
    rerender(<TestsPage {...testProps} kinds={[]} files={[]} view="pyramid" />);
    expect(screen.getByRole("heading", { name: /0 Tests/ })).toBeInTheDocument();
  });

  it("protocols deviations, confirmed or not, and says when there are none", () => {
    const { rerender } = render(
      <DeviationsPage state="ready" items={D.deviations} promises={100} />,
    );
    expect(screen.getByText(localized.text36)).toBeInTheDocument();
    expect(screen.getByText(D.deviations[0].then)).toBeInTheDocument();
    rerender(<DeviationsPage state="empty" items={[]} promises={100} />);
    expect(screen.getByRole("heading", { name: localized.text37 })).toBeInTheDocument();
  });

  it("groups drift by record and along time", () => {
    const onReview = jest.fn();
    const items = [
      { recordId: "a/b/c", path: "x/y.go", changedAt: "2026-11-12T10:00:00Z" },
      { recordId: "a/b/c", path: "x/z.go", changedAt: "2026-11-11T10:00:00Z" },
      { recordId: "a/b/d", path: "q.go", changedAt: "2026-11-01T10:00:00Z" },
    ];
    const { rerender } = render(
      <DriftPage
        view="record"
        state="ready"
        items={items}
        now="2026-11-12T12:00:00Z"
        onReview={onReview}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: labelText.text187 })[0]);
    expect(onReview).toHaveBeenCalledWith("a/b/c");
    expect(screen.getByText(labelText.extra18)).toBeInTheDocument();
    rerender(<DriftPage view="time" state="ready" items={items} now="2026-11-12T12:00:00Z" />);
    expect(
      within(screen.getByTestId("drift-timeline")).getAllByRole("listitem").length,
    ).toBeGreaterThan(3);
    rerender(<DriftPage view="record" state="empty" items={[]} now="2026-11-12T12:00:00Z" />);
    expect(screen.getByText(localized.text38)).toBeInTheDocument();
    const t = germanText();
    expect(ageWord(ageDays("2026-11-12", "2026-11-12"), t)).toBe(labelText.extra10);
    expect(ageWord(1, t)).toBe(labelText.extra18);
    expect(ageWord(4, t)).toBe(labelText.text188);
  });

  it("draws the drift mark beside the figure when the record total is known", () => {
    const items = [
      { recordId: "a/b/c", path: "x/y.go", changedAt: "2026-11-12T10:00:00Z" },
      { recordId: "a/b/d", path: "q.go", changedAt: "2026-11-01T10:00:00Z" },
    ];
    const now = "2026-11-12T12:00:00Z";
    const { rerender } = render(
      <DriftPage view="record" state="ready" items={items} now={now} recordTotal={8} />,
    );
    expect(screen.getByRole("img", { name: localized.text39 })).toHaveAttribute("data-offset", "6");
    rerender(<DriftPage view="record" state="empty" items={[]} now={now} recordTotal={8} />);
    expect(screen.getByRole("img", { name: localized.text40 })).toHaveAttribute("data-offset", "0");
    rerender(<DriftPage view="record" state="ready" items={items} now={now} />);
    expect(screen.queryByTestId("logo-mark")).toBeNull();
  });

  it("shows fixes along time and by domain", () => {
    const onDomain = jest.fn();
    const onOpenRecord = jest.fn();
    const many = {
      ...D.fixes[0],
      sha: "zzz",
      records: ["a/b/1", "a/b/2", "a/b/3", "a/b/4"],
      scope: null,
    };
    const { rerender } = render(
      <FixedPage view="time" commits={[many, ...D.fixes]} onOpenRecord={onOpenRecord} />,
    );
    expect(screen.getAllByText("+1").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    expect(onOpenRecord).toHaveBeenCalledWith("a/b/1");
    rerender(<FixedPage view={"area"} commits={D.fixes} onDomain={onDomain} />);
    fireEvent.click(
      within(screen.getByRole("list", { name: localized.text42 })).getAllByRole("button")[0],
    );
    expect(onDomain).toHaveBeenCalled();
    rerender(<FixedPage view="time" commits={[]} />);
    expect(screen.getByText(labelText.text189)).toBeInTheDocument();
  });
});

describe("Code pages", () => {
  const anchorProps = {
    dirs: D.anchorDirs,
    roles: D.anchorRoles,
    rows: D.anchorRows.slice(0, 20),
    page: 1,
    pageSize: 20,
    total: D.anchorRows.length,
    query: "",
  };

  it("maps directories by anchor count and shows the picked one", () => {
    const onDir = jest.fn();
    const onRole = jest.fn();
    const { rerender } = render(
      <AnchorsPage
        {...anchorProps}
        view="treemap"
        selectedDir={D.anchorDirs[0].path}
        onDir={onDir}
        onRole={onRole}
      />,
    );
    expect(
      within(screen.getByTestId("anchor-dir")).getByText(`${D.anchorDirs[0].path}/`),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: `${D.anchorDirs[1].path}: ${D.anchorDirs[1].anchors}` }),
    );
    expect(onDir).toHaveBeenCalledWith(D.anchorDirs[1].path);
    fireEvent.click(screen.getByRole("button", { name: /^primary:/ }));
    expect(onRole).toHaveBeenCalledWith("primary");
    rerender(<AnchorsPage {...anchorProps} view="treemap" mobile />);
    expect(screen.queryByTestId("anchor-dir")).not.toBeInTheDocument();
  });

  it("lists anchors in a sortable table", () => {
    const onSort = jest.fn();
    render(
      <AnchorsPage
        {...anchorProps}
        view="table"
        sort={{ key: "path", dir: "asc" }}
        onSort={onSort}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: labelText.text190 }));
    expect(onSort).toHaveBeenCalledWith("role");
    expect(
      within(screen.getByRole("table", { name: germanLabels.text18 })).getAllByRole("row"),
    ).toHaveLength(21);
  });

  it("shows the coverage tree with unmeasured shares and the largest gaps", () => {
    const onToggle = jest.fn();
    const onOpenFile = jest.fn();
    const { rerender } = render(
      <FilesPage
        view="tree"
        scan={D.fileScan}
        tree={D.fileTree}
        expanded={[D.fileTree[0].path]}
        gaps={D.fileGaps}
        onToggle={onToggle}
      />,
    );
    const tree = screen.getByTestId("files-tree");
    fireEvent.click(within(tree).getAllByRole("button")[0]);
    expect(onToggle).toHaveBeenCalledWith(D.fileTree[0].path);
    expect(within(tree).getAllByTitle(localized.text43).length).toBeGreaterThan(0);
    rerender(
      <FilesPage
        view="gaps"
        scan={D.fileScan}
        tree={[]}
        expanded={[]}
        gaps={D.fileGaps}
        onOpenFile={onOpenFile}
      />,
    );
    fireEvent.click(within(screen.getByTestId("files-gaps")).getAllByRole("button")[0]);
    expect(onOpenFile).toHaveBeenCalledWith(D.fileGaps[0].path);
    rerender(
      <FilesPage
        view="gaps"
        scan={{ files: 0, anchored: 0, unanchored: 0, loc: 0 }}
        tree={[]}
        expanded={[]}
        gaps={[]}
      />,
    );
    expect(screen.getByRole("heading", { name: localized.text44 })).toBeInTheDocument();
  });

  it("ranks a gap of unmeasured size last and names it as not measured", () => {
    const gap = (path: string, loc: number | null) => ({
      path,
      loc,
      dir: "src",
      dirAnchoredPct: 50,
    });
    render(
      <FilesPage
        view="gaps"
        scan={D.fileScan}
        tree={[]}
        expanded={[]}
        gaps={[gap("src/unmeasured.ts", null), gap("src/small.ts", 10), gap("src/large.ts", 900)]}
      />,
    );
    const rows = within(screen.getByTestId("files-gaps")).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("large.ts");
    expect(rows[1]).toHaveTextContent("small.ts");
    expect(rows[2]).toHaveTextContent("unmeasured.ts");
    const unmeasured = within(rows[2]).getByTestId("file-gap-loc-unmeasured");
    expect(unmeasured).toHaveTextContent(localized.text45);
    expect(within(rows[0]).getByText("900 Z.")).toBeInTheDocument();
  });

  it("lists rules with their records and offers the first one when empty", () => {
    const onSelect = jest.fn();
    const onCreate = jest.fn();
    const { rerender } = render(
      <RulesPage
        state="ready"
        items={D.rules}
        records={219}
        selected={D.rules[0].id}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: D.rules[1].title }));
    expect(onSelect).toHaveBeenCalledWith(D.rules[1].id);
    expect(screen.getAllByText(labelText.extra19).length).toBeGreaterThan(0);
    rerender(
      <RulesPage state="ready" items={D.rules.filter((r) => !r.violations)} records={219} />,
    );
    expect(screen.getByText(localized.text46)).toBeInTheDocument();
    rerender(<RulesPage state="empty" items={[]} records={219} onCreate={onCreate} />);
    fireEvent.click(screen.getByRole("button", { name: remainingText.text123 }));
    expect(onCreate).toHaveBeenCalled();

    expect(screen.queryByRole("button", { name: remainingText.text124 })).not.toBeInTheDocument();
  });
});

describe("GlossaryPage", () => {
  const terms = D.glossary40;
  const base = {
    terms,
    letters: D.lettersOf(terms),
    query: "",
    page: 1,
    pageSize: 50,
    total: terms.length,
    categories: D.glossaryCategories,
  };

  it("groups terms A–Z and filters by letter and category", () => {
    const onLetter = jest.fn();
    const onCategory = jest.fn();
    const onOpen = jest.fn();
    render(
      <GlossaryPage
        {...base}
        state="ready"
        letter="A"
        onLetter={onLetter}
        onCategory={onCategory}
        onOpen={onOpen}
      />,
    );
    expect(screen.getByRole("button", { name: "Q: 0 Begriffe" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^A: / }));
    expect(onLetter).toHaveBeenCalledWith(null);
    fireEvent.click(screen.getByRole("button", { name: /^B: / }));
    expect(onLetter).toHaveBeenCalledWith("B");
    fireEvent.click(screen.getByRole("button", { name: localized.text47 }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text8 }));
    expect(onCategory.mock.calls).toEqual([[localized.text48], [null]]);
    fireEvent.click(
      within(screen.getByRole("region", { name: "Buchstabe A" })).getAllByRole("button")[0],
    );
    expect(onOpen).toHaveBeenCalled();
  });

  it("opens a term with records, occurrences and history", () => {
    const onClose = jest.fn();
    const onOpen = jest.fn();
    render(
      <GlossaryPage
        {...base}
        state="ready"
        mode="term"
        detail={D.termDetail}
        onClose={onClose}
        onOpen={onOpen}
      />,
    );
    const detail = screen.getByTestId("term-detail");
    expect(within(detail).getByRole("heading", { name: germanLabels.text4 })).toBeInTheDocument();
    fireEvent.click(within(detail).getByRole("button", { name: germanLabels.text18 }));
    expect(onOpen).toHaveBeenCalledWith(germanLabels.text18);
    fireEvent.click(within(detail).getByRole("button", { name: localized.text49 }));
    expect(onClose).toHaveBeenCalled();
  });

  it("validates a proposal and submits it", () => {
    const onSubmit = jest.fn();
    const onChange = jest.fn();
    const values = {
      term: "Record",
      definition: labelText.text191,
      category: "",
      aliases: "",
      records: ["a/b/c"],
    };
    const t = germanText();
    const errors = validateProposal(values, ["record"], t);
    expect(errors).toEqual({
      term: germanLabels.text89,
      definition: expect.any(String),
      category: expect.any(String),
    });
    expect(
      validateProposal({ ...values, term: " ", definition: "x".repeat(300), category: "a" }, [], t),
    ).toEqual({ term: localized.text50, definition: localized.text51 });
    expect(
      validateProposal(
        { ...values, term: labelText.text124, definition: "x".repeat(30), category: "a" },
        [],
        t,
      ),
    ).toEqual({});
    const proposal: ProposalState = {
      values,
      errors: { ...errors, records: localized.text52 },
      status: "failed",
      failure: "Zweig existiert schon.",
    };
    render(
      <GlossaryPage
        {...base}
        state="ready"
        mode="propose"
        proposal={proposal}
        onSubmit={onSubmit}
        onProposalChange={onChange}
      />,
    );
    const form = screen.getByRole("form", { name: germanLabels.text39 });
    expect(within(form).getByText(germanLabels.text89)).toBeInTheDocument();
    expect(within(form).getByRole("alert")).toHaveTextContent("Zweig existiert schon.");
    fireEvent.change(within(form).getByLabelText(germanLabels.text90), {
      target: { value: labelText.text124 },
    });
    fireEvent.change(within(form).getByLabelText("Definition"), {
      target: { value: "lang genug" },
    });
    fireEvent.change(within(form).getByLabelText(localized.text53), {
      target: { value: localized.text54 },
    });
    fireEvent.change(within(form).getByLabelText(labelText.text192), { target: { value: "a, b" } });
    fireEvent.click(within(form).getByRole("button", { name: germanLabels.text6 }));
    expect(onChange.mock.calls.map((c) => Object.keys(c[0])[0])).toEqual([
      "term",
      "definition",
      "category",
      "aliases",
      "records",
    ]);
    fireEvent.click(within(form).getByRole("button", { name: labelText.text193 }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("disables the form while sending and reports the pull request once sent", () => {
    const values = {
      term: labelText.text124,
      definition: "x".repeat(30),
      category: "a",
      aliases: "",
      records: [],
    };
    const { rerender } = render(
      <GlossaryPage
        {...base}
        state="ready"
        mode="propose"
        mobile
        proposal={{ values, errors: {}, status: "sending" }}
      />,
    );
    expect(screen.getByRole("button", { name: localized.text55 })).toBeDisabled();
    expect(screen.getByText(localized.text56)).toBeInTheDocument();
    rerender(
      <GlossaryPage
        {...base}
        state="ready"
        proposal={{
          values,
          errors: {},
          status: "sent",
          result: { branch: "glossary/new", pr: "PR #1" },
        }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("PR #1");
    const onClose = jest.fn();
    rerender(
      <GlossaryPage
        {...base}
        state="ready"
        mode="term"
        mobile
        detail={D.termDetail}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "‹ Glossar" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("paginates many terms and has empty and loading forms", () => {
    const onPage = jest.fn();
    const onPropose = jest.fn();
    const many: GlossaryTerm[] = D.glossary300;
    const { rerender } = render(
      <GlossaryPage
        {...base}
        terms={many.slice(0, 25)}
        total={300}
        pageSize={25}
        letters={D.lettersOf(many)}
        state="ready"
        onPage={onPage}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: labelText.text194 }));
    expect(onPage).toHaveBeenCalledWith(12);
    expect(screen.getByText(remainingText.text125)).toBeInTheDocument();
    rerender(<GlossaryPage {...base} terms={[]} total={0} state="empty" onPropose={onPropose} />);
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text40 }));
    expect(onPropose).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: germanLabels.text39 })).not.toBeInTheDocument();
    rerender(<GlossaryPage {...base} state="loading" />);
    expect(screen.getByRole("heading", { name: /gelesen/ })).toBeInTheDocument();
  });
});

describe("story kit", () => {
  it("renders a page inside the screen frame for desktop and mobile", () => {
    const d = desk("contents", "State", (m) => <p>{m ? "mobile" : "desktop"}</p>);
    const m = mob("contents", "State", (x) => <p>{x ? "mobile" : "desktop"}</p>);
    expect(m.name).toBe("State · Mobile");
    render(
      <>
        {d.render()}
        {m.render()}
      </>,
    );
    expect(screen.getByText("desktop")).toBeInTheDocument();
    expect(screen.getByText("mobile")).toBeInTheDocument();
  });
});

void noop;

describe("review fixes", () => {
  it("renders inline Markdown as code and never shows backticks", () => {
    const { container } = render(
      <p>
        <InlineMd text={localized.text60} />
      </p>,
    );
    expect(container.querySelector("code")?.textContent).toBe("@facet:");
    expect(container.textContent).toBe(localized.text61);
    expect(stripMd("a `b` *c*")).toBe("a b c");
  });

  it("labels scenario steps in German Gherkin", () => {
    render(<Gwt text={"Given a\nWhen b\nThen c"} />);
    for (const k of [labelText.text195, localized.text62, labelText.text178])
      expect(screen.getByText(k)).toBeInTheDocument();
    expect(screen.queryByText("Given")).not.toBeInTheDocument();
  });

  it("gives every glossary term its own definition and no letter-suffixed filler", () => {
    const defs = D.glossary300.map((t) => t.definition);
    expect(new Set(defs).size).toBe(defs.length);
    expect(D.glossary300.some((t) => / [A-Z]$/.test(t.term))).toBe(false);
  });

  it("takes promise totals from the summary and says when the list is a subset", () => {
    expect(D.promiseTotals.total).toBe(SUMMARY.scenarios);
    expect(D.promiseTotals.open).toBe(SUMMARY.open);
    expect(D.promiseTotals.listedOpen).toBeLessThanOrEqual(SUMMARY.open);
    render(
      <PromisesPage
        view="list"
        totals={D.promiseTotals}
        items={D.promiseItems.slice(0, 3)}
        records={[]}
        page={1}
        pageSize={3}
        total={D.promiseTotals.listed}
        query=""
        facets={[]}
      />,
    );
    expect(
      screen.getByText(`${SUMMARY.provenPct}${labelText.text196}`, { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("promise-subset")).toHaveTextContent(nf(D.promiseTotals.listed));
  });

  it("offers a next step in the empty deviation and drift states", () => {
    const onOpenPromises = jest.fn();
    const onRecheck = jest.fn();
    const { rerender } = render(
      <DeviationsPage state="empty" items={[]} promises={1} onOpenPromises={onOpenPromises} />,
    );
    fireEvent.click(screen.getByRole("button", { name: localized.text63 }));
    expect(onOpenPromises).toHaveBeenCalled();
    rerender(
      <DriftPage
        view="record"
        state="empty"
        items={[]}
        now="2026-11-12T12:00:00Z"
        onRecheck={onRecheck}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: labelText.text197 }));
    expect(onRecheck).toHaveBeenCalled();
  });

  it("colours each sunburst domain differently and labels arcs that fit", () => {
    const { container } = render(
      <Sunburst
        label="S"
        size={400}
        nodes={[
          {
            key: "a",
            label: "Alpha",
            value: 3,
            children: [{ key: "a1", label: labelText.text26, value: 3 }],
          },
          { key: "b", label: "Beta", value: 3 },
        ]}
      />,
    );
    const fills = [...container.querySelectorAll("path")].map((p) => p.getAttribute("fill"));
    expect(fills[0]).not.toBe(fills[2]);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText(labelText.text26)).toBeInTheDocument();
  });

  it("never sets two month labels into the same weeks of the calendar", () => {
    const { container } = render(
      <CalendarHeatmap label="K" days={[]} from="2026-07-26" to="2026-09-10" />,
    );
    const months = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(months).not.toContain("Jul");
    expect(months).toContain("Aug");
    const wide = render(<CalendarHeatmap label="K2" days={[]} from="2026-07-02" to="2026-08-20" />);
    expect([...wide.container.querySelectorAll("text")].map((t) => t.textContent)).toContain("Jul");
  });

  it("frames tablet stories", () => {
    const story = tab("contents", "X", () => <p>{localized.text64}</p>);
    expect(story.name).toBe("X · Tablet");
    expect(story.globals.viewport.value).toBe("tablet");
    render(<>{story.render()}</>);
    expect(screen.getByText(localized.text65)).toBeInTheDocument();
  });
});

describe("English", () => {
  it("renders the hub and the promises page in English without a provider", () => {
    const { unmount } = renderInEnglish(
      <ContentsHub state="ready" kinds={D.contentKinds} headline={D.hubHeadline} />,
    );
    expect(screen.getByRole("region", { name: "Evidence" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Context" })).toBeInTheDocument();
    expect(
      within(screen.getByTestId("kind-glossary")).getByTitle("not measured"),
    ).toBeInTheDocument();
    unmount();

    const sel = D.promiseItems.find((i) => i.tests.length) ?? D.promiseItems[0];
    renderInEnglish(
      <PromisesPage
        totals={D.promiseTotals}
        records={D.promiseRecords}
        page={1}
        pageSize={25}
        total={D.promiseItems.length}
        query=""
        facets={[]}
        view="list"
        items={D.promiseItems.slice(0, 25)}
        selected={sel}
      />,
    );
    expect(screen.getByRole("list", { name: "Promises" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /promises are not yet carried by a test/ }),
    ).toBeInTheDocument();
    const detail = screen.getByTestId("promise-detail");
    expect(within(detail).getByText("Given")).toBeInTheDocument();
    expect(within(detail).getByText("Then")).toBeInTheDocument();
    expect(within(detail).getByRole("button", { name: /^Record / })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Open first/ })).toBeInTheDocument();
  });

  it("speaks English ages and formats figures with English separators", () => {
    renderInEnglish(
      <DriftPage view="record" state="empty" items={[]} now="2026-11-12T12:00:00Z" />,
    );
    expect(screen.getByText("No drift")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare again" })).toBeInTheDocument();
    const { result } = renderHook(() => useText());
    expect(ageWord(0, result.current.t)).toBe("today");
    expect(ageWord(3, result.current.t)).toBe("3 days ago");
    renderInEnglish(<MiniStat label="x" value={12345} />);
    expect(screen.getByText("12,345")).toBeInTheDocument();
  });
});

describe("unmeasured scan, rule and deviation facts", () => {
  it("shows unmeasured scan numbers as dashes and keeps the anchored count", () => {
    renderInEnglish(
      <FilesPage
        view="gaps"
        scan={{ files: null, anchored: 12, unanchored: null, loc: null }}
        tree={[]}
        expanded={[]}
        gaps={[]}
      />,
    );
    const page = screen.getByTestId("files-page");
    expect(screen.getByTestId("files-total-unmeasured")).toHaveTextContent("—");
    expect(screen.getByTestId("files-total-unmeasured")).toHaveAttribute("title", "not measured");
    expect(page).toHaveTextContent("— files without an anchor · — lines read");
    expect(screen.getByRole("heading", { name: /— of the files read/ })).toBeInTheDocument();
    expect(page).not.toHaveTextContent("0 files without");
  });

  it("does not call unchecked rules kept, and leaves the violation sum open", () => {
    const items = D.rules.map((r, i) => ({ ...r, violations: i === 0 ? null : 0 }));
    renderInEnglish(<RulesPage state="ready" items={items} records={219} />);
    const page = screen.getByTestId("rules-page");
    expect(screen.getByTestId("rule-violations-unmeasured")).toHaveTextContent("— · not measured");
    expect(page).toHaveTextContent("Violations not measured.");
    expect(page).not.toHaveTextContent("No rule is violated.");
    const sum = within(page).getByText("Violations").closest("div");
    expect(sum).toHaveTextContent("—");
  });

  it("still names violations when another rule was not checked", () => {
    const items = D.rules.map((r, i) => ({ ...r, violations: i === 0 ? null : i === 1 ? 2 : 0 }));
    renderInEnglish(<RulesPage state="ready" items={items} records={219} />);
    expect(screen.getByTestId("rules-page")).toHaveTextContent("1 rules have violations.");
  });

  it("shows an unknown deviation date as a dash", () => {
    renderInEnglish(
      <DeviationsPage
        state="ready"
        items={[{ ...D.deviations[0], since: null }, D.deviations[1]]}
        promises={100}
      />,
    );
    const since = screen.getByTestId("deviation-since-unmeasured");
    expect(since).toHaveTextContent("since —");
    expect(since).toHaveAttribute("title", "not measured");
    expect(screen.getByText(`since ${D.deviations[1].since}`)).toBeInTheDocument();
  });
});

describe("answer cards, fix details, pins and the calibration statement", () => {
  const kprops = {
    slots: D.KNOW_SLOTS,
    rows: D.knowledgeRows.slice(0, 10),
    totals: D.knowledgeTotals,
    openPerSlot: D.knowledgeOpenPerSlot,
    page: 1,
    pageSize: 10,
    total: D.knowledgeRows.length,
  };

  it("opens a filled matrix answer as a card with its question and whole answer, and Esc closes it", () => {
    const row = kprops.rows.find((r) => r.slots[0] != null)!;
    const whole = `${row.slots[0]} — and the rest of the answer the matrix does not show.`;
    const rows = kprops.rows.map((r) =>
      r === row ? { ...r, answers: [whole, ...r.slots.slice(1)] } : r,
    );
    const onOpenRecord = jest.fn();
    render(
      <KnowledgePage
        {...kprops}
        rows={rows}
        questions={[remainingText.text126, "b", "c", "d", "e"]}
        view="matrix"
        onOpenRecord={onOpenRecord}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const cell = screen.getByRole("button", {
      name: `${short(row.id)}: ${D.KNOW_SLOTS[0]}${remainingText.text127}`,
    });

    cell.focus();
    fireEvent.click(cell);
    const card = screen.getByRole("dialog", { name: `${D.KNOW_SLOTS[0]} · ${row.id}` });
    expect(within(card).getByRole("heading", { name: remainingText.text126 })).toBeVisible();
    expect(within(card).getByText(whole)).toBeInTheDocument();
    expect(within(card).getByText(row.id)).toBeInTheDocument();
    expect(card).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cell).toHaveFocus();

    fireEvent.click(cell);
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: localized.text66 }),
    );
    expect(onOpenRecord).toHaveBeenCalledWith(row.id);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("animates the card in, and not at all under reduced motion", () => {
    const css = readFileSync(join(__dirname, "..", "..", "styles", "screens-c.css"), "utf8");
    const row = kprops.rows.find((r) => r.slots[0] != null)!;
    render(<KnowledgePage {...kprops} view="matrix" />);
    fireEvent.click(
      screen.getByRole("button", {
        name: `${short(row.id)}: ${D.KNOW_SLOTS[0]}${remainingText.text127}`,
      }),
    );
    const card = screen.getByRole("dialog");
    expect(card).toHaveClass("t-c-dcard");
    const own = /\n\.t-c-dcard \{([^}]*)\}/.exec(css);
    expect(own?.[1]).toMatch(/animation: t-c-dcard-in /);
    const reduced = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/g)]
      .map((m) => m[1])
      .find((b) => b.includes(".t-c-dcard"));
    expect(reduced).toBeDefined();
    expect(reduced).toMatch(/\.t-c-dcard,\s*\.t-c-dcard-scrim \{\s*animation: none;/);
  });

  it("shows a fix by its short hash, copies the full one, and opens its details", () => {
    const sha = "32061fd166034ff1bf10125ed354d269c7cd8daf";
    const fix = {
      ...D.fixes[0],
      sha,
      subject: "facet lint honours the exclude file",
      files: ["packages/ui/share-plugin.go"],
      recordedBy: "git-history",
    };
    const unreported = { ...D.fixes[1], sha: "b2da4e67bf3200000000", files: null };
    const onCopy = jest.fn();
    render(<FixedPage view="time" commits={[fix, unreported]} onCopy={onCopy} />);
    const row = screen.getByTestId(`fix-${sha}`);
    expect(within(row).getByText("32061fd")).toHaveAttribute("title", sha);
    expect(within(row).queryByText(sha)).not.toBeInTheDocument();
    fireEvent.click(within(row).getByRole("button", { name: germanLabels.text91 }));
    expect(onCopy).toHaveBeenCalledWith(sha);

    fireEvent.click(within(row).getByRole("button", { name: /facet lint honours/ }));
    const card = screen.getByRole("dialog");
    expect(within(card).getByText(sha)).toBeInTheDocument();
    expect(within(card).getByText("packages/ui/share-plugin.go")).toBeInTheDocument();
    expect(within(card).getByText("git-history")).toBeInTheDocument();
    fireEvent.click(within(card).getByRole("button", { name: localized.text67 }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const other = screen.getByTestId(`fix-${unreported.sha}`);
    fireEvent.click(
      within(other).getByRole("button", { name: new RegExp(unreported.subject.slice(0, 12)) }),
    );
    const facts = within(screen.getByRole("dialog"));
    expect(facts.getByText(localized.text68).nextElementSibling).toHaveTextContent(
      localized.text69,
    );
  });

  it("pins and unpins a kind, and the glossary has no pin", () => {
    const onPin = jest.fn();
    render(
      <ContentsHub
        state="ready"
        kinds={D.contentKinds}
        headline={D.hubHeadline}
        pinned={["knowledge"]}
        onPin={onPin}
      />,
    );
    const knowledge = screen.getByTestId("pin-knowledge");
    expect(knowledge).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("pin-promises")).toHaveAttribute("aria-pressed", "false");
    expect(knowledge).toHaveAccessibleName(localized.text71);
    fireEvent.click(knowledge);
    fireEvent.click(screen.getByTestId("pin-promises"));
    expect(onPin.mock.calls).toEqual([
      ["knowledge", false],
      ["promises", true],
    ]);
    expect(screen.queryByTestId("pin-glossary")).not.toBeInTheDocument();
  });

  it("says under the calibration finding what a band and a median are", () => {
    render(<CalibrationPage view="bands" metrics={D.calibration} outliers={D.outliers} />);
    const lead = screen.getByRole("heading", { level: 1 }).nextElementSibling!;
    expect(lead).toHaveTextContent(localized.text74);
  });
});
