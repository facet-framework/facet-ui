import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import type { Scenario } from "../../../core";
import ScenarioLedgerWithLogic, { ScenarioLedger, withScenarioLedgerLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

const backed = { state: "backed", reason: "", unblockedBy: "" } as const;

const scenarios: Scenario[] = [
  {
    id: "task-added",
    steps: [{ keyword: "THEN", parent: "THEN", text: "the task is created" }],
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
    reason: "Transactions do not carry a category column yet.",
    unblockedBy: "billing/categories/assign-category",
  },
  deviation: null,
  audience: null,
  implementedBy: [],
  anchorsAdopted: false,
};

describe("Unit tests for ScenarioLedger", () => {
  it("renders one row per promise with state and tests", () => {
    const { container } = render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption="2 promises"
        entries={[
          {
            key: "a",
            id: "task-added",
            proven: true,
            status: "Test mapped",
            state: "before: count 0",
            tests: ["Unit · creates_task"],
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
    expect(screen.getByText("Test mapped")).toBeInTheDocument();
    expect(screen.getByText("Unit · creates_task")).toBeInTheDocument();
  });

  it("says so when no test is named", () => {
    render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption="1 promise"
        entries={[
          {
            key: "a",
            id: "open",
            proven: false,
            status: "without a test",
            state: "no state change described",
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
    expect(screen.getByText("no test named")).toBeInTheDocument();
  });

  it("renders the anchors that fulfil a promise", () => {
    render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption="1 promise"
        entries={[
          {
            key: "a",
            id: "task-added",
            proven: true,
            status: "Test mapped",
            state: "before: count 0",
            tests: ["Unit · creates_task"],
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

  it("marks the finding — test assigned, but no anchor claims the promise", () => {
    render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption="1 promise"
        entries={[
          {
            key: "a",
            id: "task-added",
            proven: true,
            status: "Test mapped",
            state: "before: count 0",
            tests: ["Unit · creates_task"],
            backingGap: "",
            implementedBy: [],
            implementedByLabel: "Test mapped, but no anchor claims this promise.",
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
    expect(screen.getByText("Test mapped, but no anchor claims this promise.")).toBeInTheDocument();
    expect(document.querySelector('[data-implemented-by="gap"]')).not.toBeNull();
  });

  it("says “not explained” instead of making an undeclared registry look like a finding", () => {
    render(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption="1 promise"
        entries={[
          {
            key: "a",
            id: "task-added",
            proven: true,
            status: "Test mapped",
            state: "before: count 0",
            tests: ["Unit · creates_task"],
            backingGap: "",
            implementedBy: [],
            implementedByLabel: "Not explained — this registry does not use @facet-proves: yet.",
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
    expect(
      screen.getByText("Not explained — this registry does not use @facet-proves: yet."),
    ).toBeInTheDocument();
    expect(document.querySelector('[data-implemented-by="not-explained"]')).not.toBeNull();
    expect(document.querySelector('[data-implemented-by="gap"]')).toBeNull();
  });

  it("shows the gap only when there is one", () => {
    const base = {
      key: "a",
      id: "x",
      proven: false,
      status: "without a test",
      state: "no state change described",
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
        caption="1 promise"
        entries={[{ ...base, backingGap: "" }]}
      />,
    );
    expect(container.querySelector("[data-backing-gap]")).toBeNull();

    rerender(
      <ScenarioLedger
        containerStyle={{}}
        captionStyle={{}}
        caption="1 promise"
        entries={[{ ...base, backingGap: "No evidence — reason" }]}
      />,
    );
    expect(screen.getByText("No evidence — reason")).toBeInTheDocument();
  });
});

describe("Unit tests for withScenarioLedgerLogic", () => {
  it("counts promises, evidence and tests", () => {
    render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(screen.getByText("2 promises · 1 with a mapped test · 1 test.")).toBeInTheDocument();
  });

  it("phrases the state change as plain text", () => {
    render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(screen.getByText("before: count 0 · after: count 1")).toBeInTheDocument();
  });

  it("calls missing state changes by name", () => {
    render(<ScenarioLedgerWithLogic scenarios={[scenarios[1]]} />);
    expect(screen.getByText("no state change described")).toBeInTheDocument();
  });

  it("translates the test level into plain words", () => {
    render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(screen.getByText("Unit · creates_task")).toBeInTheDocument();
  });

  it("shows the steps, except in the compact form", () => {
    const { rerender } = render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(screen.getByText("the task is created")).toBeInTheDocument();
    rerender(<ScenarioLedgerWithLogic scenarios={scenarios} compact />);
    expect(screen.queryByText("the task is created")).not.toBeInTheDocument();
  });

  it("filters to gaps", () => {
    const { container } = render(<ScenarioLedgerWithLogic scenarios={scenarios} onlyGaps />);
    expect(container.querySelectorAll("[data-scenario]")).toHaveLength(1);
  });

  it("emphasises unproven promises through weight", () => {
    render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(screen.getByText("offline-added")).toHaveStyle({ fontWeight: 500 });
  });

  it("says so when no promise is described", () => {
    render(<ScenarioLedgerWithLogic scenarios={[]} />);
    expect(screen.getByText("No promise described.")).toBeInTheDocument();
  });

  it("names cause and fix when the data is missing — otherwise nothing at all", () => {
    const { container, rerender } = render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(container.querySelector("[data-backing-gap]")).toBeNull();

    rerender(<ScenarioLedgerWithLogic scenarios={[unbackedScenario]} />);
    expect(
      screen.getByText(
        "No evidence — Transactions do not carry a category column yet. · resolved by billing/categories/assign-category",
      ),
    ).toBeInTheDocument();
  });

  it("does not leave a gap without a cause unlabelled", () => {
    render(
      <ScenarioLedgerWithLogic
        scenarios={[
          { ...unbackedScenario, backing: { state: "unbacked", reason: "", unblockedBy: "" } },
        ]}
      />,
    );
    expect(screen.getByText("No evidence — no reason given")).toBeInTheDocument();
  });

  it("gives a meaningful displayName", () => {
    expect(withScenarioLedgerLogic(ScenarioLedger).displayName).toBe(
      "withScenarioLedgerLogic(ScenarioLedger)",
    );
  });
});

describe("Unit tests for the German locale", () => {
  it("speaks German under the German locale", () => {
    renderInGerman(<ScenarioLedgerWithLogic scenarios={[...scenarios, unbackedScenario]} />);
    expect(
      screen.getByText(
        germanText.t("elements.scenarioLedger.caption", {
          total: "3",
          proven: "1",
          tests: "1 Test",
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${germanText.t("elements.scenarioLedger.before")}: count 0 · ${germanText.t("elements.scenarioLedger.after")}: count 1`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${germanText.t("core.label.testKind.unit")} · creates_task`),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(germanText.t("elements.scenarioLedger.noTest")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        germanText.t("elements.scenarioLedger.unbackedUnblockedBy", {
          reason: "Transactions do not carry a category column yet.",
          by: "billing/categories/assign-category",
        }),
      ),
    ).toBeInTheDocument();
  });
});

describe("Snapshot tests for ScenarioLedger", () => {
  it("register with a gap", () => {
    const { container } = render(<ScenarioLedgerWithLogic scenarios={scenarios} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("compact", () => {
    const { container } = render(<ScenarioLedgerWithLogic scenarios={scenarios} compact />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
