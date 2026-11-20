import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import ProofMatrixWithLogic, { ProofMatrix, withProofMatrixLogic } from ".";
import type { Scenario } from "../../../core";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

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
  it("renders the header, the answer line and one row per promise", () => {
    const { container } = render(
      <ProofMatrix
        containerStyle={{}}
        headerStyle={{}}
        headCellStyle={{}}
        captionStyle={{}}
        columns={["Unit"]}
        caption="1 of 2 with a mapped test"
        rows={[
          {
            key: "a",
            scenario: "task-added",
            proven: true,
            rowStyle: {},
            labelStyle: {},
            cells: [{ key: "a:unit", count: 2, style: {}, title: "task-added · Unit: 2 tests" }],
          },
        ]}
      />,
    );
    expect(screen.getByText("1 of 2 with a mapped test")).toBeInTheDocument();
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

  it("leaves cells without evidence empty", () => {
    const { container } = render(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(container.querySelector('[data-cell="offline-added:unit"]')).toHaveTextContent("");
  });

  it("phrases the answer line from counts", () => {
    render(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(
      screen.getByText("1 of 2 promises have a mapped test — one without a test."),
    ).toBeInTheDocument();
  });

  it("reports full coverage", () => {
    render(<ProofMatrixWithLogic scenarios={[scenarios[0]]} />);
    expect(screen.getByText("All 1 promises have a mapped test.")).toBeInTheDocument();
  });

  it("says so when no promise is described", () => {
    render(<ProofMatrixWithLogic scenarios={[]} />);
    expect(screen.getByText("No promise described.")).toBeInTheDocument();
  });

  it("filters to promises without evidence", () => {
    const { container } = render(<ProofMatrixWithLogic scenarios={scenarios} onlyGaps />);
    expect(container.querySelectorAll("[data-scenario]")).toHaveLength(1);
    expect(container.querySelector("[data-scenario]")).toHaveAttribute(
      "data-scenario",
      "offline-added",
    );
  });

  it("names the evidence state of every cell in plain text", () => {
    const { container } = render(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(container.querySelector('[data-cell="offline-added:unit"]')).toHaveAttribute(
      "title",
      "offline-added · Unit: no test mapped",
    );
  });

  it("additionally emphasises unbacked promises through weight", () => {
    render(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(screen.getByText("offline-added")).toHaveStyle({ fontWeight: 500 });
  });

  it("accepts custom test levels", () => {
    render(<ProofMatrixWithLogic scenarios={scenarios} kinds={["unit"]} />);
    expect(screen.getByText("Unit")).toBeInTheDocument();
    expect(screen.queryByText("End-to-end")).not.toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withProofMatrixLogic(ProofMatrix).displayName).toBe("withProofMatrixLogic(ProofMatrix)");
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    const { container } = renderInGerman(<ProofMatrixWithLogic scenarios={scenarios} />);
    expect(
      screen.getByText(
        germanText.t("elements.proofMatrix.someMapped", {
          proven: "1",
          total: "2",
          gap: germanText.t("elements.proofMatrix.gap.one"),
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(germanText.t("core.label.testKind.unit"))).toBeInTheDocument();
    expect(container.querySelector('[data-cell="offline-added:unit"]')).toHaveAttribute(
      "title",
      `offline-added · ${germanText.t("core.label.testKind.unit")}: ${germanText.t("elements.proofMatrix.noTest")}`,
    );
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
