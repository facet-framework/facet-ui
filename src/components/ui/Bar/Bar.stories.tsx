import type { Meta, StoryObj } from "@storybook/react-vite";
import BarWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof BarWithLogic> = {
  title: "Atoms/Bar",
  component: BarWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Share bar for test coverage and domain comparisons. Full coverage turns green automatically.",
      },
    },
  },
  args: { value: 31, total: 38, label: "31 of 38 promises with a mapped test" },
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

/** Partially mapped — signal blue. */
export const Partial: Story = {};

/** Fully mapped — green, without the caller setting the colour. */
export const Complete: Story = {
  args: { value: 4, total: 4, label: "4 of 4 promises with a mapped test" },
};

/** No test mapping. */
export const Empty: Story = {
  args: { value: 0, total: 6, label: "0 of 6 promises with a mapped test" },
};

/** Without a reference total the bar stays empty instead of computing. */
export const WithoutReference: Story = { args: { value: 0, total: 0, label: "no promises" } };

/** Domain comparison — proximity makes the comparison readable. */
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
