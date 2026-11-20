import { localized } from "../../../i18n/legacy/components/ui/ScenarioLedger/ScenarioLedger.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Scenario } from "../../../core";
import { taskflowRecord } from "../../../core/fixtures";
import ScenarioLedgerWithLogic from ".";

const meta: Meta<typeof ScenarioLedgerWithLogic> = {
  title: "FACET UI/ScenarioLedger",
  component: ScenarioLedgerWithLogic,
  parameters: {
    docs: {},
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

export const OnlyGaps: Story = {
  args: { scenarios: taskflowRecord("sync/queue/offline-queue").scenarios, onlyGaps: true },
};

export const Compact: Story = { args: { compact: true } };

export const Empty: Story = { args: { scenarios: [] } };

const backed = { state: "backed", reason: "", unblockedBy: "" } as const;

const implementationScenarios: Scenario[] = [
  {
    id: "task-added",
    steps: [{ keyword: "THEN", parent: "THEN", text: localized.text2 }],
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
    steps: [{ keyword: "THEN", parent: "THEN", text: localized.text3 }],
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

export const Implementation: Story = { args: { scenarios: implementationScenarios } };

export const ImplementationNotExplained: Story = {
  args: {
    scenarios: implementationScenarios.map((s) => ({ ...s, anchorsAdopted: false })),
  },
};
