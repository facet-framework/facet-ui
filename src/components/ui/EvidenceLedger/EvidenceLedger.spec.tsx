import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/EvidenceLedger/EvidenceLedger.spec.text";
import { render, screen } from "@testing-library/react";
import EvidenceLedgerWithLogic, { EvidenceLedger, withEvidenceLedgerLogic } from ".";

const evidence = [
  { date: "2025-11-04", kind: "measurement", note: labelText.text444 },
  { date: "2026-03-18", kind: "incident", note: localized.text1 },
];

const today = new Date("2026-07-30");

describe("Unit tests for EvidenceLedger", () => {
  it("renders one row per evidence item", () => {
    const { container } = render(
      <EvidenceLedger
        containerStyle={{}}
        captionStyle={{}}
        caption={localized.text3}
        entries={[
          {
            key: "a",
            date: "2026-03-18",
            kind: labelText.text438,
            note: labelText.text445,
            oldest: true,
            rowStyle: {},
            dateStyle: {},
            kindStyle: {},
            noteStyle: {},
          },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-evidence]")).toHaveLength(1);
    expect(screen.getByText(labelText.text438)).toBeInTheDocument();
  });
});

describe("Unit tests for withEvidenceLedgerLogic", () => {
  it("places the newest evidence first", () => {
    const { container } = render(<EvidenceLedgerWithLogic evidence={evidence} today={today} />);
    expect(container.querySelectorAll("[data-evidence]")[0]).toHaveTextContent("2026-03-18");
  });

  it("translates the evidence kind", () => {
    render(<EvidenceLedgerWithLogic evidence={evidence} today={today} />);
    expect(screen.getByText(labelText.text436)).toBeInTheDocument();
    expect(screen.getByText(labelText.text438)).toBeInTheDocument();
  });

  it("calculates the age of the newest evidence", () => {
    render(<EvidenceLedgerWithLogic evidence={evidence} today={today} />);
    expect(screen.getByText(labelText.text446)).toBeInTheDocument();
  });

  it("marks stale evidence as overdue", () => {
    render(<EvidenceLedgerWithLogic evidence={evidence} today={today} staleMonths={3} />);
    expect(screen.getByText(localized.text8)).toHaveStyle({
      color: "var(--deadline)",
    });
  });

  it("identifies assumptions without evidence", () => {
    render(<EvidenceLedgerWithLogic evidence={[]} />);
    expect(screen.getByText(localized.text10)).toHaveStyle({
      color: "var(--deadline)",
    });
  });

  it("handles unreadable dates", () => {
    render(<EvidenceLedgerWithLogic evidence={[{ date: "", kind: "", note: "" }]} />);
    expect(screen.getByText(localized.text12)).toBeInTheDocument();
    expect(screen.getByText(localized.text13)).toBeInTheDocument();
    expect(screen.getByText(localized.text14)).toBeInTheDocument();
    expect(screen.getByText(localized.text15)).toBeInTheDocument();
  });

  it("uses singular wording for one evidence item", () => {
    render(<EvidenceLedgerWithLogic evidence={[evidence[1]]} today={today} />);
    expect(screen.getByText(localized.text17)).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withEvidenceLedgerLogic(EvidenceLedger).displayName).toBe(
      "withEvidenceLedgerLogic(EvidenceLedger)",
    );
  });
});

describe("Snapshot tests for EvidenceLedger", () => {
  it("with evidence", () => {
    const { container } = render(<EvidenceLedgerWithLogic evidence={evidence} today={today} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("without evidence", () => {
    const { container } = render(<EvidenceLedgerWithLogic evidence={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
