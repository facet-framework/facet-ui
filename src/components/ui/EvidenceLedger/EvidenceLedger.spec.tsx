import { render, screen } from "@testing-library/react";
import EvidenceLedgerWithLogic, { EvidenceLedger, withEvidenceLedgerLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const evidence = [
  { date: "2025-11-04", kind: "measurement", note: "Deviation under 2 s" },
  { date: "2026-03-18", kind: "incident", note: "One device with 40 s deviation" },
];

const today = new Date("2026-07-30");

describe("Unit tests for EvidenceLedger", () => {
  it("renders one row per piece of evidence", () => {
    const { container } = render(
      <EvidenceLedger
        containerStyle={{}}
        captionStyle={{}}
        caption="1 piece of evidence"
        entries={[
          {
            key: "a",
            date: "2026-03-18",
            kind: "Incident",
            note: "Note",
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
    expect(screen.getByText("Incident")).toBeInTheDocument();
  });
});

describe("Unit tests for withEvidenceLedgerLogic", () => {
  it("puts the most recent evidence on top", () => {
    const { container } = render(<EvidenceLedgerWithLogic evidence={evidence} today={today} />);
    expect(container.querySelectorAll("[data-evidence]")[0]).toHaveTextContent("2026-03-18");
  });

  it("translates the kind of evidence", () => {
    render(<EvidenceLedgerWithLogic evidence={evidence} today={today} />);
    expect(screen.getByText("Measurement")).toBeInTheDocument();
    expect(screen.getByText("Incident")).toBeInTheDocument();
  });

  it("computes the age of the most recent evidence", () => {
    render(<EvidenceLedgerWithLogic evidence={evidence} today={today} />);
    expect(screen.getByText(/most recent 4 months ago/)).toBeInTheDocument();
  });

  it("turns outdated evidence into a deadline", () => {
    render(<EvidenceLedgerWithLogic evidence={evidence} today={today} staleMonths={3} />);
    expect(screen.getByText(/Unchecked for more than 3 months/)).toHaveStyle({
      color: "var(--due)",
    });
  });

  it("calls an assumption without evidence by its name", () => {
    render(<EvidenceLedgerWithLogic evidence={[]} />);
    expect(screen.getByText("No evidence — this assumption is an assertion.")).toHaveStyle({
      color: "var(--due)",
    });
  });

  it("copes with unreadable dates", () => {
    render(<EvidenceLedgerWithLogic evidence={[{ date: "", kind: "", note: "" }]} />);
    expect(screen.getByText(/none with a readable date/)).toBeInTheDocument();
    expect(screen.getByText("no date")).toBeInTheDocument();
    expect(screen.getByText("no kind")).toBeInTheDocument();
    expect(screen.getByText("no note")).toBeInTheDocument();
  });

  it("gets the grammatical number right for one piece of evidence", () => {
    render(<EvidenceLedgerWithLogic evidence={[evidence[1]]} today={today} />);
    expect(screen.getByText(/1 piece of evidence · /)).toBeInTheDocument();
  });

  it("gives a meaningful displayName", () => {
    expect(withEvidenceLedgerLogic(EvidenceLedger).displayName).toBe(
      "withEvidenceLedgerLogic(EvidenceLedger)",
    );
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<EvidenceLedgerWithLogic evidence={evidence} today={today} staleMonths={3} />);
    expect(screen.getByText("Vorfall")).toBeInTheDocument();
    expect(screen.getByText(/zuletzt vor 4 Monaten/)).toBeInTheDocument();
    expect(screen.getByText(/Seit über 3 Monaten ungeprüft/)).toBeInTheDocument();
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
