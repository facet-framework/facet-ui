import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import ClauseSheetWithLogic, { ClauseSheet, withClauseSheetLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

const clauses = [
  {
    id: "QH-01",
    requirement: "Between 22:00 and 07:00 every notification MUST be held back.",
    measure: "quiet_hours_violations = 0",
  },
  { id: "QH-02", requirement: "Urgent alerts SHOULD be let through.", measure: "" },
];

describe("Unit tests for ClauseSheet", () => {
  it("renders one row per clause", () => {
    const { container } = render(
      <ClauseSheet
        containerStyle={{}}
        captionStyle={{}}
        caption="1 clause"
        clauses={[
          {
            key: "a",
            id: "QH-01",
            obligation: "MUST",
            requirement: "Wording",
            measure: "Measure",
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
    expect(screen.getByText("MUST")).toBeInTheDocument();
  });
});

describe("Unit tests for withClauseSheetLogic", () => {
  it("reads the obligation level from the wording", () => {
    render(<ClauseSheetWithLogic clauses={clauses} />);
    expect(screen.getByText("MUST")).toBeInTheDocument();
    expect(screen.getByText("SHOULD")).toBeInTheDocument();
  });

  it("falls back to MAY without a keyword", () => {
    render(<ClauseSheetWithLogic clauses={[{ id: "X", requirement: "Note", measure: "m" }]} />);
    expect(screen.getByText("MAY")).toBeInTheDocument();
  });

  it("emphasises mandatory clauses through weight", () => {
    render(<ClauseSheetWithLogic clauses={clauses} />);
    expect(screen.getByText("MUST")).toHaveStyle({ fontWeight: 500 });
  });

  it("reports missing metrics as a finding", () => {
    render(<ClauseSheetWithLogic clauses={clauses} />);
    expect(screen.getByText("no measure named — compliance cannot be checked")).toHaveStyle({
      color: "var(--signal)",
    });
  });

  it("counts clauses, obligation levels and gaps", () => {
    render(<ClauseSheetWithLogic clauses={clauses} />);
    expect(screen.getByText("2 clauses · 1 binding. 1 without a measure.")).toBeInTheDocument();
  });

  it("does not praise complete metrics but states them", () => {
    render(<ClauseSheetWithLogic clauses={[clauses[0]]} />);
    expect(screen.getByText(/Each has a measure/)).toBeInTheDocument();
  });

  it("filters to mandatory clauses", () => {
    const { container } = render(<ClauseSheetWithLogic clauses={clauses} onlyBinding />);
    expect(container.querySelectorAll("[data-clause]")).toHaveLength(1);
  });

  it("says so when no clause is recorded", () => {
    render(<ClauseSheetWithLogic clauses={[]} />);
    expect(screen.getByText("No clause recorded.")).toBeInTheDocument();
  });

  it("works without id and wording", () => {
    render(<ClauseSheetWithLogic clauses={[{ id: "", requirement: "", measure: "" }]} />);
    expect(screen.getByText("Clause 1")).toBeInTheDocument();
    expect(screen.getByText("no wording")).toBeInTheDocument();
  });

  it("reads German obligation wording and speaks German under the German locale", () => {
    renderInGerman(
      <ClauseSheetWithLogic
        clauses={[
          { id: "DE-1", requirement: germanText.t("core.requirement.bindingPattern"), measure: "" },
          {
            id: "DE-2",
            requirement: germanText.t("core.requirement.recommendedPattern"),
            measure: "length",
          },
        ]}
      />,
    );
    expect(screen.getByText(germanText.t("elements.clauseSheet.must"))).toBeInTheDocument();
    expect(screen.getByText(germanText.t("elements.clauseSheet.should"))).toBeInTheDocument();
    expect(
      screen.getByText(
        `${germanText.t("elements.clauseSheet.head", { total: 2, binding: 1 })} ${germanText.t("elements.clauseSheet.unmeasured", { count: 1 })}`,
      ),
    ).toBeInTheDocument();
  });

  it("reads German obligation wording as binding under the English default", () => {
    render(
      <ClauseSheetWithLogic
        clauses={[{ id: "DE-1", requirement: germanText.t("core.requirement.bindingPattern") }]}
      />,
    );
    expect(screen.getByText("MUST")).toBeInTheDocument();
  });

  it("gives a meaningful displayName", () => {
    expect(withClauseSheetLogic(ClauseSheet).displayName).toBe("withClauseSheetLogic(ClauseSheet)");
  });
});

describe("Snapshot tests for ClauseSheet", () => {
  it("policy", () => {
    const { container } = render(<ClauseSheetWithLogic clauses={clauses} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("empty", () => {
    const { container } = render(<ClauseSheetWithLogic clauses={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
