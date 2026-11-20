import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";
import { CommandPalette, type PaletteGroup } from "./Palette";
import { AdrReader } from "./Adr";
import { PALETTE_COMMANDS, PALETTE_RECENT, adrDetail, paletteHits } from "./storyData";

const meta: Meta = { title: "Screens/D Plugins/Palette" };
export default meta;
type Story = StoryObj;

const BEHIND = adrDetail(2);

function groupsFor(q: string, per: number): PaletteGroup[] {
  if (!q) return PALETTE_RECENT;
  if (q.startsWith("/")) {
    const t = q.slice(1).toLowerCase();
    return PALETTE_COMMANDS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.title.toLowerCase().includes(t)),
    })).filter((g) => g.items.length);
  }
  return paletteHits(q.replace(/^#/, ""), per);
}

function Palette({
  mobile,
  initial,
  per = 4,
}: {
  mobile?: boolean;
  initial: string;
  per?: number;
}) {
  const [q, setQ] = useState(initial);
  const groups = groupsFor(q, per);
  const first = groups[0]?.items[0]?.key ?? null;
  const total = groups.reduce((a, g) => a + (g.total ?? g.items.length), 0);
  return (
    <Screen
      area="adr"
      mobile={mobile}
      overlay={
        <CommandPalette
          query={q}
          groups={groups}
          activeKey={first}
          total={total}
          nearest={["anchor", "atlas", "adr"]}
          mobile={mobile}
          onQuery={setQ}
        />
      }
    >
      <AdrReader {...BEHIND} mobile={mobile} />
    </Screen>
  );
}

export const EmptyRecent: Story = {
  name: "Empty Recent",
  ...desktop,
  render: () => <Palette initial="" />,
};
export const EmptyRecentMobile: Story = {
  name: "Empty Recent Mobile",
  ...mobile,
  render: () => <Palette mobile initial="" />,
};
export const Matches: Story = {
  ...desktop,
  render: () => <Palette initial="adr" />,
};
export const MatchesMobile: Story = {
  name: "Matches Mobile",
  ...mobile,
  render: () => <Palette mobile initial="adr" />,
};
export const NoMatches: Story = {
  name: "No Matches",
  ...desktop,
  render: () => <Palette initial="ankr" />,
};
export const NoMatchesMobile: Story = {
  name: "No Matches Mobile",
  ...mobile,
  render: () => <Palette mobile initial="ankr" />,
};
export const Commands: Story = {
  name: "Commands",
  ...desktop,
  render: () => <Palette initial="/" />,
};
export const CommandsMobile: Story = {
  name: "Commands Mobile",
  ...mobile,
  render: () => <Palette mobile initial="/" />,
};
export const ManyMatches: Story = {
  name: "Many Matches",
  ...desktop,
  render: () => <Palette initial="a" per={3} />,
};
export const ManyMatchesMobile: Story = {
  name: "Many Matches Mobile",
  ...mobile,
  render: () => <Palette mobile initial="a" per={2} />,
};
