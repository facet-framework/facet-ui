import type { Meta, StoryObj } from "@storybook/react-vite";
import SurfaceWithLogic from ".";
import Text from "../Text";
import { color } from "../../../design-system/tokens";

const meta: Meta<typeof SurfaceWithLogic> = {
  title: "Primitives/Surface",
  component: SurfaceWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Area instead of box: tone, an edge as a hairline, optionally a rail on the left. No rounding, no shadows.",
      },
    },
  },
  args: {
    padding: "s4",
    children: <Text variant="meta">Quick add · 4 of 4 promises with a mapped test</Text>,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Default area that carries content. */
export const Surface: Story = {};

/** Tinted area of the context column. */
export const Context: Story = { args: { tone: "tint" } };

/** Active row in the register. */
export const Active: Story = { args: { tone: "tint2", rail: color.signal } };

/** A row with a lifecycle rail and a hairline on top. */
export const WithRail: Story = { args: { edge: "top", rail: color.plan } };

/** Own scroll area — the page still scrolls only once. */
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
