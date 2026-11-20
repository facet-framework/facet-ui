import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/ScenarioLedger/ScenarioLedger.spec.text";
import { render, screen } from "@testing-library/react";
import type { Scenario } from "../../../core";
import ScenarioLedgerWithLogic, { ScenarioLedger, withScenarioLedgerLogic } from ".";

const backed = { state: "backed", reason: "", unblockedBy: "" } as const;

const scenarios: Scenario[] = [
  {
    id: "task-added",
    steps: [{ keyword: "THEN", parent: "THEN", text: localized.text1 }],
    pre: { count: 0 },
    post: { count: 1 },
    proven: true,
    tests: [{ kind: "unit", id: "creates_task", proves: ["task-added"] }],
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

const unbackedScenario: Scenario = {
  id: "spending-breakdown-by-category",
  steps: [],
  pre: null,
  post: null,
  proven: false,
  tests: [],
  backing: {
    state: "unbacked",
    reason: localized.text2,
    unblockedBy: "billing/categories/assign-category",
  },
  deviation: null,
  audience: null,
  implementedBy: [],
  anchorsAdopted: false,
};

describe("Unit tests for ScenarioLedger", () => {
  it("renders a row with status and tests for each promise", () => {
    const { container } = render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption={localized.text4}
        entries={[
          {
            key: "a",
            id: "task-added",
            proven: true,
            status: "Test zugeordnet",
            state: labelText.text281,
            tests: [remainingText.text113],
            backingGap: "",
            implementedBy: [],
            implementedByLabel: "",
            implementedByState: "not-explained",
            statement: null,
            rowStyle: {},
            idStyle: {},
            statusStyle: {},
            stateStyle: {},
            testStyle: {},
            backingStyle: {},
            implementedStyle: {},
          },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-scenario]")).toHaveLength(1);
    expect(screen.getByText("Test zugeordnet")).toBeInTheDocument();
    expect(screen.getByText(remainingText.text113)).toBeInTheDocument();
  });

  it("reports when no test is named", () => {
    render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption={germanLabels.text167}
        entries={[
          {
            key: "a",
            id: "open",
            proven: false,
            status: localized.text7,
            state: localized.text8,
            tests: [],
            backingGap: "",
            implementedBy: [],
            implementedByLabel: "",
            implementedByState: "not-explained",
            statement: null,
            rowStyle: {},
            idStyle: {},
            statusStyle: {},
            stateStyle: {},
            testStyle: {},
            backingStyle: {},
            implementedStyle: {},
          },
        ]}
      />,
    );
    expect(screen.getByText(localized.text9)).toBeInTheDocument();
  });

  it("renders anchors that fulfill a promise", () => {
    render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption={germanLabels.text167}
        entries={[
          {
            key: "a",
            id: "task-added",
            proven: true,
            status: "Test zugeordnet",
            state: labelText.text281,
            tests: [remainingText.text113],
            backingGap: "",
            implementedBy: ["src/tasks/quick_add.ts:48 · export async function quickAdd()"],
            implementedByLabel: "",
            implementedByState: "implemented",
            statement: null,
            rowStyle: {},
            idStyle: {},
            statusStyle: {},
            stateStyle: {},
            testStyle: {},
            backingStyle: {},
            implementedStyle: {},
          },
        ]}
      />,
    );
    expect(
      screen.getByText("src/tasks/quick_add.ts:48 · export async function quickAdd()"),
    ).toBeInTheDocument();
    expect(document.querySelector('[data-implemented-by="implemented"]')).not.toBeNull();
  });

  it("reports assigned tests without an anchor claiming the promise", () => {
    render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption={germanLabels.text167}
        entries={[
          {
            key: "a",
            id: "task-added",
            proven: true,
            status: "Test zugeordnet",
            state: labelText.text281,
            tests: [remainingText.text113],
            backingGap: "",
            implementedBy: [],
            implementedByLabel: localized.text12,
            implementedByState: "gap",
            statement: null,
            rowStyle: {},
            idStyle: {},
            statusStyle: {},
            stateStyle: {},
            testStyle: {},
            backingStyle: {},
            implementedStyle: {},
          },
        ]}
      />,
    );
    expect(screen.getByText(localized.text13)).toBeInTheDocument();
    expect(document.querySelector('[data-implemented-by="gap"]')).not.toBeNull();
  });

  it("labels undeclared registries without implying a finding", () => {
    render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption={germanLabels.text167}
        entries={[
          {
            key: "a",
            id: "task-added",
            proven: true,
            status: "Test zugeordnet",
            state: labelText.text281,
            tests: [remainingText.text113],
            backingGap: "",
            implementedBy: [],
            implementedByLabel: localized.text15,
            implementedByState: "not-explained",
            statement: null,
            rowStyle: {},
            idStyle: {},
            statusStyle: {},
            stateStyle: {},
            testStyle: {},
            backingStyle: {},
            implementedStyle: {},
          },
        ]}
      />,
    );
    expect(screen.getByText(localized.text16)).toBeInTheDocument();
    expect(document.querySelector('[data-implemented-by="not-explained"]')).not.toBeNull();
    expect(document.querySelector('[data-implemented-by="gap"]')).toBeNull();
  });

  it("shows a gap only when one exists", () => {
    const base = {
      key: "a",
      id: "x",
      proven: false,
      status: localized.text18,
      state: localized.text19,
      tests: [],
      implementedBy: [],
      implementedByLabel: "",
      implementedByState: "not-explained" as const,
      statement: null,
      rowStyle: {},
      idStyle: {},
      statusStyle: {},
      stateStyle: {},
      testStyle: {},
      backingStyle: {},
      implementedStyle: {},
    };
    const { container, rerender } = render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption={germanLabels.text167}
        entries={[{ ...base, backingGap: "" }]}
      />,
    );
    expect(container.querySelector("[data-backing-gap]")).toBeNull();

    rerender(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption={germanLabels.text167}
        entries={[{ ...base, backingGap: localized.text20 }]}
      />,
    );
    expect(screen.getByText(localized.text21)).toBeInTheDocument();
  });
});

describe("Unit tests for withScenarioLedgerLogic", () => {
  it("counts promises, evidence and tests", () => {
    render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(screen.getByText(localized.text23)).toBeInTheDocument();
  });

  it("hides the animated value from screen readers", () => {
    render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(screen.getByText(labelText.text282)).toBeInTheDocument();
  });

  it("names missing state transitions", () => {
    render(<ScenarioLedgerWithLogic scenarios={[scenarios[1]]} />);
    expect(screen.getByText(localized.text25)).toBeInTheDocument();
  });

  it("translates test levels into German", () => {
    render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(screen.getByText(remainingText.text113)).toBeInTheDocument();
  });

  it("shows steps except in compact mode", () => {
    const { rerender } = render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(screen.getByText(localized.text28)).toBeInTheDocument();
    rerender(<ScenarioLedgerWithLogic scenarios={scenarios} compact />);
    expect(screen.queryByText(localized.text29)).not.toBeInTheDocument();
  });

  it("filters to gaps", () => {
    const { container } = render(<ScenarioLedgerWithLogic scenarios={scenarios} onlyGaps />);
    expect(container.querySelectorAll("[data-scenario]")).toHaveLength(1);
  });

  it("emphasizes unproven promises with font weight", () => {
    render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(screen.getByText("offline-added")).toHaveStyle({ fontWeight: 500 });
  });

  it("reports when no promise is described", () => {
    render(<ScenarioLedgerWithLogic scenarios={[]} />);
    expect(screen.getByText(localized.text33)).toBeInTheDocument();
  });

  it("names the reason and resolution only when data is missing", () => {
    const { container, rerender } = render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(container.querySelector("[data-backing-gap]")).toBeNull();

    rerender(<ScenarioLedgerWithLogic scenarios={[unbackedScenario]} />);
    expect(screen.getByText(localized.text35)).toBeInTheDocument();
  });

  it("labels gaps even without a reason", () => {
    render(
      <ScenarioLedgerWithLogic
        scenarios={[
          { ...unbackedScenario, backing: { state: "unbacked", reason: "", unblockedBy: "" } },
        ]}
      />,
    );
    expect(screen.getByText(localized.text37)).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withScenarioLedgerLogic(ScenarioLedger).displayName).toBe(
      "withScenarioLedgerLogic(ScenarioLedger)",
    );
  });
});

describe("Snapshot tests for ScenarioLedger", () => {
  it("register with a gap", () => {
    const { container } = render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("converts values into shares", () => {
    const { container } = render(<ScenarioLedgerWithLogic scenarios={scenarios} compact />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
