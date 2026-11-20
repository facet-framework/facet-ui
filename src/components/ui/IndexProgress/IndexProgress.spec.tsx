import { render, screen } from "@testing-library/react";
import { initialStatus, type IndexStatus } from "../../../core";
import IndexProgressWithLogic, { IndexProgress, withIndexProgressLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

function status(patch: Partial<IndexStatus> = {}): IndexStatus {
  return { ...initialStatus(), ...patch };
}

/** The ladder is the first list, the file ticker the second. */
function tickerOf(lists: HTMLElement[]): HTMLElement {
  return lists[lists.length - 1];
}

describe("Unit tests for IndexProgress", () => {
  it("announces itself as a running operation", () => {
    render(
      <IndexProgress
        containerStyle={{}}
        brandMarkStyle={{}}
        titleStyle={{}}
        originStyle={{}}
        ladderStyle={{}}
        captionStyle={{}}
        tickerStyle={{}}
        tickerRowStyles={[]}
        title="Reading the records"
        origin="/repo"
        phases={[]}
        percent={40}
        progressLabel="7 of 17"
        caption="7 of 17 records read"
        ticker={[]}
        busy
      />,
    );

    const node = screen.getByRole("status");
    expect(node).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("progressbar", { name: "7 of 17" })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });

  it("leaves out the origin line when the host names none", () => {
    render(
      <IndexProgress
        containerStyle={{}}
        brandMarkStyle={{}}
        titleStyle={{}}
        originStyle={{}}
        ladderStyle={{}}
        captionStyle={{}}
        tickerStyle={{}}
        tickerRowStyles={[]}
        title="Waiting for the facet server"
        origin=""
        phases={[]}
        percent={null}
        progressLabel="Waiting for the facet server"
        caption=""
        ticker={[]}
        busy
      />,
    );

    expect(screen.queryByText("/repo")).not.toBeInTheDocument();
  });
});

describe("Unit tests for withIndexProgressLogic", () => {
  it("names the running step", () => {
    render(<IndexProgressWithLogic status={status({ phase: "index" })} />);
    expect(screen.getByText("Searching the entry points in code")).toBeInTheDocument();
  });

  it("shows the measured share of the running phase", () => {
    render(<IndexProgressWithLogic status={status({ phase: "index", done: 300, total: 1200 })} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  });

  it("stays at zero with an unknown reference size instead of inventing a share", () => {
    render(<IndexProgressWithLogic status={status({ phase: "enumerate", done: 812 })} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("812 files found")).toBeInTheDocument();
  });

  it("counts files with a thousands separator", () => {
    render(
      <IndexProgressWithLogic
        status={status({ phase: "index", done: 1204, total: 2481, anchors: 37 })}
      />,
    );
    expect(screen.getByText("1,204 of 2,481 files searched · 37 anchors")).toBeInTheDocument();
  });

  it("marks done, running and open steps differently", () => {
    render(<IndexProgressWithLogic status={status({ phase: "records" })} />);

    const rows = screen.getAllByRole("listitem");
    // Connection and configuration come before "Read records", the model after it.
    expect(rows[0]).toHaveTextContent("✓");
    expect(rows[2]).toHaveTextContent("▸");
    expect(rows[5]).toHaveTextContent("·");
  });

  it("keeps the most recently read files, newest first", () => {
    const { rerender } = render(
      <IndexProgressWithLogic status={status({ phase: "index", file: "src/a.ts" })} />,
    );
    rerender(<IndexProgressWithLogic status={status({ phase: "index", file: "src/b.ts" })} />);

    expect(tickerOf(screen.getAllByRole("list", { hidden: true })).textContent).toBe(
      "src/b.tssrc/a.ts",
    );
  });

  it("limits the ticker to the requested length", () => {
    const { rerender } = render(
      <IndexProgressWithLogic status={status({ phase: "index", file: "a" })} historyLength={2} />,
    );
    rerender(
      <IndexProgressWithLogic status={status({ phase: "index", file: "b" })} historyLength={2} />,
    );
    rerender(
      <IndexProgressWithLogic status={status({ phase: "index", file: "c" })} historyLength={2} />,
    );

    expect(tickerOf(screen.getAllByRole("list", { hidden: true })).textContent).toBe("cb");
  });

  it("names root and registry as the origin", () => {
    render(
      <IndexProgressWithLogic status={status()} root="/projects/taskflow" registry="storefront" />,
    );
    expect(screen.getByText("/projects/taskflow · Registry storefront")).toBeInTheDocument();
  });

  it("reports the finished run as no longer running", () => {
    render(
      <IndexProgressWithLogic
        status={status({ phase: "ready", records: 17, files: 2481, anchors: 37 })}
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "false");
    expect(screen.getByText("17 records · 2,481 files · 37 anchors")).toBeInTheDocument();
  });

  it("gives a meaningful displayName", () => {
    expect(withIndexProgressLogic(IndexProgress).displayName).toBe(
      "withIndexProgressLogic(IndexProgress)",
    );
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(
      <IndexProgressWithLogic
        status={status({ phase: "index", done: 1204, total: 2481, anchors: 37 })}
        registry="storefront"
        root="/repo"
      />,
    );
    expect(screen.getByText("Suche die Einstiege im Code")).toBeInTheDocument();
    expect(screen.getByText("1.204 von 2.481 Dateien durchsucht · 37 Anker")).toBeInTheDocument();
    expect(screen.getByText("/repo · Registry storefront")).toBeInTheDocument();
    expect(screen.getByText("Anker suchen")).toBeInTheDocument();
  });
});

describe("Snapshot tests for IndexProgress", () => {
  it("records are being read", () => {
    const { container } = render(
      <IndexProgressWithLogic
        status={status({
          phase: "records",
          file: "docs/facets/features/tasks/create/quick-add.yaml",
          done: 7,
          total: 17,
          records: 7,
        })}
        root="/projects/taskflow"
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("anchors are being searched", () => {
    const { container } = render(
      <IndexProgressWithLogic
        status={status({
          phase: "index",
          file: "crates/sync/src/queue.rs",
          done: 1204,
          total: 2481,
          records: 17,
          anchors: 37,
        })}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
