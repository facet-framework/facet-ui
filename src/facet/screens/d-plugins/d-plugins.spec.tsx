import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/facet/screens/d-plugins/d-plugins.spec.text";
import { render as renderInEnglish, screen, within, fireEvent } from "@testing-library/react";
import { renderInGerman as render } from "../../i18n/testing";
import userEvent from "@testing-library/user-event";
import {
  AdrCollection,
  AdrDirectorySetting,
  AdrEmpty,
  AdrNewForm,
  AdrReader,
  AdrStatusForm,
  BOARD_CAP,
} from "./Adr";
import { ProcessCanvas, ProcessCollection, ProcessUnreadable, ProcessWorkspace } from "./Processes";
import {
  ChatDock,
  ChatFull,
  ChatPill,
  ChatSignIn,
  ChatTurn,
  Composer,
  ReadingTrail,
  SourceCards,
  type ComposerProps,
} from "./Chat";
import { CommandPalette, Highlight } from "./Palette";
import { CountUp, CountUpBoard, FlightDemo, ReducedMotionDemo, StaggerDemo } from "./Motion";
import {
  Bars,
  Diff,
  Facts,
  Inline,
  KeyHints,
  Markdown,
  PluginHead,
  Steps,
  markdownHeadings,
  parseMarkdown,
  useLifecycleLabel,
} from "./shared";
import * as data from "./storyData";

const nf = (n: number) => new Intl.NumberFormat("de").format(n);

function LifecycleProbe({ values }: { values: string[] }) {
  const label = useLifecycleLabel();
  return (
    <ul>
      {values.map((v) => (
        <li key={v} data-testid={`lc-${v}`}>
          {label(v)}
        </li>
      ))}
    </ul>
  );
}

const ANSWER_SAMPLE = [
  localized.text1,
  "",
  labelText.text88,
  labelText.text89,
  "",
  remainingText.text87,
  "| --- | --- |",
  germanLabels.text41,
  "",
  "```sh",
  "FACET_STRICT_DEPS=1 sh tools/draft/schedule.sh",
  "```",
  "",
  localized.text2,
  "",
  labelText.text90,
  "",
  "- a",
  "- b",
  "",
  "---",
].join("\n");

const user = () => userEvent.setup();

describe("markdown", () => {
  it("parses every block kind the answers use", () => {
    const kinds = parseMarkdown(ANSWER_SAMPLE).map((b) => b.t);
    expect(kinds).toEqual(
      expect.arrayContaining(["p", "ol", "table", "code", "quote", "h", "ul", "hr"]),
    );
  });

  it("renders a table, a list and a code block with a working copy button", async () => {
    const onCopyCode = jest.fn();
    const onLink = jest.fn();
    render(
      <Markdown source={ANSWER_SAMPLE} onCopyCode={onCopyCode} onLink={onLink} copiedCode={0} />,
    );
    expect(screen.getByRole("table")).toHaveTextContent("lint_anchors.go");
    expect(screen.getByRole("heading", { name: labelText.text9 })).toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: remainingText.text11 }));
    expect(onCopyCode).toHaveBeenCalledWith(expect.stringContaining("FACET_STRICT_DEPS=1"));
    await user().click(screen.getByRole("link", { name: labelText.text91 }));
    expect(onLink).toHaveBeenCalledWith("atlas:record/x");
  });

  it("renders inline marks without callbacks", () => {
    render(
      <p>
        <Inline text={localized.text3} />
      </p>,
    );
    expect(screen.getByText(labelText.extra2).tagName).toBe("STRONG");
    expect(screen.getByText(localized.text4).tagName).toBe("EM");
    fireEvent.click(screen.getByRole("link", { name: "l" }));
    render(<Markdown source={"```\nplain\n```\n\n[a](b)"} />);
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text12 }));
    fireEvent.click(screen.getByRole("link", { name: "a" }));
  });

  it("draws the small pieces", () => {
    render(
      <>
        <PluginHead
          icon="book"
          title={labelText.text38}
          count="3"
          meta="m"
          sentence={germanLabels.text42}
          actions={<button>a</button>}
        />
        <Facts rows={[["k", "v"]]} />
        <Bars values={[1, 2, 0]} label={labelText.text92} tone="warn" />
        <KeyHints hints={[["↵", localized.text5]]} />
        <Diff label="Diff" lines={[{ kind: "add", text: "orphan anchor" }]} />
        <Steps
          label={labelText.text93}
          steps={[{ key: "upload", label: "Upload branch", state: "failed" }]}
        />
      </>,
    );
    expect(screen.getByRole("img", { name: labelText.text92 })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Diff" })).toHaveTextContent("orphan anchor");
    expect(screen.getByRole("list", { name: labelText.text93 })).toHaveTextContent("Upload branch");
  });
});

describe("Decisions", () => {
  const counts = data.adrCounts(data.adrs480);
  const base = { total: 480, counts, page: 2, pageSize: 60, query: "", directory: "docs/adr" };

  it("shows the table on page 2 of 8 and reacts to view, status and paging", async () => {
    const on = {
      onView: jest.fn(),
      onStatus: jest.fn(),
      onPage: jest.fn(),
      onOpen: jest.fn(),
      onCreate: jest.fn(),
      onSettings: jest.fn(),
      onQuery: jest.fn(),
    };
    render(
      <AdrCollection
        state="ready"
        view="table"
        items={data.adrs480.slice(60, 120)}
        {...base}
        {...on}
      />,
    );
    expect(screen.getByText(germanLabels.text43)).toBeInTheDocument();
    expect(screen.getByRole("table", { name: labelText.text65 })).toBeInTheDocument();
    await user().click(screen.getAllByRole("row")[1]);
    expect(on.onOpen).toHaveBeenCalledWith(data.adrs480[60].number);
    await user().click(screen.getByRole("button", { name: labelText.text23 }));
    expect(on.onPage).toHaveBeenCalledWith(3);
    await user().click(screen.getByRole("radio", { name: /Board/ }));
    expect(on.onView).toHaveBeenCalledWith("board");
    await user().click(
      screen.getByRole("button", { name: `${labelText.text94}${counts.proposed}` }),
    );
    expect(on.onStatus).toHaveBeenCalledWith("proposed");
    await user().click(screen.getByRole("button", { name: labelText.text81 }));
    await user().click(screen.getByRole("button", { name: labelText.text82 }));
    expect(on.onSettings).toHaveBeenCalled();
  });

  it("keeps each year of the timeline to its own dates, in the chosen direction, whatever the rows are sorted by", () => {
    const rows = data.sortAdrs(data.adrs480, "title", "asc").slice(0, 60);
    const byNumber = new Map(rows.map((a) => [a.number, a]));
    const timeline = (dir: "asc" | "desc") => {
      const { unmount } = render(
        <AdrCollection
          state="ready"
          view="timeline"
          items={rows}
          {...base}
          page={1}
          sort={{ key: "title", dir }}
        />,
      );
      const axis = screen.getByLabelText(labelText.text95);
      const groups = within(axis)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => {
          const year = heading.textContent!.slice(0, 4);
          const dates = within(heading.closest("section")!)
            .getAllByRole("listitem")
            .map((item) => {
              const number = Number(
                /^(\d{4})/.exec(within(item).getByRole("button").textContent!)![1],
              );
              const adr = byNumber.get(number)!;
              expect(within(item).getByText(adr.date.slice(5))).toBeInTheDocument();
              return adr.date;
            });
          return { year, dates };
        });
      unmount();
      return groups;
    };
    for (const dir of ["desc", "asc"] as const) {
      const groups = timeline(dir);
      const years = groups.map((g) => g.year);
      expect(new Set(years).size).toBe(years.length);
      expect(groups.reduce((n, g) => n + g.dates.length, 0)).toBe(rows.length);
      const all = groups.flatMap((g) => {
        for (const date of g.dates) expect(date.slice(0, 4)).toBe(g.year);
        return g.dates;
      });
      const ordered = [...all].sort();
      expect(all).toEqual(dir === "asc" ? ordered : ordered.reverse());
    }
  });

  it("numbers the story ADRs in the order of their dates", () => {
    const byNumber = [...data.adrs480].sort((a, b) => a.number - b.number);
    for (let i = 1; i < byNumber.length; i++)
      expect(byNumber[i].date >= byNumber[i - 1].date).toBe(true);
  });

  it("groups by year on the timeline and by status on the board", async () => {
    const onOpen = jest.fn();
    const { rerender } = render(
      <AdrCollection
        state="ready"
        view="timeline"
        items={data.adrs480.slice(0, 40)}
        {...base}
        page={1}
        onOpen={onOpen}
      />,
    );
    expect(screen.getByLabelText(labelText.text95)).toHaveTextContent(
      data.adrs480[0].date.slice(0, 4),
    );
    await user().click(within(screen.getByLabelText(labelText.text95)).getAllByRole("button")[0]);
    expect(onOpen).toHaveBeenCalledWith(data.adrs480[0].number);
    rerender(
      <AdrCollection
        state="ready"
        view="board"
        items={data.adrs480}
        {...base}
        activeStatus="accepted"
        onOpen={onOpen}
      />,
    );
    const col = screen.getByRole("region", { name: localized.text59 });
    expect(col).toHaveTextContent(labelText.text96);
    await user().click(within(col).getAllByRole("button")[0]);
    rerender(
      <AdrCollection
        state="ready"
        view="table"
        items={data.adrs480.slice(0, 3)}
        {...base}
        mobile
        onOpen={onOpen}
      />,
    );
    expect(screen.queryByRole("table", { name: labelText.text65 })).not.toBeInTheDocument();
    await user().click(screen.getAllByRole("button", { name: /ADR 0/ })[0]);
    rerender(<AdrCollection state="loading" view="board" items={[]} {...base} />);
    expect(screen.getByText(localized.text60)).toBeInTheDocument();
    rerender(
      <AdrCollection state="filtered-empty" view="timeline" items={[]} {...base} query="zzz" />,
    );
    expect(screen.getByText(localized.text61)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: localized.text62 }));
  });

  it("has an empty state with the next step", async () => {
    const on = { onCreate: jest.fn(), onSettings: jest.fn() };
    render(<AdrEmpty directory="docs/adr" {...on} />);
    expect(screen.getByText(localized.text63)).toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: remainingText.text86 }));
    await user().click(screen.getByRole("button", { name: labelText.text97 }));
    expect(on.onSettings).toHaveBeenCalled();
    render(<AdrEmpty directory="d" />);
  });

  it("reads a real ADR with its records and supersession", async () => {
    const d = data.adrDetail(1);
    const on = {
      onBack: jest.fn(),
      onOpenRecord: jest.fn(),
      onLink: jest.fn(),
      onCopyCode: jest.fn(),
    };
    const { rerender } = render(
      <AdrReader {...d} adr={{ ...d.adr, supersededBy: { number: 6, title: "x" } }} {...on} />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(localized.text64);
    expect(screen.getByRole("region", { name: localized.text65 })).toHaveTextContent(
      d.records[0].id,
    );
    await user().click(screen.getByRole("button", { name: /ersetzt 0001/ }));
    await user().click(screen.getByRole("button", { name: /ersetzt durch 0006/ }));
    expect(on.onLink).toHaveBeenCalledWith("adr:6");
    await user().click(screen.getByRole("link", { name: d.toc[0].label }));
    await user().click(screen.getByRole("button", { name: labelText.text65 }));
    await user().click(
      within(screen.getByRole("region", { name: localized.text66 })).getAllByRole("button")[0],
    );
    expect(on.onOpenRecord).toHaveBeenCalledWith(d.records[0].id);
    rerender(
      <AdrReader
        {...d}
        adr={{ ...d.adr, status: "unknown", rawStatus: labelText.extra22 }}
        records={[{ id: "r", summary: "", lifecycle: "—" }]}
        readable={false}
        mobile
      />,
    );
    expect(screen.getByText(localized.text67)).toBeInTheDocument();
    expect(screen.getByText(labelText.extra22, { selector: "span" })).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("navigation", { name: localized.text68 })).getAllByRole("button")[0],
    );
    fireEvent.click(screen.getByRole("button", { name: /ersetzt 0001/ }));
    fireEvent.click(screen.getByRole("button", { name: labelText.text65 }));
    fireEvent.click(screen.getByRole("button", { name: /^r/ }));
    expect(data.adrDetail(0).adr.supersedes).toBeUndefined();
    expect(data.normalizeStatus("accepted, 2026")).toBe("accepted");
  });

  it("proposes a status with reason validation and successor", async () => {
    const d = data.adrDetail(1);
    const on = { onNext: jest.fn(), onChange: jest.fn(), onSubmit: jest.fn(), onClose: jest.fn() };
    const p = {
      adr: d.adr,
      reason: localized.text69,
      successor: 6,
      successors: [{ number: 6, title: labelText.text98 }],
      branch: "adr/x",
      diff: "- a\n+ b",
    };
    const { rerender } = render(<AdrStatusForm {...p} next={"superseded"} {...on} />);
    expect(screen.getByRole("dialog", { name: "Status vorschlagen" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: labelText.text34 })).toBeDisabled();
    await user().click(screen.getByRole("radio", { name: /verworfen/ }));
    expect(on.onNext).toHaveBeenCalledWith("rejected");
    await user().selectOptions(screen.getByLabelText("Ersetzt durch"), "6");
    await user().type(screen.getByLabelText(localized.text71), "x");
    expect(on.onChange).toHaveBeenCalledWith("reason", expect.any(String));
    await user().click(screen.getByRole("button", { name: "Als PR vorschlagen" }));
    expect(on.onSubmit).toHaveBeenCalled();
    rerender(
      <AdrStatusForm
        {...p}
        successor={null}
        next="rejected"
        reason=""
        reasonError={germanLabels.text44}
        mobile
        {...on}
      />,
    );
    expect(screen.getByRole("button", { name: "Als PR vorschlagen" })).toBeDisabled();
    expect(screen.queryByLabelText("Ersetzt durch")).not.toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: germanLabels.text3 }));
    expect(on.onClose).toHaveBeenCalled();
    rerender(<AdrStatusForm {...p} next={"superseded"} />);
    fireEvent.click(screen.getByRole("radio", { name: /verworfen/ }));
    fireEvent.change(screen.getByLabelText("Ersetzt durch"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText(localized.text73), { target: { value: "q" } });
    fireEvent.click(screen.getByRole("button", { name: "Als PR vorschlagen" }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text3 }));
  });

  it("writes a new decision from the template", async () => {
    const on = {
      onChange: jest.fn(),
      onRemoveRecord: jest.fn(),
      onAddRecord: jest.fn(),
      onSubmit: jest.fn(),
      onCancel: jest.fn(),
    };
    const p = {
      number: 481,
      title: "T",
      context: "",
      decision: "",
      consequences: "",
      records: ["r/1"],
      file: "docs/adr/0481-t.md",
    };
    const { rerender } = render(<AdrNewForm {...p} {...on} />);
    expect(screen.getByText("ADR 0481")).toBeInTheDocument();
    for (const l of [labelText.text9, labelText.text99, labelText.text100, labelText.text101])
      await user().type(screen.getByLabelText(l), "x");
    expect(on.onChange).toHaveBeenCalledWith("consequences", "x");
    await user().click(screen.getByRole("button", { name: germanLabels.text6 }));
    await user().click(screen.getByRole("button", { name: localized.text74 }));
    await user().click(screen.getByRole("button", { name: germanLabels.text3 }));
    await user().click(screen.getByRole("button", { name: remainingText.text88 }));
    expect(on.onSubmit).toHaveBeenCalled();
    rerender(<AdrNewForm {...p} titleError={labelText.text102} />);
    expect(screen.getByRole("button", { name: remainingText.text88 })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(labelText.text9), { target: { value: "q" } });
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text6 }));
    fireEvent.click(screen.getByRole("button", { name: localized.text75 }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text3 }));
    fireEvent.submit(screen.getByRole("form", { name: labelText.text81 }));
  });

  it("sets the directory with a preview of what it finds", async () => {
    const on = { onChange: jest.fn(), onSave: jest.fn(), onCancel: jest.fn() };
    const { rerender } = render(
      <AdrDirectorySetting
        directory="docs/adr"
        found={6}
        sample={["docs/adr/1.md"]}
        ignored={[{ file: "README.md", reason: localized.text76 }]}
        {...on}
      />,
    );
    expect(screen.getByTestId("adr-found")).toHaveTextContent(labelText.text103);
    expect(screen.getByLabelText(".facetrc.yaml")).toHaveTextContent("directory: docs/adr");
    await user().type(screen.getByLabelText("adr.directory"), "x");
    await user().click(screen.getByRole("button", { name: localized.text77 }));
    await user().click(screen.getByRole("button", { name: germanLabels.text3 }));
    expect(on.onSave).toHaveBeenCalled();
    rerender(
      <AdrDirectorySetting
        directory="/abs"
        error="relativ bitte"
        found={null}
        sample={[]}
        ignored={[]}
      />,
    );
    expect(screen.getByTestId("adr-found")).toHaveTextContent("—");
    expect(screen.getByRole("button", { name: localized.text78 })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("adr.directory"), { target: { value: "a" } });
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text3 }));
  });
});

describe("Processes", () => {
  const d = data.diagram;
  const metrics = { elements: 12, flows: 15, lanes: 3, paths: 2, longest: 6 };

  it("maps the BPMN fixture to lanes and connected flows", () => {
    expect(d.shapes.filter((s) => s.kind === "participant")).toHaveLength(3);
    expect(d.shapes.find((s) => s.label === localized.text79)?.lane).toBe("el-1");
    const path = data.walkPath(d);
    expect(path.nodes.map((n) => d.shapes.find((s) => s.id === n)?.label)).toEqual([
      localized.text80,
      "Have the file read",
      "Hand the text to the sidecar",
      "drawn?",
      "Draw SVG, list warnings",
      "visible",
    ]);
    expect(data.walkPath(d, { "el-7": 1 }).nodes).toContain("el-9");
    expect(data.walkAt(d, 4, true).choices?.map((c) => c.label)).toEqual(["yes", "no"]);
    expect(data.walkAt(d, 3, true).choices).toBeUndefined();
  });

  it("shows the gallery and the table with thumbnails", async () => {
    const on = {
      onView: jest.fn(),
      onOpen: jest.fn(),
      onPage: jest.fn(),
      onQuery: jest.fn(),
      onReset: jest.fn(),
    };
    const p = { total: 36, page: 1, pageSize: 12, query: "", withWarnings: 15 };
    const { rerender } = render(
      <ProcessCollection
        state="ready"
        view="gallery"
        items={data.processes.slice(0, 12)}
        {...p}
        {...on}
      />,
    );
    expect(screen.getByText(localized.text81)).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /Miniatur/ })).toHaveLength(12);
    await user().click(
      screen.getByRole("button", {
        name: new RegExp(data.processes[0].name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      }),
    );
    expect(on.onOpen).toHaveBeenCalledWith(data.processes[0].file);
    await user().click(screen.getByRole("radio", { name: labelText.text104 }));
    expect(on.onView).toHaveBeenCalledWith("table");
    rerender(
      <ProcessCollection
        state="ready"
        view="table"
        items={data.processes.slice(0, 12)}
        {...p}
        {...on}
      />,
    );
    await user().click(screen.getAllByRole("row")[1]);
    expect(on.onOpen).toHaveBeenCalledTimes(2);
    rerender(
      <ProcessCollection state="empty" view="gallery" items={[]} {...p} total={0} {...on} />,
    );
    expect(screen.getByText(localized.text82)).toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: "Beispieldatei ansehen" }));
    expect(on.onReset).toHaveBeenCalled();
    rerender(
      <ProcessCollection
        state="ready"
        view="table"
        items={data.processes.slice(0, 1)}
        {...p}
        mobile
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: new RegExp(data.processes[0].name) }));
  });

  it("selects an element and shows its flows, lane and records", async () => {
    const on = {
      onSelect: jest.fn(),
      onZoom: jest.fn(),
      onPanel: jest.fn(),
      onFindings: jest.fn(),
      onWalk: jest.fn(),
      onOpenRecord: jest.fn(),
      onBack: jest.fn(),
      onOutlineQuery: jest.fn(),
    };
    render(
      <ProcessWorkspace
        name={labelText.text83}
        file="a.bpmn"
        diagram={d}
        metrics={metrics}
        selected="el-6"
        panel="detail"
        findings={data.processFindings}
        findingsOpen
        outlineQuery="File"
        zoom={100}
        viewport={{ x: 0, y: 0, w: 10, h: 10 }}
        linked={data.processLinks}
        docs={data.processDocs}
        {...on}
      />,
    );
    const detail = screen.getByTestId("process-detail");
    expect(detail).toHaveTextContent("Hand the text to the sidecar");
    expect(detail).toHaveTextContent("Atlas (Browser)");
    expect(detail).toHaveTextContent("Have the file read");
    expect(detail).toHaveTextContent(localized.text83);
    expect(screen.getByTestId("shape-el-6").getAttribute("data-state")).toBe("focus");
    expect(screen.getByTestId("shape-el-12").getAttribute("data-state")).toBe("related");
    expect(screen.getByTestId("shape-el-14").getAttribute("data-state")).toBe("dim");
    await user().click(
      within(detail).getByRole("button", { name: /Sequenzfluss Have the file read/ }),
    );
    expect(on.onSelect).toHaveBeenCalledWith("el-5");
    await user().click(within(detail).getAllByRole("button", { name: /lists/ })[0]);
    expect(on.onOpenRecord).toHaveBeenCalled();
    await user().click(screen.getByTestId("shape-el-7"));
    expect(on.onSelect).toHaveBeenCalledWith("el-7");
    await user().click(screen.getByRole("button", { name: localized.text84 }));
    await user().click(screen.getByRole("button", { name: labelText.text84 }));
    await user().click(screen.getByRole("button", { name: labelText.text85 }));
    expect(on.onZoom).toHaveBeenCalledWith("fit");
    expect(screen.getByRole("img", { name: remainingText.text89 })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: germanLabels.text45 })).toHaveTextContent(
      localized.text85,
    );
    await user().click(screen.getAllByRole("button", { name: remainingText.text90 })[0]);
    expect(on.onSelect).toHaveBeenCalledWith("el-13");
    await user().click(screen.getByRole("button", { name: germanLabels.text46 }));
    expect(on.onFindings).toHaveBeenCalled();
    const outline = screen.getByRole("navigation", { name: remainingText.text91 });
    expect(within(outline).queryByRole("button", { name: /gezeichnet/ })).not.toBeInTheDocument();
    await user().click(within(outline).getByRole("button", { name: localized.text86 }));
    await user().type(within(outline).getByRole("searchbox"), "x");
    expect(on.onOutlineQuery).toHaveBeenCalled();
    await user().click(screen.getByRole("tab", { name: labelText.text105 }));
    expect(on.onPanel).toHaveBeenCalledWith("walkthrough");
    await user().click(screen.getByRole("button", { name: labelText.text106 }));
    expect(on.onWalk).toHaveBeenCalledWith("start");
    await user().click(screen.getByRole("button", { name: germanLabels.text47 }));
    expect(on.onBack).toHaveBeenCalled();
  });

  it("walks step by step and offers the branches at a gateway", async () => {
    const onWalk = jest.fn();
    const walk = data.walkAt(d, 4, true);
    const props = {
      name: "D",
      file: "f",
      diagram: d,
      metrics,
      findings: [],
      outlineQuery: "",
      zoom: 75,
      linked: {},
    };
    const { rerender } = render(
      <ProcessWorkspace {...props} walk={walk} panel="walkthrough" onWalk={onWalk} />,
    );
    const panel = screen.getByTestId("process-walk");
    expect(panel).toHaveTextContent("Schritt 4");
    expect(screen.getByTestId("shape-el-7").getAttribute("data-state")).toBe("current");
    expect(screen.getByTestId("shape-el-5").getAttribute("data-state")).toBe("visited");
    expect(screen.getByRole("button", { name: localized.text87 })).toBeDisabled();
    await user().click(screen.getByRole("button", { name: /yes → Draw SVG/ }));
    expect(onWalk).toHaveBeenCalledWith("choose", "fl-4");
    await user().click(screen.getByRole("button", { name: localized.text88 }));
    await user().click(screen.getAllByRole("button", { name: labelText.text107 })[0]);
    expect(onWalk).toHaveBeenCalledWith("stop");
    rerender(
      <ProcessWorkspace {...props} walk={data.walkAt(d, 2)} panel="walkthrough" onWalk={onWalk} />,
    );
    await user().click(screen.getByRole("button", { name: localized.text89 }));
    expect(onWalk).toHaveBeenCalledWith("next");
    rerender(<ProcessWorkspace {...props} panel="walkthrough" onWalk={onWalk} />);
    await user().click(screen.getByRole("button", { name: "Vom Start beginnen" }));
    expect(screen.getByRole("region", { name: germanLabels.text45 })).toHaveTextContent("0");
    rerender(<ProcessWorkspace {...props} panel="detail" />);
    expect(screen.getByText(localized.text90)).toBeInTheDocument();
    for (const n of [
      labelText.text106,
      localized.text91,
      labelText.text84,
      labelText.text85,
      germanLabels.text47,
    ])
      fireEvent.click(screen.getByRole("button", { name: n }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text46 }));
    fireEvent.click(screen.getByTestId("shape-el-6"));
    fireEvent.click(screen.getByRole("tab", { name: labelText.text105 }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "q" } });
  });

  it("puts outline and detail into sheets on mobile", async () => {
    const on = { onSelect: jest.fn(), onWalk: jest.fn(), onOutline: jest.fn() };
    const props = {
      name: "D",
      file: "f",
      diagram: d,
      metrics,
      findings: data.processFindings,
      outlineQuery: "",
      zoom: 100,
      linked: {},
      mobile: true,
    };
    const { rerender } = render(
      <ProcessWorkspace {...props} selected="el-15" panel="detail" outlineOpen {...on} />,
    );
    expect(screen.getByRole("dialog", { name: remainingText.text91 })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Element" })).toHaveTextContent(
      localized.text92,
    );
    await user().click(screen.getAllByRole("button", { name: remainingText.text91 })[0]);
    expect(on.onOutline).toHaveBeenCalled();
    await user().click(
      within(screen.getByRole("complementary", { name: "Element" })).getByRole("button", {
        name: localized.text93,
      }),
    );
    expect(on.onSelect).toHaveBeenCalledWith(null);
    rerender(<ProcessWorkspace {...props} walk={data.walkAt(d, 6)} panel="walkthrough" {...on} />);
    await user().click(
      within(screen.getByRole("complementary", { name: labelText.text106 })).getByRole("button", {
        name: localized.text94,
      }),
    );
    expect(on.onWalk).toHaveBeenCalledWith("stop");
    const start = d.shapes.find((s) => s.kind === "startEvent")!;
    rerender(<ProcessWorkspace {...props} selected={start.id} panel="detail" />);
    expect(screen.getByText(localized.text95)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: remainingText.text91 }));
  });

  it("draws a thumbnail without labels and reports an unreadable file", async () => {
    const { container } = render(<ProcessCanvas diagram={d} thumb label="Mini" />);
    expect(container.querySelectorAll("text")).toHaveLength(0);
    render(<ProcessCanvas diagram={d} label={labelText.text108} />);
    fireEvent.click(screen.getByTestId("shape-el-4"));
    const on = { onBack: jest.fn(), onRetry: jest.fn() };
    render(
      <ProcessUnreadable
        file="x.bpmn"
        error={labelText.text109}
        line={2}
        excerpt={[
          { n: 1, text: "<a>" },
          { n: 2, text: "</b>" },
        ]}
        {...on}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(labelText.text110);
    await user().click(screen.getByRole("button", { name: labelText.text111 }));
    await user().click(screen.getByRole("button", { name: germanLabels.text47 }));
    expect(on.onRetry).toHaveBeenCalled();
    render(<ProcessUnreadable file="y" error="e" line={1} excerpt={[]} />);
    fireEvent.click(screen.getAllByRole("button", { name: labelText.text111 })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: germanLabels.text47 })[1]);
  });
});

function composer(over: Partial<ComposerProps> = {}): ComposerProps {
  return {
    value: germanLabels.text48,
    mode: "ask",
    model: "opus",
    context: [{ key: "a", label: "ADR 0001", icon: "decision" }],
    ...over,
  };
}

describe("Ask Atlas", () => {
  it("opens from the pill and pulses while an answer runs", async () => {
    const onOpen = jest.fn();
    const { rerender } = render(<ChatPill onOpen={onOpen} />);
    await user().click(screen.getByRole("button", { name: /Frag Atlas/ }));
    expect(onOpen).toHaveBeenCalled();
    rerender(<ChatPill running step={localized.text97} mobile />);
    expect(screen.getByRole("button")).toHaveTextContent("Atlas antwortetliest config.go");
    fireEvent.click(screen.getByRole("button"));
  });

  it("answers with markdown, a reading trail, sources and actions", async () => {
    const on = {
      onCopy: jest.fn(),
      onRetry: jest.fn(),
      onSource: jest.fn(),
      onToggleTrail: jest.fn(),
      onCopyCode: jest.fn(),
    };
    const [, rich] = [null, data.turns("rich")[0]];
    render(<ChatTurn turn={rich} trailOpen copied="markdown" {...on} />);
    expect(screen.getByRole("table")).toHaveTextContent("verwaiste Records");
    expect(screen.getByRole("list", { name: labelText.text112 })).toHaveTextContent(
      "packages/task/import.go",
    );
    expect(screen.getByRole("button", { name: remainingText.text11 })).toBeInTheDocument();
    await user().click(screen.getAllByRole("button", { name: germanLabels.text12 }).at(-1)!);
    expect(on.onCopy).toHaveBeenCalledWith("text");
    await user().click(screen.getByRole("button", { name: labelText.text113 }));
    await user().click(screen.getByRole("button", { name: localized.text98 }));
    await user().click(screen.getByRole("button", { name: /scripts\/search\.sh/ }));
    expect(on.onSource).toHaveBeenCalledWith(expect.objectContaining({ ref: "scripts/search.sh" }));
    await user().click(screen.getByRole("button", { name: labelText.text114 }));
    expect(on.onToggleTrail).toHaveBeenCalled();
    expect(screen.getAllByText(labelText.text115).length).toBeGreaterThan(0);
  });

  it("shows the live trail, the cut answer with continue, stop and failure", async () => {
    const onContinue = jest.fn();
    const onRetry = jest.fn();
    const { rerender } = render(<ChatTurn turn={data.turns("streaming")[1]} />);
    expect(screen.getByRole("button", { name: labelText.text116 })).toBeInTheDocument();
    expect(screen.queryByLabelText(labelText.text113)).not.toBeInTheDocument();
    rerender(<ChatTurn turn={data.turns("cut")[1]} onContinue={onContinue} />);
    expect(screen.getByRole("status")).toHaveTextContent(localized.text99);
    await user().click(screen.getByRole("button", { name: labelText.text117 }));
    expect(onContinue).toHaveBeenCalled();
    rerender(<ChatTurn turn={data.turns("stopped")[1]} onRetry={onRetry} />);
    expect(screen.getByRole("status")).toHaveTextContent(germanLabels.text49);
    await user().click(screen.getByRole("button", { name: localized.text100 }));
    rerender(<ChatTurn turn={data.turns("failed")[1]} onRetry={onRetry} compact />);
    expect(screen.getByRole("alert")).toHaveTextContent(germanLabels.text50);
    await user().click(screen.getByRole("button", { name: labelText.text118 }));
    expect(onRetry).toHaveBeenCalledTimes(2);
    const t = data.turns("failed")[1];
    rerender(
      <ChatTurn
        turn={{
          ...t,
          answer: {
            ...t.answer!,
            error: undefined,
            steps: [],
            seconds: undefined,
            state: "stopped",
          },
        }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("—");
    fireEvent.click(screen.getByRole("button", { name: localized.text101 }));
    rerender(<ChatTurn turn={{ ...t, answer: { ...t.answer!, error: undefined } }} />);
    expect(screen.getByRole("alert")).toHaveTextContent(localized.text102);
    fireEvent.click(screen.getByRole("button", { name: labelText.text118 }));
    fireEvent.click(screen.getByRole("button", { name: labelText.text119 }));
    const cut = data.turns("cut")[1];
    rerender(<ChatTurn turn={cut} />);
    fireEvent.click(screen.getByRole("button", { name: labelText.text117 }));
    const a = data.turns("answer")[0];
    rerender(
      <ChatTurn turn={{ ...a, answer: { ...a.answer!, model: undefined, seconds: undefined } }} />,
    );
    for (const n of [germanLabels.text12, "Markdown", labelText.text113, localized.text103])
      fireEvent.click(screen.getByRole("button", { name: n }));
    fireEvent.click(screen.getByRole("button", { name: /scripts/ }));
    rerender(<ChatTurn turn={{ id: "q", question: localized.text104, at: "1" }} />);
    expect(screen.getByRole("article", { name: localized.text105 })).toBeInTheDocument();
  });

  it("composes with modes, context chips, slash commands, send and stop", async () => {
    const on = {
      onChange: jest.fn(),
      onSend: jest.fn(),
      onStop: jest.fn(),
      onMode: jest.fn(),
      onModel: jest.fn(),
      onRemoveContext: jest.fn(),
      onSlash: jest.fn(),
    };
    const { rerender } = render(
      <Composer {...composer({ slash: { items: data.SLASH, active: 1 } })} {...on} />,
    );
    expect(screen.getByRole("menu", { name: germanLabels.text51 })).toHaveTextContent("/area");
    await user().click(screen.getByRole("menuitem", { name: /\/new/ }));
    expect(on.onSlash).toHaveBeenCalledWith("/new");
    await user().type(screen.getByLabelText(germanLabels.text52), "?");
    expect(on.onChange).toHaveBeenCalledWith(germanLabels.text53);
    await user().click(screen.getByRole("radio", { name: labelText.text120 }));
    expect(on.onMode).toHaveBeenCalledWith("ask");
    await user().click(screen.getByRole("button", { name: germanLabels.text54 }));
    await user().click(screen.getByRole("button", { name: germanLabels.text6 }));
    expect(on.onRemoveContext).toHaveBeenCalledWith("a");
    await user().click(screen.getByRole("button", { name: germanLabels.text55 }));
    expect(on.onSend).toHaveBeenCalled();
    rerender(
      <Composer
        {...composer({ running: true, mode: "ask", context: [], compact: true })}
        {...on}
      />,
    );
    expect(screen.getByLabelText(germanLabels.text52)).toHaveAttribute(
      "placeholder",
      germanLabels.text56,
    );
    await user().click(screen.getByRole("button", { name: germanLabels.text57 }));
    expect(on.onStop).toHaveBeenCalled();
    rerender(
      <Composer
        {...composer({ value: " ", slash: { items: data.SLASH.slice(0, 1), active: 0 } })}
      />,
    );
    expect(screen.getByRole("button", { name: germanLabels.text55 })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(germanLabels.text52), { target: { value: "a" } });
    fireEvent.click(screen.getByRole("radio", { name: localized.text111 }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text54 }));
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text6 }));
    fireEvent.click(screen.getByRole("menuitem"));
    rerender(<Composer {...composer({ running: true })} />);
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text57 }));
    rerender(<Composer {...composer()} />);
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text55 }));
  });

  it("sends on Enter, breaks the line on Shift+Enter and Alt+Enter, and waits for a composition", () => {
    const onSend = jest.fn();
    const onChange = jest.fn();
    const { rerender, container } = render(
      <Composer {...composer()} onSend={onSend} onChange={onChange} />,
    );
    const field = screen.getByLabelText(germanLabels.text52);
    expect(fireEvent.keyDown(field, { key: "Enter", shiftKey: true })).toBe(true);
    expect(fireEvent.keyDown(field, { key: "Enter", isComposing: true })).toBe(true);
    expect(onSend).not.toHaveBeenCalled();
    (field as HTMLTextAreaElement).setSelectionRange(2, 2);
    expect(fireEvent.keyDown(field, { key: "Enter", altKey: true })).toBe(false);
    expect(onChange).toHaveBeenCalledWith("Fr\nage");
    expect(onSend).not.toHaveBeenCalled();
    expect(fireEvent.keyDown(field, { key: "Enter" })).toBe(false);
    expect(onSend).toHaveBeenCalledTimes(1);

    expect(container).toHaveTextContent(germanLabels.text58);

    rerender(<Composer {...composer({ running: true })} onSend={onSend} />);
    fireEvent.keyDown(screen.getByLabelText(germanLabels.text52), { key: "Enter" });
    rerender(<Composer {...composer({ value: "  " })} onSend={onSend} />);
    fireEvent.keyDown(screen.getByLabelText(germanLabels.text52), { key: "Enter" });
    expect(onSend).toHaveBeenCalledTimes(1);

    rerender(<Composer {...composer()} enterSends={false} onSend={onSend} />);
    expect(fireEvent.keyDown(screen.getByLabelText(germanLabels.text52), { key: "Enter" })).toBe(
      true,
    );
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(container).not.toHaveTextContent(germanLabels.text59);
  });

  it("stops with an icon button that sits in the bar beside the modes", () => {
    render(<Composer {...composer({ running: true, compact: true })} />);
    const stop = screen.getByRole("button", { name: germanLabels.text57 });
    expect(stop).toHaveTextContent("");
    expect(stop.parentElement).toBe(
      screen.getByRole("radiogroup", { name: labelText.text121 }).parentElement,
    );
  });

  it("walks the command list with the arrow keys, picks with Enter and closes with Esc", () => {
    const on = { onSlash: jest.fn(), onSlashActive: jest.fn(), onSlashClose: jest.fn() };
    const { rerender } = render(
      <Composer {...composer({ value: "/", slash: { items: data.SLASH, active: 0 } })} {...on} />,
    );
    const field = screen.getByLabelText(germanLabels.text52);
    expect(screen.getByRole("menu", { name: germanLabels.text51 })).toBeInTheDocument();
    fireEvent.keyDown(field, { key: "ArrowDown" });
    expect(on.onSlashActive).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(field, { key: "ArrowUp" });
    expect(on.onSlashActive).toHaveBeenLastCalledWith(data.SLASH.length - 1);
    rerender(
      <Composer {...composer({ value: "/", slash: { items: data.SLASH, active: 1 } })} {...on} />,
    );
    expect(screen.getByRole("menuitem", { current: true })).toHaveTextContent(data.SLASH[1].cmd);
    fireEvent.keyDown(field, { key: "Enter" });
    expect(on.onSlash).toHaveBeenCalledWith(data.SLASH[1].cmd);
    fireEvent.keyDown(field, { key: "Escape" });
    expect(on.onSlashClose).toHaveBeenCalled();
    rerender(<Composer {...composer({ value: "/x", slash: { items: [], active: 0 } })} {...on} />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens the model menu and picks a model by its index", async () => {
    const on = { onModel: jest.fn(), onPickModel: jest.fn() };
    const { rerender } = render(
      <Composer {...composer({ models: [labelText.text122, "Haiku", "Opus"] })} {...on} />,
    );
    expect(screen.getByRole("button", { name: germanLabels.text54 })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await user().click(screen.getByRole("button", { name: germanLabels.text54 }));
    expect(on.onModel).toHaveBeenCalledTimes(1);
    rerender(
      <Composer
        {...composer({
          model: "Opus",
          models: [labelText.text122, "Haiku", "Opus"],
          modelsOpen: true,
        })}
        {...on}
      />,
    );
    const menu = screen.getByRole("menu", { name: labelText.text123 });
    expect(within(menu).getByRole("menuitem", { current: true })).toHaveTextContent("Opus");
    await user().click(within(menu).getByRole("menuitem", { name: "Haiku" }));
    expect(on.onPickModel).toHaveBeenCalledWith(1);
  });

  it("docks with suggestions, an answer, sign-in and host error", async () => {
    const on = {
      onClose: jest.fn(),
      onExpand: jest.fn(),
      onNew: jest.fn(),
      onSuggestion: jest.fn(),
      onToggleTrail: jest.fn(),
      onCopy: jest.fn(),
      onRetry: jest.fn(),
      onContinue: jest.fn(),
    };
    const { rerender } = render(
      <ChatDock
        title={labelText.text124}
        turns={[]}
        composer={composer()}
        suggestions={data.SUGGESTIONS}
        roleName={labelText.text49}
        {...on}
      />,
    );
    expect(screen.getByText(remainingText.text92)).toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: data.SUGGESTIONS[0] }));
    expect(on.onSuggestion).toHaveBeenCalledWith(data.SUGGESTIONS[0]);
    await user().click(screen.getByRole("button", { name: localized.text112 }));
    await user().click(screen.getByRole("button", { name: labelText.text125 }));
    await user().click(screen.getByRole("button", { name: localized.text113 }));
    expect(on.onExpand).toHaveBeenCalled();
    rerender(
      <ChatDock
        title="T"
        continuation={"open"}
        turns={data.turns("cut")}
        composer={composer()}
        copied={{ turn: "t1", what: "text" }}
        trailOpen={{ t1: true }}
        mobile
        {...on}
      />,
    );
    expect(screen.getByRole("complementary", { name: "Frag Atlas" })).toHaveTextContent(
      localized.text115,
    );
    expect(screen.getByRole("button", { name: remainingText.text11 })).toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: labelText.text117 }));
    expect(on.onContinue).toHaveBeenCalledWith("t2");
    await user().click(screen.getAllByRole("button", { name: labelText.text119 })[0]);
    expect(on.onToggleTrail).toHaveBeenCalledWith("t1");
    await user().click(screen.getByRole("button", { name: "Markdown" }));
    expect(on.onCopy).toHaveBeenCalledWith("t1", "markdown");
    await user().click(screen.getByRole("button", { name: localized.text116 }));
    expect(on.onRetry).toHaveBeenCalledWith("t1");
    rerender(<ChatDock title="T" turns={[]} composer={composer()} signedIn={false} />);
    expect(screen.getByRole("status")).toHaveTextContent(localized.text117);
    expect(screen.queryByLabelText(germanLabels.text52)).not.toBeInTheDocument();
    rerender(
      <ChatDock
        title="T"
        turns={[]}
        composer={composer()}
        hostError={localized.text118}
        onRetry={on.onRetry}
      />,
    );
    await user().click(screen.getByRole("button", { name: labelText.text66 }));
    expect(on.onRetry).toHaveBeenCalledWith("");
    rerender(<ChatDock title="T" turns={data.turns("answer")} composer={composer()} />);
    for (const n of [
      localized.text119,
      labelText.text125,
      localized.text120,
      germanLabels.text12,
      localized.text121,
    ])
      fireEvent.click(screen.getByRole("button", { name: n }));
    fireEvent.click(screen.getByRole("button", { name: labelText.text119 }));
    rerender(<ChatDock title="T" turns={data.turns("cut")} composer={composer()} />);
    fireEvent.click(screen.getByRole("button", { name: labelText.text117 }));
    rerender(<ChatDock title="T" turns={[]} composer={composer()} hostError="x" />);
    fireEvent.click(screen.getByRole("button", { name: labelText.text66 }));
    rerender(<ChatDock title="T" turns={[]} composer={composer()} />);
    expect(screen.queryByRole("button", { name: data.SUGGESTIONS[0] })).not.toBeInTheDocument();
  });

  it("signs in by command", async () => {
    const on = { onCheck: jest.fn(), onCopy: jest.fn() };
    render(<ChatSignIn {...on} />);
    expect(screen.getByText("$ claude login")).toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: germanLabels.text37 }));
    await user().click(screen.getByRole("button", { name: localized.text122 }));
    expect(on.onCheck).toHaveBeenCalled();
    render(<ChatSignIn command="x" />);
    fireEvent.click(screen.getAllByRole("button", { name: germanLabels.text37 })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: localized.text123 })[1]);
  });

  it("manages sessions in full screen: pick, pin, rename, delete, search", async () => {
    const sessions = data.sessionsVM();
    const on = {
      onQuery: jest.fn(),
      onPick: jest.fn(),
      onMenu: jest.fn(),
      onPin: jest.fn(),
      onRename: jest.fn(),
      onRenameValue: jest.fn(),
      onRenameSave: jest.fn(),
      onRenameCancel: jest.fn(),
      onDelete: jest.fn(),
      onShrink: jest.fn(),
      onClose: jest.fn(),
      onSource: jest.fn(),
      onNew: jest.fn(),
    };
    const p = {
      title: "T",
      continuation: "continued" as const,
      turns: data.turns("answer"),
      composer: composer(),
      sessions,
      currentId: sessions[1].id,
      query: "",
    };
    const { rerender } = render(<ChatFull {...p} menuFor={sessions[1].id} {...on} />);
    const nav = screen.getByRole("navigation", { name: labelText.text126 });
    expect(within(nav).getByText(/Angeheftet · 1/)).toBeInTheDocument();
    await user().click(
      within(nav).getAllByRole("button", { name: new RegExp(sessions[2].title) })[0],
    );
    expect(on.onPick).toHaveBeenCalled();
    await user().click(screen.getByRole("menuitem", { name: localized.text124 }));
    expect(on.onPin).toHaveBeenCalledWith(sessions[1].id);
    await user().click(screen.getByRole("menuitem", { name: labelText.text127 }));
    await user().click(screen.getByRole("menuitem", { name: localized.text125 }));
    expect(on.onDelete).toHaveBeenCalledWith(sessions[1].id);
    await user().click(
      screen.getAllByRole("button", { name: `${localized.text126}${sessions[1].title}` })[0],
    );
    expect(on.onMenu).toHaveBeenCalled();
    await user().click(
      screen.getAllByRole("button", { name: `${localized.text127}${sessions[0].title}` })[0],
    );
    expect(on.onMenu).toHaveBeenCalledWith(sessions[0].id);
    await user().type(screen.getByRole("searchbox", { name: remainingText.text93 }), "a");
    await user().click(screen.getByRole("button", { name: localized.text128 }));
    await user().click(screen.getByRole("button", { name: "Als Dock" }));
    await user().click(screen.getByRole("button", { name: localized.text129 }));
    expect(on.onShrink).toHaveBeenCalled();
    const sources = screen.getByRole("complementary", { name: remainingText.text94 });
    await user().click(within(sources).getAllByRole("button")[0]);
    expect(on.onSource).toHaveBeenCalled();
    rerender(
      <ChatFull
        {...p}
        menuFor={sessions[2].id}
        renaming={{
          id: sessions[1].id,
          value: "",
          error: localized.text130,
        }}
        {...on}
      />,
    );
    expect(screen.getByRole("menuitem", { name: localized.text131 })).toBeInTheDocument();
    const form = screen.getByRole("form", { name: labelText.text128 });
    expect(form).toHaveTextContent(localized.text132);
    expect(within(form).getByRole("button", { name: remainingText.text6 })).toBeDisabled();
    await user().type(within(form).getByLabelText(labelText.text129), "x");
    expect(on.onRenameValue).toHaveBeenCalledWith("x");
    await user().click(within(form).getByRole("button", { name: germanLabels.text3 }));
    expect(on.onRenameCancel).toHaveBeenCalled();
    rerender(
      <ChatFull {...p} renaming={{ id: sessions[1].id, value: labelText.text124 }} {...on} />,
    );
    await user().click(screen.getByRole("button", { name: remainingText.text6 }));
    expect(on.onRenameSave).toHaveBeenCalled();
    rerender(
      <ChatFull
        {...p}
        sessions={[]}
        query="zz"
        turns={[]}
        continuation={undefined}
        mobile
        sessionsOpen
        onSessions={on.onQuery}
      />,
    );
    expect(screen.getByRole("dialog", { name: labelText.text126 })).toHaveTextContent(
      localized.text133,
    );
    await user().click(screen.getAllByRole("button", { name: labelText.text126 })[0]);
    rerender(<ChatFull {...p} signedIn={false} />);
    expect(screen.queryByLabelText(germanLabels.text52)).not.toBeInTheDocument();
  });

  it("draws no leading separator when a session has no time and an answer no model", () => {
    const sessions = [{ ...data.sessionsVM()[0], when: "" }];
    const turns = data
      .turns("answer")
      .map((turn) =>
        turn.answer ? { ...turn, answer: { ...turn.answer, model: "", seconds: undefined } } : turn,
      );

    expect(turns.some((turn) => turn.answer)).toBe(true);
    render(
      <ChatFull
        title="T"
        turns={turns}
        composer={composer()}
        sessions={sessions}
        currentId="x"
        query=""
      />,
    );
    const line = screen.getByText(/Runde/);
    expect(line.textContent).not.toMatch(/^\s*·/);
    const foot = screen.getByText(labelText.text130);
    expect(foot.textContent).not.toMatch(/^\s*·/);
    expect(foot.textContent).not.toMatch(/·\s*$/);
  });

  it("shows a dash where nobody measured a process's records", () => {
    const items = data.processes.slice(0, 2).map((item) => ({ ...item, records: null }));
    render(
      <ProcessCollection
        state="ready"
        view="table"
        items={items}
        total={2}
        page={1}
        pageSize={12}
        query=""
        withWarnings={0}
      />,
    );
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(within(row).getByText("—")).toBeInTheDocument();
  });

  it("defaults every session callback to nothing", () => {
    const sessions = data.sessionsVM();
    const p = { title: "T", turns: [], composer: composer(), sessions, currentId: "x", query: "" };
    const { rerender } = render(<ChatFull {...p} menuFor={sessions[0].id} />);
    for (const n of [labelText.text131, labelText.text127, localized.text134])
      fireEvent.click(screen.getByRole("menuitem", { name: n }));
    fireEvent.click(
      screen.getAllByRole("button", { name: `${localized.text135}${sessions[0].title}` })[0],
    );
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(sessions[3].title) })[0]);
    fireEvent.change(screen.getByRole("searchbox", { name: remainingText.text93 }), {
      target: { value: "q" },
    });
    fireEvent.click(screen.getByRole("button", { name: localized.text136 }));
    fireEvent.click(screen.getByRole("button", { name: "Als Dock" }));
    fireEvent.click(screen.getByRole("button", { name: localized.text137 }));
    rerender(
      <ChatFull
        {...p}
        turns={data.turns("answer")}
        renaming={{ id: sessions[0].id, value: "v" }}
      />,
    );
    fireEvent.change(screen.getByLabelText(labelText.text129), { target: { value: "w" } });
    fireEvent.click(screen.getByRole("button", { name: germanLabels.text3 }));
    fireEvent.submit(screen.getByRole("form", { name: labelText.text128 }));
    rerender(<ChatFull {...p} mobile />);
    fireEvent.click(screen.getByRole("button", { name: labelText.text126 }));
    rerender(<ChatFull {...p} turns={data.turns("answer")} />);
    fireEvent.click(
      within(screen.getByRole("complementary", { name: remainingText.text94 })).getAllByRole(
        "button",
      )[0],
    );
    expect(screen.getByRole("complementary", { name: remainingText.text94 })).toBeInTheDocument();
  });

  it("collapses and opens the reading trail on its own", () => {
    const onToggle = jest.fn();
    const { rerender } = render(
      <ReadingTrail steps={data.STEPS_DONE} open={false} onToggle={onToggle} />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalled();
    rerender(<ReadingTrail steps={[{ label: "x", state: "running" }]} open live />);
    fireEvent.click(screen.getByRole("button"));
    render(<SourceCards sources={data.SOURCES} />);
    fireEvent.click(screen.getAllByRole("button", { name: /admin/ })[0]);
  });
});

describe("Palette", () => {
  it("shows recent places with keyboard hints", async () => {
    const on = { onQuery: jest.fn(), onSelect: jest.fn(), onClose: jest.fn() };
    render(<CommandPalette query="" groups={data.PALETTE_RECENT} activeKey="h1" {...on} />);
    expect(screen.getByRole("dialog", { name: germanLabels.text60 })).toHaveTextContent(
      labelText.text132,
    );
    expect(screen.getByRole("option", { name: /column/ })).toHaveAttribute("aria-selected", "true");
    await user().click(screen.getByRole("option", { name: germanLabels.text61 }));
    expect(on.onSelect).toHaveBeenCalledWith("overview");
    await user().type(screen.getByRole("combobox"), "a");
    expect(on.onQuery).toHaveBeenCalledWith("a");
    expect(screen.getByText(germanLabels.text51)).toBeInTheDocument();
  });

  it("groups many hits, marks the match and shows all of a group", async () => {
    const onShowAll = jest.fn();
    const groups = data.paletteHits("a", 3);
    render(
      <CommandPalette
        query="a"
        groups={groups}
        total={2000}
        activeKey={null}
        onShowAll={onShowAll}
      />,
    );
    expect(screen.getByText("2.000 Treffer")).toBeInTheDocument();
    await user().click(
      screen.getByRole("button", {
        name: `${germanLabels.text62}${groups[0].total!.toLocaleString("de-DE")}${remainingText.text95}`,
      }),
    );
    expect(onShowAll).toHaveBeenCalledWith("records");
    expect(document.querySelectorAll("mark").length).toBeGreaterThan(0);
  });

  it("enters command mode with a slash", () => {
    render(<CommandPalette query="/" groups={data.PALETTE_COMMANDS} mobile />);
    expect(screen.getAllByText(germanLabels.text51).length).toBeGreaterThan(0);
    expect(screen.getByRole("option", { name: labelText.text133 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Thema wechseln/ }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "x" } });
  });

  it("offers to ask Atlas when nothing matches", async () => {
    const on = { onAsk: jest.fn(), onQuery: jest.fn() };
    const { rerender } = render(
      <CommandPalette query="?ankr" groups={[]} nearest={["anchor"]} {...on} />,
    );
    expect(screen.getByText(localized.text138)).toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: "anchor" }));
    expect(on.onQuery).toHaveBeenCalledWith("anchor");
    await user().click(screen.getByRole("button", { name: localized.text139 }));
    expect(on.onAsk).toHaveBeenCalledWith("ankr");
    rerender(<CommandPalette query="#x" groups={[]} />);
    fireEvent.click(screen.getByRole("button", { name: localized.text140 }));
    expect(data.paletteHits("zzzzqq")).toEqual([]);
  });

  it("highlights only when the query occurs", () => {
    const { container, rerender } = render(<Highlight text="Commit-Gate" query="gate" />);
    expect(container.querySelector("mark")).toHaveTextContent("Gate");
    rerender(<Highlight text="Commit" query="zz" />);
    expect(container.querySelector("mark")).toBeNull();
  });
});

describe("Motion", () => {
  it("flies a row into the dossier and back", async () => {
    const on = { onOpen: jest.fn(), onClose: jest.fn() };
    const { rerender } = render(<FlightDemo rows={data.motionRows} opened={null} {...on} />);
    await user().click(
      screen.getByRole("button", {
        name: new RegExp(`^${data.motionRows[2].id.split("/").pop()}`),
      }),
    );
    expect(on.onOpen).toHaveBeenCalledWith(2);
    rerender(<FlightDemo rows={data.motionRows} opened={2} {...on} />);
    const dossier = screen.getByRole("article", {
      name: `${germanLabels.text63}${data.motionRows[2].id}`,
    });
    expect(dossier).toHaveTextContent(data.motionRows[2].summary);
    await user().click(within(dossier).getByRole("button", { name: localized.text141 }));
    expect(on.onClose).toHaveBeenCalled();
    rerender(<FlightDemo rows={[{ ...data.motionRows[0], scenarios: 0, proven: 1 }]} opened={0} />);
    fireEvent.click(screen.getByRole("button", { name: localized.text142 }));
    fireEvent.click(screen.getAllByRole("button")[0]);
  });

  it("staggers, counts up and has a reduced-motion form", () => {
    render(
      <StaggerDemo
        rows={[...data.motionRows, ...data.motionRows].map((r, i) => ({ ...r, id: r.id + i }))}
        run={0}
      />,
    );
    expect(screen.getByRole("list", { name: labelText.text134 }).children).toHaveLength(
      data.motionRows.length * 2,
    );
    render(
      <CountUpBoard
        run={0}
        figures={[{ value: 94, label: labelText.text13, tone: "ok", suffix: " %" }]}
      />,
    );
    expect(screen.getByLabelText(labelText.text135)).toBeInTheDocument();
    render(<CountUp value={3} label={germanLabels.text18} />);
    render(<ReducedMotionDemo rows={data.motionRows} opened={0} />);
    expect(screen.getByText("prefers-reduced-motion: reduce")).toBeInTheDocument();
  });
});

describe("review fixes", () => {
  it("renders single-star emphasis and German lifecycle labels", () => {
    render(<Markdown source={localized.text143} />);
    expect(screen.getByText(localized.text144).tagName).toBe("EM");
    expect(screen.queryByText(/\*/)).not.toBeInTheDocument();
    render(<LifecycleProbe values={["active", "planned", remainingText.text7]} />);
    expect(screen.getByTestId("lc-active")).toHaveTextContent(remainingText.text96);
    expect(screen.getByTestId("lc-planned")).toHaveTextContent(remainingText.text97);
    expect(screen.getByTestId(remainingText.text98)).toHaveTextContent(remainingText.text96);
  });

  it("caps a board column and links to the rest", async () => {
    const onStatus = jest.fn();
    const counts = data.adrCounts(data.adrs480);
    render(
      <AdrCollection
        state="ready"
        view="board"
        items={data.adrs480}
        total={480}
        counts={counts}
        page={1}
        pageSize={60}
        query=""
        directory="docs/adr"
        onStatus={onStatus}
      />,
    );
    const col = screen.getByRole("region", { name: labelText.text30 });
    expect(within(col).getAllByRole("button", { name: /ADR/ })).toHaveLength(BOARD_CAP);
    await user().click(
      within(col).getByRole("button", {
        name: `${nf(counts.accepted - BOARD_CAP)}${labelText.text136}`,
      }),
    );
    expect(onStatus).toHaveBeenCalledWith("accepted");
  });

  it("sorts the table by any column and the header says how", async () => {
    const onSort = jest.fn();
    const rows = data.sortAdrs(data.adrs480, "area", "asc").slice(0, 5);
    render(
      <AdrCollection
        state="ready"
        view="table"
        items={rows}
        total={480}
        counts={data.adrCounts(data.adrs480)}
        page={1}
        pageSize={60}
        query=""
        directory="docs/adr"
        sort={{ key: "area", dir: "asc" }}
        onSort={onSort}
      />,
    );
    expect(screen.getByRole("columnheader", { name: localized.text145 })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await user().click(
      within(screen.getByRole("columnheader", { name: /Autoren/ })).getByRole("button"),
    );
    expect(onSort).toHaveBeenCalledWith("authors");
    const areas = rows.map((r) => r.area);
    expect([...areas].sort((a, b) => a.localeCompare(b, "de"))).toEqual(areas);
    expect(data.sortAdrs(data.adrs480, "number", "asc")[0].number).toBe(1);
    const refs = data.sortAdrs(data.adrs480, "refs", "desc");
    expect(refs[0].refs).toBeGreaterThanOrEqual(refs[refs.length - 1].refs);
    const sup = data.sortAdrs(data.adrs480, "sup", "desc");
    expect(sup[0].supersededBy).toBeDefined();
    const by = data
      .sortAdrs(data.adrs480, "authors", "asc")
      .map((a) => (a.authors ?? []).join(", "));
    expect(by[0].localeCompare(by[by.length - 1], "de")).toBeLessThanOrEqual(0);
  });

  it("shows no percentage for an empty ADR directory", () => {
    render(
      <AdrCollection
        state="empty"
        view="timeline"
        items={[]}
        total={0}
        counts={{
          proposed: 0,
          accepted: 0,
          superseded: 0,
          rejected: 0,
          unknown: 0,
        }}
        page={1}
        pageSize={60}
        query=""
        directory="docs/adr"
      />,
    );
    expect(screen.getByText(labelText.text137)).toBeInTheDocument();
    expect(screen.queryByText(/0 %/)).not.toBeInTheDocument();
  });

  it("shows the supersession chain with the current ADR marked", async () => {
    const d = data.adrDetail(1);
    const chain = data.adrChain(3);
    const onLink = jest.fn();
    render(<AdrReader {...d} chain={chain} onLink={onLink} />);
    const nav = screen.getByRole("navigation", { name: localized.text147 });
    const items = within(nav).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveAttribute("aria-current", "step");
    await user().click(within(items[2]).getByRole("button"));
    expect(onLink).toHaveBeenCalledWith(`adr:${chain[2].number}`);
  });

  it("makes a running answer unmistakable", () => {
    render(<ChatTurn turn={data.turns("streaming")[1]} />);
    const live = screen.getByTestId("answer-live");
    expect(live).toHaveTextContent("Atlas antwortet");
    expect(live).toHaveTextContent("9 s");
    expect(live).toHaveTextContent(labelText.text138);
    expect(screen.queryByRole("toolbar", { name: remainingText.text83 })).not.toBeInTheDocument();
  });

  it("hides the composer when the host has no AI", () => {
    render(<ChatDock title="T" turns={[]} composer={composer()} hostError={localized.text153} />);
    expect(screen.getByText("claude").tagName).toBe("CODE");
    expect(screen.queryByLabelText(germanLabels.text52)).not.toBeInTheDocument();
  });

  it("names the current session with the right round count", () => {
    const sessions = data.sessionsVM();
    const cur = sessions[data.CURRENT_SESSION];
    render(
      <ChatFull
        title={cur.title}
        continuation="continued"
        turns={data.turns("answer")}
        composer={composer()}
        sessions={sessions}
        currentId={cur.id}
        query=""
      />,
    );
    expect(cur.rounds).toBe(1);
    expect(screen.getByText(/fortgesetzt · 1 Runde$/)).toBeInTheDocument();
    expect(new Set(sessions.map((s) => s.title)).size).toBe(sessions.length);
  });

  it("switches between the diagrams of one file", async () => {
    const onDiagram = jest.fn();
    const d = data.diagramById.d2;
    render(
      <ProcessWorkspace
        name="D"
        file="f"
        diagram={d}
        metrics={{ elements: 1, flows: 1, lanes: 1, paths: 1, longest: 1 }}
        panel="detail"
        findings={[]}
        outlineQuery=""
        zoom={100}
        linked={{}}
        diagrams={data.diagramTabs}
        activeDiagram="d2"
        onDiagram={onDiagram}
      />,
    );
    const nav = screen.getByRole("navigation", { name: remainingText.text99 });
    expect(within(nav).getByRole("button", { name: /Sidecar-Aufruf/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user().click(within(nav).getByRole("button", { name: labelText.text139 }));
    expect(onDiagram).toHaveBeenCalledWith("d3");
  });

  it("varies the gallery and keeps the findings count of the real file", () => {
    const sizes = new Set(data.processes.map((p) => p.shapes));
    expect(sizes.size).toBeGreaterThan(3);
    expect(data.processes[0].warnings).toBe(data.processFindings.length);
    expect(data.adrs480.some((a) => /Fassung/.test(a.title))).toBe(false);
    expect(new Set(data.adrs480.map((a) => a.title)).size).toBe(480);
  });

  it("closes the palette on mobile and puts hit counts against the whole", async () => {
    const onClose = jest.fn();
    render(<CommandPalette query="a" groups={data.paletteHits("a")} mobile onClose={onClose} />);
    await user().click(screen.getByRole("button", { name: localized.text154 }));
    expect(onClose).toHaveBeenCalled();
    expect(
      screen.getByText(new RegExp(`${germanLabels.text64}${nf(data.adrs480.length)}`)),
    ).toBeInTheDocument();
  });
});

describe("English source text", () => {
  it("renders the decisions board in English without a provider", () => {
    const counts = data.adrCounts(data.adrs480);
    expect(counts.accepted).toBeGreaterThan(0);
    renderInEnglish(
      <AdrCollection
        state="ready"
        view="board"
        items={data.adrs480}
        total={480}
        counts={counts}
        page={1}
        pageSize={60}
        query=""
        directory="docs/adr"
      />,
    );
    expect(screen.getByRole("heading", { name: "Decisions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New decision" })).toBeInTheDocument();
    const col = screen.getByRole("region", { name: "accepted" });
    expect(
      within(col).getByRole("button", { name: `${counts.accepted - BOARD_CAP} more` }),
    ).toBeInTheDocument();
    expect(screen.queryByText(labelText.text81)).not.toBeInTheDocument();
  });

  it("renders the chat welcome and the empty palette in English", () => {
    renderInEnglish(
      <ChatDock
        title="New"
        turns={[]}
        composer={composer()}
        suggestions={data.SUGGESTIONS}
        roleName="Development"
      />,
    );
    expect(screen.getByText("What do you want to know?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New conversation" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Question to Atlas" })).toBeInTheDocument();
    renderInEnglish(<CommandPalette query="zzz" groups={[]} nearest={["zoo"]} />);
    expect(screen.getByText("No matches for “zzz”")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask Atlas: “zzz”" })).toBeInTheDocument();
    expect(screen.getByText("Did you mean")).toBeInTheDocument();
  });

  it("renders the process gallery in English", () => {
    renderInEnglish(
      <ProcessCollection
        state="ready"
        view="gallery"
        items={data.processes.slice(0, 2)}
        total={36}
        page={1}
        pageSize={12}
        query=""
        withWarnings={15}
      />,
    );
    expect(screen.getByText("15 of 36 files have parser findings.")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /^Thumbnail / })).toHaveLength(2);
  });
});

describe("unmeasured and unknown plugin facts", () => {
  it("tells unknown ADR authors apart from none", () => {
    const items = data.adrs480.slice(0, 2);
    renderInEnglish(
      <AdrCollection
        state="ready"
        view="table"
        items={[
          { ...items[0], authors: null },
          { ...items[1], authors: [] },
        ]}
        total={2}
        counts={data.adrCounts(items)}
        page={1}
        pageSize={60}
        query=""
        activeStatus={null}
        directory="docs/adr"
      />,
    );
    const unknown = screen.getByTestId("adr-authors-unknown");
    expect(unknown).toHaveTextContent("—");
    expect(unknown).toHaveAttribute("title", "authors unknown");
    expect(screen.getByTestId("adr-authors-none")).toHaveTextContent("no author named");
  });

  it("leaves an unknown session time and continuation out of the session line", () => {
    const sessions = data
      .sessionsVM()
      .map((s, i) => (i === 0 ? { ...s, when: undefined, continuation: undefined } : s));
    renderInEnglish(
      <ChatFull
        title="T"
        turns={data.turns("answer")}
        composer={composer()}
        sessions={sessions}
        currentId={sessions[1].id}
        query=""
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Sessions" });
    const row = within(nav).getAllByRole("button", { name: new RegExp(sessions[0].title) })[0];
    expect(row).toHaveTextContent(new RegExp(`${sessions[0].title}${sessions[0].rounds} rounds?$`));
  });
});

describe("process canvas draws the sidecar's vocabulary", () => {
  const g = data.shapeGallery;
  const shape = (id: string) => screen.getByTestId(`shape-${id}`);
  const symbol = (id: string) => screen.getByTestId(`symbol-${id}`).getAttribute("data-symbol");

  it("draws events by kind with their trigger symbol", () => {
    renderInEnglish(<ProcessCanvas diagram={g} label="All shapes" />);
    expect(shape("S1")).toHaveAttribute("data-form", "circle");
    expect(symbol("S1")).toBe("message");
    expect(screen.getByRole("button", { name: "Intermediate event (catching): Payment in" })).toBe(
      shape("IC"),
    );
    expect(within(shape("IC")).getByTestId("symbol-IC")).toHaveAttribute("data-symbol", "message");
    expect(shape("IC").querySelectorAll("circle").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId("symbol-IT")).toHaveAttribute("data-filled", "true");
    expect(symbol("IT")).toBe("signal");
    expect(symbol("E1")).toBe("terminate");
    expect(screen.getByRole("button", { name: "Boundary event: Late" })).toBe(shape("B1"));
    expect(symbol("B1")).toBe("timer");
    expect(
      within(shape("B1")).getByText((_, el) => el?.getAttribute("data-border") === "double"),
    ).toBeInTheDocument();
    expect(shape("B1").querySelector(".t-d-bpmn--dashed")).not.toBeNull();
  });

  it("draws gateways by kind", () => {
    renderInEnglish(<ProcessCanvas diagram={g} label="All shapes" />);
    expect(screen.getByRole("button", { name: "Parallel gateway: unnamed" })).toBe(shape("G1"));
    expect(symbol("G1")).toBe("parallel");
    expect(symbol("EG")).toBe("event-based");
    expect(symbol("XG")).toBe("exclusive");
    expect(symbol("IG")).toBe("inclusive");
    for (const id of ["G1", "EG", "XG", "IG"])
      expect(shape(id)).toHaveAttribute("data-form", "diamond");
  });

  it("gives each outline row the glyph of its kind and names an unnamed element by its kind", async () => {
    const at = (id: string, kind: string, label: string, x: number) => ({
      id,
      kind,
      label,
      x,
      y: 40,
      w: kind.endsWith("Gateway") ? 50 : kind.endsWith("Event") ? 36 : 100,
      h: kind.endsWith("Gateway") ? 50 : kind.endsWith("Event") ? 36 : 80,
      lane: "P",
    });
    const diagram = {
      box: { x: 0, y: 0, w: 900, h: 200 },
      edges: [],
      shapes: [
        { id: "P", kind: "participant", label: "Order", x: 0, y: 0, w: 900, h: 200 },
        at("S", "startEvent", "Order in", 20),
        at("T", "userTask", "Check order", 100),
        at("X", "exclusiveGateway", "", 260),
        at("PG", "parallelGateway", "", 360),
        at("E", "endEvent", "", 460),
      ],
    };
    const props = {
      name: "D",
      file: "f.bpmn",
      diagram,
      metrics: { elements: 5, flows: 0, lanes: 1, paths: 1, longest: 1 },
      panel: "detail" as const,
      findings: [],
      zoom: 100,
      linked: {},
    };
    const { rerender } = render(<ProcessWorkspace {...props} outlineQuery="" />);
    const outline = screen.getByRole("navigation", { name: remainingText.text91 });
    const row = (name: string) => within(outline).getByRole("button", { name });
    const glyph = (name: string) => row(name).querySelector("svg[data-kind]");
    expect(row("Exklusives Gateway")).toBeInTheDocument();
    expect(row(labelText.text140)).toBeInTheDocument();
    expect(row(labelText.text141)).toBeInTheDocument();
    expect(within(outline).queryByText(localized.text155)).not.toBeInTheDocument();
    expect(glyph("Exklusives Gateway")).toHaveAttribute("data-form", "diamond");
    expect(glyph(labelText.text140)).toHaveAttribute("data-form", "diamond");
    expect(glyph("Check order")).toHaveAttribute("data-form", "roundrect");
    expect(glyph("Order in")).toHaveAttribute("data-form", "circle");
    expect(glyph(labelText.text141)).toHaveAttribute("data-form", "circle");
    expect(glyph("Exklusives Gateway")?.querySelector("path")).not.toBeNull();
    rerender(<ProcessWorkspace {...props} outlineQuery={labelText.text142} />);
    const filtered = screen.getByRole("navigation", { name: remainingText.text91 });
    expect(within(filtered).getByRole("button", { name: labelText.text140 })).toBeInTheDocument();
    expect(
      within(filtered).queryByRole("button", { name: "Exklusives Gateway" }),
    ).not.toBeInTheDocument();
    renderInEnglish(<ProcessWorkspace {...props} outlineQuery="" />);
    const english = screen.getByRole("navigation", { name: "Outline" });
    expect(within(english).getByRole("button", { name: "Exclusive gateway" })).toBeInTheDocument();
  });

  it("draws tasks with their type and markers, and subprocesses open or closed", () => {
    renderInEnglish(<ProcessCanvas diagram={g} label="All shapes" />);
    expect(symbol("T1")).toBe("user");
    expect(symbol("MT")).toBe("manual");
    expect(symbol("BR")).toBe("business-rule");
    expect(symbol("ST")).toBe("send");
    expect(symbol("RT")).toBe("receive");
    expect(symbol("SC")).toBe("script");
    for (const [id, m] of [
      ["T1", "loop"],
      ["T2", "parallel"],
      ["ST", "sequential"],
      ["RT", "compensation"],
      ["AH", "adhoc"],
      ["AH", "collapsed"],
      ["C1", "collapsed"],
      ["CA", "collapsed"],
      ["TX", "collapsed"],
    ])
      expect(within(shape(id)).getByTestId(`marker-${id}-${m}`)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Subprocess: Pack" })).toBe(shape("SP1"));
    expect(shape("SP1").querySelector("[data-expanded]")).not.toBeNull();
    expect(shape("C1").querySelector("[data-expanded]")).toBeNull();
    expect(screen.queryByTestId("marker-SP1-collapsed")).not.toBeInTheDocument();
    const order = (a: string, b: string) =>
      shape(a).compareDocumentPosition(shape(b)) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(order("SP1", "T2")).toBeTruthy();
    expect(order("SP1", "B1")).toBeTruthy();
    expect(order("C1", "B1")).toBeTruthy();
    expect(shape("CA").querySelector("[data-thick]")).not.toBeNull();
    expect(shape("TX").querySelectorAll("rect").length).toBeGreaterThanOrEqual(2);
  });

  it("draws pools and lanes as labelled containers, data, a group and an annotation", () => {
    renderInEnglish(<ProcessCanvas diagram={g} label="All shapes" />);
    const pool = screen.getByRole("group", { name: "Participant: Shop" });
    expect(within(pool).getByText("Shop")).toBeInTheDocument();
    const lane = screen.getByRole("group", { name: "Lane: Sales" });
    expect(lane).toHaveAttribute("data-form", "lane");
    expect(within(lane).getByText("Sales")).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Participant: Carrier" })).getByTestId(
        "marker-P2-parallel",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Group: Fulfilment" })).toHaveAttribute(
      "data-form",
      "group",
    );
    expect(shape("DO")).toHaveAttribute("data-form", "document");
    expect(within(shape("DO")).getByTestId("marker-DO-collection")).toBeInTheDocument();
    expect(shape("DS")).toHaveAttribute("data-form", "datastore");
    expect(within(shape("TA")).getByText("Signed by the customer")).toBeInTheDocument();
  });

  it("draws message flows dashed with their own ends, and associations without an arrow", () => {
    renderInEnglish(<ProcessCanvas diagram={g} label="All shapes" />);
    const msg = screen.getByTestId("edge-M1");
    expect(msg).toHaveAttribute("data-stroke", "dashed");
    const line = msg.querySelector("polyline")!;
    expect(line).toHaveAttribute("marker-start", "url(#t-d-dot)");
    expect(line).toHaveAttribute("marker-end", "url(#t-d-open)");
    expect(within(msg).getByText("pickup order")).toBeInTheDocument();
    const assoc = screen.getByTestId("edge-A1");
    expect(assoc).toHaveAttribute("data-stroke", "dotted");
    expect(assoc.querySelector("polyline")).not.toHaveAttribute("marker-end");
    expect(screen.getByTestId("edge-F13")).toHaveAttribute("data-start", "slash");
    expect(screen.getByTestId("edge-F16")).toHaveAttribute("data-start", "diamond");
    expect(screen.getByTestId("edge-F1").querySelector("polyline")).toHaveAttribute(
      "marker-end",
      "url(#t-d-arrow)",
    );
  });

  it("keeps containers sharp while a selection dims the rest", () => {
    renderInEnglish(<ProcessCanvas diagram={g} label="All shapes" selected="T1" />);
    expect(shape("T1")).toHaveAttribute("data-state", "focus");
    expect(shape("G1")).toHaveAttribute("data-state", "related");
    expect(shape("RT")).toHaveAttribute("data-state", "dim");
    expect(shape("L1")).not.toHaveAttribute("data-state");
    expect(shape("SP1")).not.toHaveAttribute("data-state");
  });

  it("derives the look from the kind when a diagram has no sidecar vocabulary", () => {
    const legacy: typeof g = {
      box: { x: 0, y: 0, w: 400, h: 100 },
      shapes: [
        { id: "a", kind: "exclusiveGateway", label: "?", x: 0, y: 0, w: 50, h: 50 },
        { id: "b", kind: "serviceTask", label: "Do", x: 100, y: 0, w: 100, h: 60 },
        { id: "c", kind: "intermediateThrowEvent", label: "", x: 250, y: 0, w: 36, h: 36 },
        { id: "d", kind: "subProcess", label: "Sub", x: 300, y: 0, w: 100, h: 60 },
      ],
      edges: [
        {
          id: "x",
          kind: "association",
          label: "",
          points: [
            [0, 0],
            [10, 10],
          ],
        },
        {
          id: "y",
          kind: "messageFlow",
          label: "",
          points: [
            [0, 0],
            [10, 10],
          ],
        },
      ],
    };
    renderInEnglish(<ProcessCanvas diagram={legacy} label="Old" />);
    expect(symbol("a")).toBe("exclusive");
    expect(symbol("b")).toBe("service");
    expect(shape("c").querySelectorAll("circle")).toHaveLength(2);
    expect(shape("d").querySelector("[data-expanded]")).toBeNull();
    expect(screen.getByTestId("edge-x").querySelector("polyline")).not.toHaveAttribute(
      "marker-end",
    );
    expect(screen.getByTestId("edge-y")).toHaveAttribute("data-stroke", "dashed");
    expect(screen.getByTestId("edge-y").querySelector("polyline")).toHaveAttribute(
      "marker-end",
      "url(#t-d-arrow)",
    );
  });

  it("draws every trigger, task type and data symbol it knows, and a plain box for an unknown outline", () => {
    const triggers = [
      "message",
      "timer",
      "error",
      "escalation",
      "cancel",
      "compensation",
      "conditional",
      "link",
      "signal",
      "terminate",
      "multiple",
      "parallel-multiple",
    ];
    const events = triggers.flatMap((sym, i) => [
      {
        id: `c-${sym}`,
        kind: "intermediateCatchEvent",
        label: "",
        x: i * 50,
        y: 0,
        w: 36,
        h: 36,
        form: "circle",
        border: "double",
        symbol: sym,
      },
      {
        id: `t-${sym}`,
        kind: "intermediateThrowEvent",
        label: "",
        x: i * 50,
        y: 50,
        w: 36,
        h: 36,
        form: "circle",
        border: "double",
        symbol: sym,
        filled: true,
      },
    ]);
    const others = [
      {
        id: "gc",
        kind: "complexGateway",
        label: "",
        x: 0,
        y: 100,
        w: 50,
        h: 50,
        form: "diamond",
        symbol: "complex",
      },
      {
        id: "gs",
        kind: "eventBasedGateway",
        label: "",
        x: 60,
        y: 100,
        w: 50,
        h: 50,
        form: "diamond",
        symbol: "event-based-start",
      },
      {
        id: "gp",
        kind: "eventBasedGateway",
        label: "",
        x: 120,
        y: 100,
        w: 50,
        h: 50,
        form: "diamond",
        symbol: "parallel-event-based-start",
      },
      {
        id: "ri",
        kind: "receiveTask",
        label: "Start on mail",
        x: 180,
        y: 100,
        w: 100,
        h: 60,
        form: "roundrect",
        symbol: "receive-instantiate",
      },
      {
        id: "di",
        kind: "dataInput",
        label: "In",
        x: 300,
        y: 100,
        w: 36,
        h: 50,
        form: "document",
        symbol: "input",
      },
      {
        id: "do",
        kind: "dataOutput",
        label: "Out",
        x: 350,
        y: 100,
        w: 36,
        h: 50,
        form: "document",
        symbol: "output",
      },
      {
        id: "ev",
        kind: "subProcess",
        label: "On error",
        x: 400,
        y: 100,
        w: 200,
        h: 100,
        form: "roundrect",
        border: "dotted",
      },
      {
        id: "xx",
        kind: "choreographyTask",
        label: "Unknown",
        x: 620,
        y: 100,
        w: 100,
        h: 60,
        form: "rect",
      },
    ];
    renderInEnglish(
      <ProcessCanvas
        diagram={{ box: { x: 0, y: 0, w: 720, h: 200 }, shapes: [...events, ...others], edges: [] }}
        label="Symbols"
      />,
    );
    for (const sym of triggers) {
      expect(symbol(`c-${sym}`)).toBe(sym);
      expect(screen.getByTestId(`symbol-t-${sym}`)).toHaveAttribute("data-filled", "true");
    }
    expect(symbol("gc")).toBe("complex");
    expect(symbol("gs")).toBe("event-based-start");
    expect(symbol("gp")).toBe("parallel-event-based-start");
    expect(symbol("ri")).toBe("receive-instantiate");
    expect(symbol("di")).toBe("input");
    expect(symbol("do")).toBe("output");
    expect(shape("ev").querySelector(".t-d-bpmn--dotted")).not.toBeNull();
    expect(within(shape("ev")).getByText("On error")).toBeInTheDocument();
    expect(shape("xx")).toHaveAttribute("data-form", "rect");
    expect(screen.getByRole("button", { name: "choreographyTask: Unknown" })).toBe(shape("xx"));
  });

  it("names the new kinds in German", () => {
    render(<ProcessCanvas diagram={g} label={germanLabels.text65} />);
    expect(screen.getByRole("button", { name: "Randereignis: Late" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: labelText.text143 })).toBeInTheDocument();
  });
});

describe("long ADRs fold, the header reads as facts and the status is a label", () => {
  const words = (n: number, w = labelText.text144) => Array.from({ length: n }, () => w).join(" ");
  const long = [
    labelText.text145 + words(10),
    labelText.text146,
    words(200),
    localized.text156,
    words(200),
    "### 2.1 Unterpunkt",
    words(50),
    labelText.text147,
    words(100),
  ].join("\n\n");
  const adr = {
    number: 2,
    title: localized.text157,
    status: "proposed" as const,
    rawStatus: labelText.text148,
    date: "2026-09-20",
    file: "docs/adr/0002-sync-conflicts.md",
    authors: null,
  };

  it("folds H2 sections above 500 words: the first opens, the rest stay closed", () => {
    render(<AdrReader adr={adr} markdown={long} toc={[]} records={[]} />);
    const folds = screen.getAllByTestId("md-fold") as HTMLDetailsElement[];
    expect(folds).toHaveLength(3);
    expect(folds.map((f) => f.open)).toEqual([true, false, false]);

    expect(within(folds[1]).getByRole("heading", { name: "2.1 Unterpunkt" })).toBeInTheDocument();

    const summary = folds[1].querySelector("summary") as HTMLElement;
    expect(within(summary).getByRole("heading", { name: localized.text158 })).toHaveAttribute(
      "id",
      localized.text159,
    );

    expect(screen.getByText(labelText.text149).closest("details")).toBeNull();
  });

  it("opens the section an address names, also around a nested heading", () => {
    const { rerender } = render(
      <AdrReader adr={adr} markdown={long} toc={[]} records={[]} anchor={labelText.text150} />,
    );
    let folds = screen.getAllByTestId("md-fold") as HTMLDetailsElement[];
    expect(folds.map((f) => f.open)).toEqual([true, false, true]);
    rerender(<AdrReader adr={adr} markdown={long} toc={[]} records={[]} anchor="2-1-unterpunkt" />);
    folds = screen.getAllByTestId("md-fold") as HTMLDetailsElement[];
    expect(folds[1].open).toBe(true);
  });

  it("stays open below the threshold", () => {
    render(<AdrReader adr={adr} markdown={labelText.text151} toc={[]} records={[]} />);
    expect(screen.queryAllByTestId("md-fold")).toHaveLength(0);
    expect(screen.getByRole("heading", { name: labelText.text27 })).toHaveAttribute(
      "id",
      labelText.text152,
    );
  });

  it("names headings with the ids the reader gives them", () => {
    expect(markdownHeadings("# A\n\n## B `c`\n\n## B `c`\n\ntext")).toEqual([
      { id: "a", label: "A", level: 1 },
      { id: "b-c", label: "B c", level: 2 },
      { id: "b-c-2", label: "B c", level: 2 },
    ]);
    render(<Markdown source={"## B `c`\n\n## B `c`"} anchors />);
    expect(screen.getAllByRole("heading").map((h) => h.id)).toEqual(["b-c", "b-c-2"]);
  });

  it("shows header lines as key and value, and the status as a label with nothing to press", () => {
    render(
      <AdrReader
        adr={adr}
        markdown={labelText.text153}
        facts={[
          [labelText.text154, "Meilenstein 3"],
          [labelText.text113, "`cmd/facet/lsp.go`, `bin/facet`"],
        ]}
        toc={[]}
        records={[]}
      />,
    );
    const front = screen.getByTestId("adr-front");
    const terms = within(front)
      .getAllByRole("term")
      .map((t) => t.textContent);
    expect(terms).toEqual([labelText.text154, labelText.text113]);
    expect(within(front).getByText("cmd/facet/lsp.go").tagName).toBe("CODE");
    const status = screen.getByTestId("adr-status");
    expect(status).toHaveTextContent(labelText.text155);
    expect(within(status).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Status/ })).not.toBeInTheDocument();
  });
});
