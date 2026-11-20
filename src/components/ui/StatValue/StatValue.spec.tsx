import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/StatValue/StatValue.spec.text";
import { render, screen } from "@testing-library/react";
import StatValueWithLogic, { StatValue, withStatValueLogic } from ".";

const styles = {
  containerStyle: {},
  labelStyle: {},
  valueStyle: {},
  hintStyle: {},
};

describe("Unit tests for StatValue", () => {
  it("shows the label, value and context", () => {
    render(
      <StatValue {...styles} label={labelText.text236} value="31/38" hint={localized.text2} />,
    );
    expect(screen.getByText(labelText.text236)).toBeInTheDocument();
    expect(screen.getByText("31/38")).toBeInTheDocument();
    expect(screen.getByText(localized.text3)).toBeInTheDocument();
  });

  it("omits context when absent", () => {
    const { container } = render(<StatValue {...styles} label="Teams" value="4" />);
    expect(container.querySelectorAll("span")).toHaveLength(2);
  });

  it("prioritizes deadlines", () => {
    render(<StatValue {...styles} label={localized.text5} value={<b>16</b>} />);
    expect(screen.getByText("16").tagName).toBe("B");
  });
});

describe("Unit tests for withStatValueLogic", () => {
  it("uses tabular digits for the value", () => {
    render(<StatValueWithLogic label={labelText.text236} value="31/38" />);
    expect(screen.getByText("31/38")).toHaveStyle({ fontVariantNumeric: "tabular-nums" });
  });

  it("colors by meaning", () => {
    render(<StatValueWithLogic label={localized.text8} value="2" meaning="deadline" />);
    expect(screen.getByText("2")).toHaveStyle({ color: "var(--deadline)" });
  });

  it("supports three sizes", () => {
    const { rerender } = render(<StatValueWithLogic label="A" value="1" size="compact" />);
    expect(screen.getByText("1")).toHaveStyle({ fontSize: "var(--text-lead)" });
    rerender(<StatValueWithLogic label="A" value="1" size="stage" />);
    expect(screen.getByText("1")).toHaveStyle({ fontSize: "var(--text-hero)" });
  });

  it("keeps the label and value on one line", () => {
    render(<StatValueWithLogic label="Sehr langes Sachlabel" value="1" />);
    expect(screen.getByText("Sehr langes Sachlabel")).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("accepts any node as the value", () => {
    render(<StatValueWithLogic label="A" value="1" data-testid={"metric"} />);
    expect(screen.getByTestId("metric")).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withStatValueLogic(StatValue).displayName).toBe("withStatValueLogic(StatValue)");
  });
});

describe("Snapshot tests for StatValue", () => {
  it("regular metric", () => {
    const { container } = render(
      <StatValueWithLogic label={labelText.text236} value="31/38" hint={localized.text13} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("overdue metric on the stage", () => {
    const { container } = render(
      <StatValueWithLogic size="stage" meaning="deadline" label={localized.text15} value="2" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
