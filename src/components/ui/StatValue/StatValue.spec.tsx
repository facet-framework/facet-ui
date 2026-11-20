import { render, screen } from "@testing-library/react";
import StatValueWithLogic, { StatValue, withStatValueLogic } from ".";

const styles = {
  containerStyle: {},
  labelStyle: {},
  valueStyle: {},
  hintStyle: {},
};

describe("Unit tests for StatValue", () => {
  it("shows label, value and classification", () => {
    render(<StatValue {...styles} label="Backed" value="31/38" hint="Tasks with a test" />);
    expect(screen.getByText("Backed")).toBeInTheDocument();
    expect(screen.getByText("31/38")).toBeInTheDocument();
    expect(screen.getByText("Tasks with a test")).toBeInTheDocument();
  });

  it("leaves out the classification when none is given", () => {
    const { container } = render(<StatValue {...styles} label="Teams" value="4" />);
    expect(container.querySelectorAll("span")).toHaveLength(2);
  });

  it("accepts arbitrary nodes as the value", () => {
    render(<StatValue {...styles} label="Open" value={<b>16</b>} />);
    expect(screen.getByText("16").tagName).toBe("B");
  });
});

describe("Unit tests for withStatValueLogic", () => {
  it("sets tabular figures for the value", () => {
    render(<StatValueWithLogic label="Backed" value="31/38" />);
    expect(screen.getByText("31/38")).toHaveStyle({ fontVariantNumeric: "tabular-nums" });
  });

  it("colours by meaning", () => {
    render(<StatValueWithLogic label="Overdue" value="2" meaning="due" />);
    expect(screen.getByText("2")).toHaveStyle({ color: "var(--due)" });
  });

  it("knows three sizes", () => {
    const { rerender } = render(<StatValueWithLogic label="A" value="1" size="compact" />);
    expect(screen.getByText("1")).toHaveStyle({ fontSize: "var(--text-lead)" });
    rerender(<StatValueWithLogic label="A" value="1" size="stage" />);
    expect(screen.getByText("1")).toHaveStyle({ fontSize: "var(--text-hero)" });
  });

  it("keeps label and value on one line", () => {
    render(<StatValueWithLogic label="Very long factual label" value="1" />);
    expect(screen.getByText("Very long factual label")).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("passes props through", () => {
    render(<StatValueWithLogic label="A" value="1" data-testid="metric" />);
    expect(screen.getByTestId("metric")).toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withStatValueLogic(StatValue).displayName).toBe("withStatValueLogic(StatValue)");
  });
});

describe("Snapshot tests for StatValue", () => {
  it("regular metric", () => {
    const { container } = render(
      <StatValueWithLogic label="Backed" value="31/38" hint="Tasks with a test" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("overdue metric on the stage", () => {
    const { container } = render(
      <StatValueWithLogic size="stage" meaning="due" label="Overdue" value="2" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
