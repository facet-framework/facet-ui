import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/ProofMatrix/ProofMatrix.spec.text";
import { render, screen } from "@testing-library/react";
import ProofMatrixWithLogic, { ProofMatrix, withProofMatrixLogic } from ".";
import type { Scenario } from "../../../core";

const backed = { state: "backed", reason: "", unblockedBy: "" } as const;

const scenarios: Scenario[] = [
  {
    id: "task-added",
    steps: [],
    pre: null,
    post: null,
    proven: true,
    tests: [
      { kind: "unit", id: "parses_input", proves: ["task-added"] },
      { kind: "unit", id: "creates_task", proves: ["task-added"] },
      { kind: "e2e", id: "quick_add_flow", proves: ["task-added"] },
    ],
    backing: backed,
    deviation: null,
    audience: null,
    implementedBy: [],
    anchorsAdopted: false,
  },
  {
    id: "offline-added",
    steps: [],
    pre: null,
    post: null,
    proven: false,
    tests: [],
    backing: backed,
    deviation: null,
    audience: null,
    implementedBy: [],
    anchorsAdopted: false,
  },
];

describe("Unit tests for ProofMatrix", () => {
  it("renders the heading, summary and one row per promise", () => {
    const { container } = render(
      <ProofMatrix
        containerStyle={{}}
        headerStyle={{}}
        headCellStyle={{}}
        captionStyle={{}}
        columns={[remainingText.text18]}
        caption={localized.text2}
        rows={[
          {
            key: "a",
            scenario: "task-added",
            proven: true,
            rowStyle: {},
            labelStyle: {},
            cells: [{ key: "a:unit", count: 2, style: {}, title: remainingText.text152 }],
          },
        ]}
      />,
    );
    expect(screen.getByText(localized.text3)).toBeInTheDocument();
    expect(container.querySelectorAll("[data-scenario]")).toHaveLength(1);
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("Unit tests for withProofMatrixLogic", () => {
  it("counts evidence per promise and level", () => {
    const { container } = render(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(container.querySelector('[data-cell="task-added:unit"]')).toHaveTextContent("2");
    expect(container.querySelector('[data-cell="task-added:e2e"]')).toHaveTextContent("1");
  });

  it("leaves cells empty without evidence", () => {
    const { container } = render(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(container.querySelector('[data-cell="offline-added:unit"]')).toHaveTextContent("");
  });

  it("builds the summary from counts", () => {
    render(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(screen.getByText(localized.text7)).toBeInTheDocument();
  });

  it("reports full coverage", () => {
    render(<ProofMatrixWithLogic scenarios={[scenarios[0]]} />);
    expect(screen.getByText(localized.text9)).toBeInTheDocument();
  });

  it("reports when no promise is described", () => {
    render(<ProofMatrixWithLogic scenarios={[]} />);
    expect(screen.getByText(localized.text11)).toBeInTheDocument();
  });

  it("filters to promises without evidence", () => {
    const { container } = render(<ProofMatrixWithLogic scenarios={scenarios} onlyGaps />);
    expect(container.querySelectorAll("[data-scenario]")).toHaveLength(1);
    expect(container.querySelector("[data-scenario]")).toHaveAttribute(
      "data-scenario",
      "offline-added",
    );
  });

  it("labels year boundaries", () => {
    const { container } = render(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(container.querySelector('[data-cell="offline-added:unit"]')).toHaveAttribute(
      "title",
      localized.text13,
    );
  });

  it("also emphasizes unproven promises with font weight", () => {
    render(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(screen.getByText("offline-added")).toHaveStyle({ fontWeight: 500 });
  });

  it("describes each cell's evidence", () => {
    render(<ProofMatrixWithLogic scenarios={scenarios} kinds={["unit"]} />);
    expect(screen.getByText(remainingText.text18)).toBeInTheDocument();
    expect(screen.queryByText(germanLabels.text113)).not.toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withProofMatrixLogic(ProofMatrix).displayName).toBe("withProofMatrixLogic(ProofMatrix)");
  });
});

describe("Snapshot tests for ProofMatrix", () => {
  it("with a gap", () => {
    const { container } = render(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("without promises", () => {
    const { container } = render(<ProofMatrixWithLogic scenarios={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
