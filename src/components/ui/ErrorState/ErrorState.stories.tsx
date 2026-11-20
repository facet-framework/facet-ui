import { localized } from "../../../i18n/legacy/components/ui/ErrorState/ErrorState.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { YamlError } from "../../../core";
import ErrorStateWithLogic from ".";

const meta: Meta<typeof ErrorStateWithLogic> = {
  title: "FACET UI/ErrorState",
  component: ErrorStateWithLogic,
  parameters: {
    docs: {},
  },
  args: {
    error: new YamlError('"key: value" erwartet, found "- lose Row"', 41),
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

export const WithoutFile: Story = { args: { path: undefined } };

export const HostError: Story = {
  args: { error: new Error(localized.text2), path: undefined, onRetry: undefined },
};
