import { localized } from "../../../i18n/legacy/components/ui/Bar/Bar.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import BarWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof BarWithLogic> = {
  title: "Atoms/Bar",
  component: BarWithLogic,
  parameters: {
    docs: {},
  },
  args: { value: 31, total: 38, label: localized.text2 },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Partial: Story = {};

export const Complete: Story = {
  args: { value: 4, total: 4, label: localized.text3 },
};

export const Empty: Story = {
  args: { value: 0, total: 6, label: localized.text4 },
};

export const WithoutReference: Story = { args: { value: 0, total: 0, label: localized.text5 } };

export const Areas: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 10, width: 280 }}>
      {(
        [
          ["tasks", 9, 11],
          ["sync", 5, 9],
          ["lists", 6, 6],
          ["reminders", 3, 5],
        ] as const
      ).map(([name, value, total]) => (
        <div key={name} style={{ display: "grid", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text variant="meta" tone="dim">
              {name}
            </Text>
            <Text variant="meta" mono tabular tone="soft">
              {value}/{total}
            </Text>
          </div>
          <BarWithLogic value={value} total={total} label={`${name}: ${value} of ${total}`} />
        </div>
      ))}
    </div>
  ),
};
