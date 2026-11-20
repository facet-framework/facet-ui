import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/FieldSheet/FieldSheet.spec.text";
import { render, screen } from "@testing-library/react";
import FieldSheetWithLogic, { FieldSheet, withFieldSheetLogic } from ".";

const fields = [
  { name: "id", type: "uuid", sensitivity: "internal", retention: "" },
  { name: "title", type: "string", sensitivity: "pii", retention: localized.text1 },
  { name: "note", type: "string", sensitivity: "pii", retention: "" },
];

describe("Unit tests for FieldSheet", () => {
  it("renders one row per field", () => {
    const { container } = render(
      <FieldSheet
        containerStyle={{}}
        captionStyle={{}}
        caption={labelText.text296}
        fields={[
          {
            key: "a",
            name: "id",
            type: "uuid",
            sensitivity: labelText.extra26,
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
  it("translates sensitivity into German", () => {
    render(<FieldSheetWithLogic fields={fields} />);
    expect(screen.getAllByText(labelText.text297)).toHaveLength(2);
    expect(screen.getByText(labelText.extra26)).toBeInTheDocument();
  });

  it("reports missing retention for personal data", () => {
    render(<FieldSheetWithLogic fields={fields} />);
    expect(screen.getByText(localized.text5)).toHaveStyle({
      color: "var(--signal)",
    });
  });

  it("keeps internal fields quiet without retention", () => {
    const { container } = render(<FieldSheetWithLogic fields={[fields[0]]} />);
    expect(container.querySelector('[data-field="id"]')).toHaveTextContent("—");
  });

  it("counts fields, personal data and gaps", () => {
    render(<FieldSheetWithLogic fields={fields} />);
    expect(screen.getByText(localized.text8)).toBeInTheDocument();
  });

  it("reports complete retention", () => {
    render(<FieldSheetWithLogic fields={[fields[1]]} />);
    expect(screen.getByText(localized.text10)).toBeInTheDocument();
  });

  it("reports when no field contains personal data", () => {
    render(<FieldSheetWithLogic fields={[fields[0]]} />);
    expect(screen.getByText(localized.text12)).toBeInTheDocument();
  });

  it("filtert auf Personenbezug", () => {
    const { container } = render(<FieldSheetWithLogic fields={fields} onlyPii />);
    expect(container.querySelectorAll("[data-field]")).toHaveLength(2);
  });

  it("also emphasizes personal data with font weight", () => {
    render(<FieldSheetWithLogic fields={fields} />);
    expect(screen.getAllByText(labelText.text297)[0]).toHaveStyle({ fontWeight: 500 });
  });

  it("handles missing names and types", () => {
    render(
      <FieldSheetWithLogic fields={[{ name: "", type: "", sensitivity: "", retention: "" }]} />,
    );
    expect(screen.getByText(labelText.text298)).toBeInTheDocument();
    expect(screen.getByText(localized.text15)).toBeInTheDocument();
  });

  it("reports when no fields are described", () => {
    render(<FieldSheetWithLogic fields={[]} />);
    expect(screen.getByText(localized.text17)).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withFieldSheetLogic(FieldSheet).displayName).toBe("withFieldSheetLogic(FieldSheet)");
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
