import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/ClauseSheet/ClauseSheet.spec.text";
import { render, screen } from "@testing-library/react";
import ClauseSheetWithLogic, { ClauseSheet, withClauseSheetLogic } from ".";

const clauses = [
  {
    id: "QH-01",
    requirement: localized.text1,
    measure: "quiet_hours_violations = 0",
  },
  { id: "QH-02", requirement: localized.text2, measure: "" },
];

describe("Unit tests for ClauseSheet", () => {
  it("renders one row per clause", () => {
    const { container } = render(
      <ClauseSheet
        containerStyle={{}}
        captionStyle={{}}
        caption={labelText.text308}
        clauses={[
          {
            key: "a",
            id: "QH-01",
            obligation: "MUSS",
            requirement: labelText.text309,
            measure: localized.text4,
            binding: true,
            rowStyle: {},
            idStyle: {},
            obligationStyle: {},
            requirementStyle: {},
            measureStyle: {},
          },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-clause]")).toHaveLength(1);
    expect(screen.getByText("MUSS")).toBeInTheDocument();
  });
});

describe("Unit tests for withClauseSheetLogic", () => {
  it("reads obligation from the wording", () => {
    render(<ClauseSheetWithLogic clauses={clauses} />);
    expect(screen.getByText("MUSS")).toBeInTheDocument();
    expect(screen.getByText("SOLL")).toBeInTheDocument();
  });

  it("defaults to MAY without a keyword", () => {
    render(
      <ClauseSheetWithLogic clauses={[{ id: "X", requirement: labelText.text41, measure: "m" }]} />,
    );
    expect(screen.getByText(localized.text7)).toBeInTheDocument();
  });

  it("emphasizes required clauses with font weight", () => {
    render(<ClauseSheetWithLogic clauses={clauses} />);
    expect(screen.getByText("MUSS")).toHaveStyle({ fontWeight: 500 });
  });

  it("reports missing measurements", () => {
    render(<ClauseSheetWithLogic clauses={clauses} />);
    expect(screen.getByText(localized.text10)).toHaveStyle({ color: "var(--signal)" });
  });

  it("counts clauses, obligations and gaps", () => {
    render(<ClauseSheetWithLogic clauses={clauses} />);
    expect(screen.getByText(localized.text12)).toBeInTheDocument();
  });

  it("states when measurements are complete", () => {
    render(<ClauseSheetWithLogic clauses={[clauses[0]]} />);
    expect(screen.getByText(localized.text14)).toBeInTheDocument();
  });

  it("filters for mandatory clauses", () => {
    const { container } = render(<ClauseSheetWithLogic clauses={clauses} onlyBinding />);
    expect(container.querySelectorAll("[data-clause]")).toHaveLength(1);
  });

  it("reports when no clause is recorded", () => {
    render(<ClauseSheetWithLogic clauses={[]} />);
    expect(screen.getByText(localized.text16)).toBeInTheDocument();
  });

  it("handles missing identifiers and wording", () => {
    render(<ClauseSheetWithLogic clauses={[{ id: "", requirement: "", measure: "" }]} />);
    expect(screen.getByText(labelText.text310)).toBeInTheDocument();
    expect(screen.getByText(localized.text18)).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withClauseSheetLogic(ClauseSheet).displayName).toBe("withClauseSheetLogic(ClauseSheet)");
  });
});

describe("Snapshot tests for ClauseSheet", () => {
  it("Policy", () => {
    const { container } = render(<ClauseSheetWithLogic clauses={clauses} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("describes the state transition", () => {
    const { container } = render(<ClauseSheetWithLogic clauses={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
