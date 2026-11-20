import { localized } from "../../../i18n/legacy/components/ui/Surface/Surface.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import SurfaceWithLogic from ".";
import Text from "../Text";
import { color } from "../../../design-system/tokens";

const meta: Meta<typeof SurfaceWithLogic> = {
  title: "Primitives/Surface",
  component: SurfaceWithLogic,
  parameters: {
    docs: {},
  },
  args: {
    padding: "s4",
    children: <Text variant="meta">{localized.text2}</Text>,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Surface: Story = {};

export const Context: Story = { args: { tone: "tint" } };

export const Active: Story = { args: { tone: "tint2", rail: color.signal } };

export const WithRail: Story = { args: { edge: "top", rail: color.plan } };

export const ScrollArea: Story = {
  args: {
    scroll: true,
    style: { maxHeight: 120 },
    children: (
      <div style={{ display: "grid", gap: 8 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <Text key={i} variant="meta" mono tone="dim">
            record-{String(i + 1).padStart(2, "0")}
          </Text>
        ))}
      </div>
    ),
  },
};
