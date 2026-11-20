import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/SignalStack/SignalStack.spec.text";
import { render, screen } from "@testing-library/react";
import SignalStackWithLogic, { SignalStack, withSignalStackLogic } from ".";

const rec = { id: "a/b/c" } as never;

const slos = [
  { rec, name: "sync_latency", target: "p95 < 2s", window: "30d", query: "histogram_quantile()" },
];

const alerts = [
  { rec, name: "PushBacklog", condition: "queue > 1000", severity: "page", runbook: "" },
  { rec, name: "SyncStall", condition: "stalled > 5m", severity: "ticket", runbook: "docs/rb.md" },
];

describe("Unit tests for SignalStack", () => {
  it("renders one row per signal, carrying its kind", () => {
    const { container } = render(
      <SignalStack
        containerStyle={{}}
        captionStyle={{}}
        caption={labelText.text287}
        entries={[
          {
            key: "a",
            kind: "alert",
            name: "PushBacklog",
            detail: "queue > 1000",
            meta: "page",
            runbook: localized.text1,
            open: true,
            rowStyle: {},
            nameStyle: {},
            detailStyle: {},
            metaStyle: {},
            runbookStyle: {},
          },
        ]}
      />,
    );
    expect(container.querySelector('[data-kind="alert"]')).toBeInTheDocument();
    expect(screen.getByText("queue > 1000")).toBeInTheDocument();
  });
});

describe("Unit tests for withSignalStackLogic", () => {
  it("moves alerts without a runbook to the top", () => {
    const { container } = render(<SignalStackWithLogic slos={slos} alerts={alerts} />);
    expect(container.querySelectorAll("[data-signal]")[0]).toHaveTextContent("PushBacklog");
  });

  it("turns the missing runbook into a finding", () => {
    render(<SignalStackWithLogic alerts={alerts} />);
    expect(screen.getByText(localized.text2)).toHaveStyle({ color: "var(--signal)" });
  });

  it("counts SLOs, alerts and gaps", () => {
    render(<SignalStackWithLogic slos={slos} alerts={alerts} />);
    expect(screen.getByText(localized.text3)).toBeInTheDocument();
  });

  it("reports complete runbooks", () => {
    render(<SignalStackWithLogic slos={slos} alerts={[alerts[1]]} />);
    expect(screen.getByText(localized.text4)).toBeInTheDocument();
  });

  it("shows the target of an SLO", () => {
    render(<SignalStackWithLogic slos={slos} />);
    expect(screen.getByText(labelText.text288)).toBeInTheDocument();
  });

  it("filters to gaps", () => {
    const { container } = render(<SignalStackWithLogic slos={slos} alerts={alerts} onlyGaps />);
    expect(container.querySelectorAll("[data-signal]")).toHaveLength(1);
  });

  it("says so when nothing is measured", () => {
    render(<SignalStackWithLogic />);
    expect(screen.getByText(localized.text5)).toBeInTheDocument();
  });

  it("copes without name, condition and severity", () => {
    render(
      <SignalStackWithLogic
        alerts={[{ rec, name: "", condition: "", severity: "", runbook: "x" }]}
      />,
    );
    expect(screen.getByText(labelText.text289)).toBeInTheDocument();
    expect(screen.getByText(localized.text6)).toBeInTheDocument();
    expect(screen.getByText(localized.text7)).toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withSignalStackLogic(SignalStack).displayName).toBe("withSignalStackLogic(SignalStack)");
  });
});

describe("Snapshot tests for SignalStack", () => {
  it("operations with a gap", () => {
    const { container } = render(<SignalStackWithLogic slos={slos} alerts={alerts} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("nothing measured", () => {
    const { container } = render(<SignalStackWithLogic />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
