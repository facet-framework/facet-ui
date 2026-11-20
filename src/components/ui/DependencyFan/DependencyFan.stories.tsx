import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowModel } from "../../../core/fixtures";
import DependencyFanWithLogic from ".";

const model = taskflowModel();

const meta: Meta<typeof DependencyFanWithLogic> = {
  title: "FACET/DependencyFan",
  component: DependencyFanWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Dependencies fanned out: one row per record, on the left what it depends on, on the right what depends on it. As an edge list, the reader would have to assemble the graph in their head.",
      },
    },
  },
  args: { edges: model.edges, depth: model.depth, ghosts: model.ghosts },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The demo corpus, ordered by depth. */
export const Corpus: Story = {};

/** With readable names instead of ids. */
export const WithNames: Story = {
  args: { labelOf: (id: string) => model.byId[id]?.label ?? id },
};

/** A reference points at an id that no record carries. */
export const DanglingReference: Story = {
  args: {
    edges: [
      { from: "tasks/edit/inline-edit", to: "tasks/create/quick-add" },
      { from: "tasks/create/quick-add", to: "search/fulltext/task-search" },
    ],
    ghosts: ["tasks/edit/inline-edit"],
    depth: undefined,
  },
};

/** Nothing depends on anything. */
export const Empty: Story = { args: { edges: [], ghosts: [] } };
