import type { Meta, StoryObj } from "@storybook/react-vite";
class InputError extends Error {
  constructor(
    message: string,
    public line: number,
  ) {
    super(message);
    this.name = "InputError";
  }
}
import ErrorStateWithLogic from ".";

const meta: Meta<typeof ErrorStateWithLogic> = {
  title: "FACET UI/ErrorState",
  component: ErrorStateWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Errors need an origin: file, line, reason, way back. A broken item never replaces the whole application.",
      },
    },
  },
  args: {
    error: new InputError('"key: value" expected, found "- loose line"', 41),
    path: "docs/facets/features/tasks/create/quick-add.yaml",
    onRetry: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 520 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InvalidYaml: Story = {};

/** Without a file, at least the line remains. */
export const WithoutFile: Story = { args: { path: undefined } };

/** An arbitrary error without a line number. */
export const HostError: Story = {
  args: { error: new Error("Repo not reachable"), path: undefined, onRetry: undefined },
};
