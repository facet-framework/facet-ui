import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Scenario } from "../../../core";
import { taskflowRecord } from "../../../core/fixtures";
import ScenarioLedgerWithLogic from ".";

const meta: Meta<typeof ScenarioLedgerWithLogic> = {
  title: "FACET UI/ScenarioLedger",
  component: ScenarioLedgerWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Per promise: steps, state changes and the tests that back it. If a test is missing, that is stated there — the row does not disappear.",
      },
    },
  },
  args: { scenarios: taskflowRecord("tasks/create/quick-add").scenarios },
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Register: Story = {};

/** Only the gaps. */
export const OnlyGaps: Story = {
  args: { scenarios: taskflowRecord("sync/queue/offline-queue").scenarios, onlyGaps: true },
};

/** Compact: without steps, for long lists. */
export const Compact: Story = { args: { compact: true } };

/** Without promises, the register says so. */
export const Empty: Story = { args: { scenarios: [] } };

const backed = { state: "backed", reason: "", unblockedBy: "" } as const;

/**
 * The third column, "Implemented by": three promises, three
 * different empty cells — none looks like another, because none means the same.
 */
const implementationScenarios: Scenario[] = [
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
    anchorsAdopted: true,
    implementedBy: [
      {
        path: "apps/mobile/src/tasks/quick_add.ts",
        line: 48,
        role: "primary",
        excerpt: "export async function quickAdd(input: string) {",
        proves: ["task-added"],
      },
    ],
  },
  {
    id: "offline-added",
    steps: [{ keyword: "THEN", parent: "THEN", text: "it is queued offline" }],
    pre: null,
    post: null,
    proven: true,
    tests: [{ kind: "unit", id: "queues_offline", proves: ["offline-added"] }],
    backing: backed,
    deviation: null,
    audience: null,
    anchorsAdopted: true,
    implementedBy: [],
  },
  {
    id: "quick-add-shortcut",
    steps: [],
    pre: null,
    post: null,
    proven: false,
    tests: [],
    backing: backed,
    deviation: null,
    audience: null,
    anchorsAdopted: true,
    implementedBy: [],
  },
];

/**
 * With a test mapping and fulfilled, with a test mapping but unfulfilled (the finding the
 * column brings) and open without an anchor — three rows, three statements.
 */
export const Implementation: Story = { args: { scenarios: implementationScenarios } };

/**
 * As long as no anchor in the whole scan carries `proves`, the column says "not
 * explained" instead of making an undeclared registry look like a finding.
 */
export const ImplementationNotExplained: Story = {
  args: {
    scenarios: implementationScenarios.map((s) => ({ ...s, anchorsAdopted: false })),
  },
};
