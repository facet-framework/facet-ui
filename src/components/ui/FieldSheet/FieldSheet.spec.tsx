import { render, screen } from "@testing-library/react";
import FieldSheetWithLogic, { FieldSheet, withFieldSheetLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const fields = [
  { name: "id", type: "uuid", sensitivity: "internal", retention: "" },
  { name: "title", type: "string", sensitivity: "pii", retention: "30d after deletion" },
  { name: "note", type: "string", sensitivity: "pii", retention: "" },
];

describe("Unit tests for FieldSheet", () => {
  it("renders one row per field", () => {
    const { container } = render(
      <FieldSheet
        containerStyle={{}}
        captionStyle={{}}
        caption="1 field"
        fields={[
          {
            key: "a",
            name: "id",
            type: "uuid",
            sensitivity: "internal",
            retention: "—",
            open: false,
            rowStyle: {},
            nameStyle: {},
            typeStyle: {},
            sensitivityStyle: {},
            retentionStyle: {},
          },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-field]")).toHaveLength(1);
    expect(screen.getByText("uuid")).toBeInTheDocument();
  });
});

describe("Unit tests for withFieldSheetLogic", () => {
  it("translates the sensitivity into plain words", () => {
    render(<FieldSheetWithLogic fields={fields} />);
    expect(screen.getAllByText("personal data")).toHaveLength(2);
    expect(screen.getByText("internal")).toBeInTheDocument();
  });

  it("turns missing retention on personal data into a finding", () => {
    render(<FieldSheetWithLogic fields={fields} />);
    expect(screen.getByText("no retention set")).toHaveStyle({
      color: "var(--signal)",
    });
  });

  it("keeps internal fields without retention quiet", () => {
    const { container } = render(<FieldSheetWithLogic fields={[fields[0]]} />);
    expect(container.querySelector('[data-field="id"]')).toHaveTextContent("—");
  });

  it("counts fields, personal data and gaps", () => {
    render(<FieldSheetWithLogic fields={fields} />);
    expect(
      screen.getByText("3 fields · 2 with personal data. 1 of them without retention."),
    ).toBeInTheDocument();
  });

  it("reports complete retention", () => {
    render(<FieldSheetWithLogic fields={[fields[1]]} />);
    expect(screen.getByText(/Each of them has a retention/)).toBeInTheDocument();
  });

  it("says so when no field holds personal data", () => {
    render(<FieldSheetWithLogic fields={[fields[0]]} />);
    expect(screen.getByText("1 fields, none with personal data.")).toBeInTheDocument();
  });

  it("filters to personal data", () => {
    const { container } = render(<FieldSheetWithLogic fields={fields} onlyPii />);
    expect(container.querySelectorAll("[data-field]")).toHaveLength(2);
  });

  it("additionally emphasises personal data through weight", () => {
    render(<FieldSheetWithLogic fields={fields} />);
    expect(screen.getAllByText("personal data")[0]).toHaveStyle({ fontWeight: 500 });
  });

  it("copes without name and type", () => {
    render(
      <FieldSheetWithLogic fields={[{ name: "", type: "", sensitivity: "", retention: "" }]} />,
    );
    expect(screen.getByText("Field 1")).toBeInTheDocument();
    expect(screen.getByText("no type")).toBeInTheDocument();
  });

  it("says so when no fields are described", () => {
    render(<FieldSheetWithLogic fields={[]} />);
    expect(screen.getByText("No fields described.")).toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withFieldSheetLogic(FieldSheet).displayName).toBe("withFieldSheetLogic(FieldSheet)");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<FieldSheetWithLogic fields={fields} />);
    expect(screen.getAllByText("personenbezogen")).toHaveLength(2);
    expect(screen.getByText("keine Aufbewahrung festgelegt")).toBeInTheDocument();
    expect(
      screen.getByText("3 Felder · 2 mit Personenbezug. 1 davon ohne Aufbewahrung."),
    ).toBeInTheDocument();
  });
});

describe("Snapshot tests for FieldSheet", () => {
  it("with personal data", () => {
    const { container } = render(<FieldSheetWithLogic fields={fields} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("without fields", () => {
    const { container } = render(<FieldSheetWithLogic fields={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
