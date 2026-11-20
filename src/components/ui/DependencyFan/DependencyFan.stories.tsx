import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowModel } from "../../../core/fixtures";
import DependencyFanWithLogic from ".";

const model = taskflowModel();

const meta: Meta<typeof DependencyFanWithLogic> = {
  title: "FACET/DependencyFan",
  component: DependencyFanWithLogic,
  parameters: {
    docs: {},
  },
  args: { edges: model.edges, depth: model.depth, ghosts: model.ghosts },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Corpus: Story = {};

export const WithName: Story = {
  args: { labelOf: (id: string) => model.byId[id]?.label ?? id },
};

export const OpenReference: Story = {
  args: {
    edges: [
      { from: "tasks/edit/inline-edit", to: "tasks/create/quick-add" },
      { from: "tasks/create/quick-add", to: "search/fulltext/task-search" },
    ],
    ghosts: ["tasks/edit/inline-edit"],
    depth: undefined,
  },
};

export const Empty: Story = { args: { edges: [], ghosts: [] } };
