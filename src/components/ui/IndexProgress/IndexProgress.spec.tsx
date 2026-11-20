import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/IndexProgress/IndexProgress.spec.text";
import { render, screen } from "@testing-library/react";
import { initialStatus, type IndexStatus } from "../../../core";
import IndexProgressWithLogic, { IndexProgress, withIndexProgressLogic } from ".";

function status(patch: Partial<IndexStatus> = {}): IndexStatus {
  return { ...initialStatus(), ...patch };
}

function tickerOf(lists: HTMLElement[]): HTMLElement {
  return lists[lists.length - 1];
}

describe("Unit tests for IndexProgress", () => {
  it("announces an ongoing operation", () => {
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
        title={localized.text2}
        origin="/repo"
        phases={[]}
        percent={40}
        progressLabel={germanLabels.text176}
        caption={germanLabels.text177}
        ticker={[]}
        busy
      />,
    );

    const node = screen.getByRole("status");
    expect(node).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("progressbar", { name: germanLabels.text176 })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });

  it("omits source details when the host provides none", () => {
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
        title={germanLabels.text178}
        origin=""
        phases={[]}
        percent={null}
        progressLabel={germanLabels.text178}
        caption=""
        ticker={[]}
        busy
      />,
    );

    expect(screen.queryByText("/repo")).not.toBeInTheDocument();
  });
});

describe("Unit tests for withIndexProgressLogic", () => {
  it("names the current step", () => {
    render(<IndexProgressWithLogic status={status({ phase: "index" })} />);
    expect(screen.getByText(localized.text4)).toBeInTheDocument();
  });

  it("shows measured progress for the current phase", () => {
    render(<IndexProgressWithLogic status={status({ phase: "index", done: 300, total: 1200 })} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  });

  it("stays at zero when the total is unknown", () => {
    render(<IndexProgressWithLogic status={status({ phase: "enumerate", done: 812 })} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText(localized.text7)).toBeInTheDocument();
  });

  it("formats file counts with thousands separators", () => {
    render(
      <IndexProgressWithLogic
        status={status({ phase: "index", done: 1204, total: 2481, anchors: 37 })}
      />,
    );
    expect(screen.getByText(localized.text9)).toBeInTheDocument();
  });

  it("distinguishes completed, running and pending steps", () => {
    render(<IndexProgressWithLogic status={status({ phase: "records" })} />);

    const rows = screen.getAllByRole("listitem");

    expect(rows[0]).toHaveTextContent("✓");
    expect(rows[2]).toHaveTextContent("▸");
    expect(rows[5]).toHaveTextContent("·");
  });

  it("lists recently read files with the newest first", () => {
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

  it("names the root and registry as sources", () => {
    render(
      <IndexProgressWithLogic status={status()} root="/projects/taskflow" registry="storefront" />,
    );
    expect(screen.getByText("/projects/taskflow · Registry storefront")).toBeInTheDocument();
  });

  it("marks a completed run as no longer running", () => {
    render(
      <IndexProgressWithLogic
        status={status({ phase: "ready", records: 17, files: 2481, anchors: 37 })}
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "false");
    expect(screen.getByText(localized.text15)).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withIndexProgressLogic(IndexProgress).displayName).toBe(
      "withIndexProgressLogic(IndexProgress)",
    );
  });
});

describe("Snapshot tests for IndexProgress", () => {
  it("reading records", () => {
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

  it("searching for anchors", () => {
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
