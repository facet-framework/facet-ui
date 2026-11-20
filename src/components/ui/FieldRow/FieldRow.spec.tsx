import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/FieldRow/FieldRow.spec.text";
import { render, screen } from "@testing-library/react";
import FieldRowWithLogic, { FieldRow, withFieldRowLogic } from ".";

const styles = { containerStyle: {}, labelStyle: {}, valueStyle: {} };

describe("Unit tests for FieldRow", () => {
  it("renders the label and value as a description pair", () => {
    render(<FieldRow {...styles} label={labelText.text293} value="quarterly" />);
    expect(screen.getByText(labelText.text293).tagName).toBe("DT");
    expect(screen.getByText("quarterly").tagName).toBe("DD");
  });

  it("partially filled", () => {
    render(<FieldRow {...styles} label={localized.text2} value={<b>4/4</b>} />);
    expect(screen.getByText("4/4").tagName).toBe("B");
  });
});

describe("Unit tests for withFieldRowLogic", () => {
  it("places the label and value in a two-column grid", () => {
    render(<FieldRowWithLogic label="A" value="1" data-testid={"row"} />);
    expect(screen.getByTestId("row")).toHaveStyle({
      gridTemplateColumns: "116px minmax(0, 1fr)",
    });
  });

  it("accepts a custom label width", () => {
    render(<FieldRowWithLogic label="A" value="1" labelWidth={80} data-testid={"row"} />);
    expect(screen.getByTestId("row")).toHaveStyle({
      gridTemplateColumns: "80px minmax(0, 1fr)",
    });
  });

  it("emphasizes the label color and value weight", () => {
    render(<FieldRowWithLogic label={labelText.text295} value={localized.text6} emphasis />);
    expect(screen.getByText(labelText.text295)).toHaveStyle({ color: "var(--signal)" });
    expect(screen.getByText(localized.text7)).toHaveStyle({ color: "var(--ink)" });
  });

  it("stays muted without emphasis", () => {
    render(<FieldRowWithLogic label={labelText.text293} value="quarterly" />);
    expect(screen.getByText(labelText.text293)).toHaveStyle({ color: "var(--dim)" });
  });

  it("preserves line breaks in lists", () => {
    render(<FieldRowWithLogic label="IDs" value={"a\nb"} preserveLines />);
    expect(screen.getByText(/a/)).toHaveStyle({ whiteSpace: "pre-line" });
  });

  it("wraps long paths within the grid", () => {
    render(<FieldRowWithLogic label={labelText.text10} value="packages/core/src/lists/store.ts" />);
    expect(screen.getByText("packages/core/src/lists/store.ts")).toHaveStyle({
      overflowWrap: "anywhere",
    });
  });

  it("sets a descriptive displayName", () => {
    expect(withFieldRowLogic(FieldRow).displayName).toBe("withFieldRowLogic(FieldRow)");
  });
});

describe("Snapshot tests for FieldRow", () => {
  it("Field row", () => {
    const { container } = render(<FieldRowWithLogic label={labelText.text293} value="quarterly" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Emphasized field row", () => {
    const { container } = render(
      <FieldRowWithLogic label={labelText.text295} value={localized.text12} emphasis />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
