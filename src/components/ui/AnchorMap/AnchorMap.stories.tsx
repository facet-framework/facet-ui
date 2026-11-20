import type { Meta, StoryObj } from "@storybook/react-vite";
import { SCAN, taskflowModel } from "../../../core/fixtures";
import AnchorMapWithLogic from ".";

const model = taskflowModel();

const meta: Meta<typeof AnchorMapWithLogic> = {
  title: "FACET UI/AnchorMap",
  component: AnchorMapWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Entry points in the code from the repo scan. Line numbers are marked with a dotted line because they do not come from the record. Drifted anchors come first.",
      },
    },
  },
  args: { anchors: model.anchorMap["sync/queue/offline-queue"] ?? [] },
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

export const EntryPoints: Story = {};

/** With drift — the changed file is on top and in red. */
export const WithDrift: Story = {
  args: {
    anchors: model.anchorMap["sync/conflict/last-write-wins"] ?? [],
    drift: SCAN.drift ?? [],
  },
};

/** Active but without an entry point — that is a finding, not an empty field. */
export const WithoutEntryPoint: Story = { args: { anchors: [], lifecycle: "active" } };

/** With a configured repo, paths become links with a line anchor. */
export const WithRepoLink: Story = {
  args: {
    buildHref: (anchor) =>
      `https://github.example.invalid/example/taskflow/blob/main/${anchor.path}#L${anchor.line}`,
  },
};
