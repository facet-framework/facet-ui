import { render, screen } from "@testing-library/react";
import FieldRowWithLogic, { FieldRow, withFieldRowLogic } from ".";

const styles = { containerStyle: {}, labelStyle: {}, valueStyle: {} };

describe("Unit tests for FieldRow", () => {
  it("renders label and value as a description pair", () => {
    render(<FieldRow {...styles} label="Cadence" value="quarterly" />);
    expect(screen.getByText("Cadence").tagName).toBe("DT");
    expect(screen.getByText("quarterly").tagName).toBe("DD");
  });

  it("accepts composite values", () => {
    render(<FieldRow {...styles} label="Promises" value={<b>4/4</b>} />);
    expect(screen.getByText("4/4").tagName).toBe("B");
  });
});

describe("Unit tests for withFieldRowLogic", () => {
  it("puts label and value into a two-column grid", () => {
    render(<FieldRowWithLogic label="A" value="1" data-testid="row" />);
    expect(screen.getByTestId("row")).toHaveStyle({
      gridTemplateColumns: "116px minmax(0, 1fr)",
    });
  });

  it("accepts its own label width", () => {
    render(<FieldRowWithLogic label="A" value="1" labelWidth={80} data-testid="row" />);
    expect(screen.getByTestId("row")).toHaveStyle({
      gridTemplateColumns: "80px minmax(0, 1fr)",
    });
  });

  it("emphasises the row via the label's colour and the value's weight", () => {
    render(<FieldRowWithLogic label="Runbook" value="missing" emphasis />);
    expect(screen.getByText("Runbook")).toHaveStyle({ color: "var(--signal)" });
    expect(screen.getByText("missing")).toHaveStyle({ color: "var(--ink)" });
  });

  it("stays muted without emphasis", () => {
    render(<FieldRowWithLogic label="Cadence" value="quarterly" />);
    expect(screen.getByText("Cadence")).toHaveStyle({ color: "var(--dim)" });
  });

  it("keeps line breaks in lists", () => {
    render(<FieldRowWithLogic label="IDs" value={"a\nb"} preserveLines />);
    expect(screen.getByText(/a/)).toHaveStyle({ whiteSpace: "pre-line" });
  });

  it("wraps long paths instead of breaking the grid", () => {
    render(<FieldRowWithLogic label="Path" value="packages/core/src/lists/store.ts" />);
    expect(screen.getByText("packages/core/src/lists/store.ts")).toHaveStyle({
      overflowWrap: "anywhere",
    });
  });

  it("assigns a descriptive displayName", () => {
    expect(withFieldRowLogic(FieldRow).displayName).toBe("withFieldRowLogic(FieldRow)");
  });
});

describe("Snapshot tests for FieldRow", () => {
  it("field row", () => {
    const { container } = render(<FieldRowWithLogic label="Cadence" value="quarterly" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("emphasised field row", () => {
    const { container } = render(<FieldRowWithLogic label="Runbook" value="missing" emphasis />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
