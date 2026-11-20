import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";
import { reader } from "./data";
import type { SortDir } from "../../primitives/collection";
import { CapabilityPage, type CapabilityPageView } from "./CapabilityPage";
import { capabilityData } from "./data";

const meta: Meta = { title: "Screens/A Frame/Capability" };
export default meta;
type Story = StoryObj;

function Capability({
  d,
  c,
  mobile,
  view: v0 = "field",
  query: q0 = "",
  empty,
}: {
  d: string;
  c: string;
  mobile?: boolean;
  view?: CapabilityPageView;
  query?: string;
  empty?: boolean;
}) {
  const [view, setView] = useState<CapabilityPageView>(v0);
  const [query, setQuery] = useState(q0);
  const [open, setOpen] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({
    key: "scenarios",
    dir: "desc",
  });
  const data = capabilityData(d, c);
  const props = empty ? { ...data, features: [], files: [], drift: [], tests: null } : data;
  return (
    <Screen area="product" mobile={mobile} {...reader("leadership")}>
      <CapabilityPage
        {...props}
        view={view}
        query={query}
        sort={sort}
        mobile={mobile}
        crumbOpen={open}
        onToggleCrumb={(k) => setOpen((o) => (o === k ? null : k))}
        page={page}
        onPage={setPage}
        onView={setView}
        onQuery={setQuery}
        onSort={(key) =>
          setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))
        }
      />
    </Screen>
  );
}

export const Overview: Story = {
  ...desktop,
  name: "Overview",
  render: () => <Capability d="lists" c="permissions" />,
};
export const OverviewMobile: Story = {
  ...mobile,
  name: "Overview Mobile",
  render: () => <Capability d="lists" c="permissions" mobile />,
};
export const Search: Story = {
  ...desktop,
  name: "Search",
  render: () => <Capability d="workspace" c="board" query="plugin" />,
};
export const SearchMobile: Story = {
  ...mobile,
  name: "Search Mobile",
  render: () => <Capability d="workspace" c="board" query="plugin" mobile />,
};
export const Table: Story = {
  ...desktop,
  render: () => <Capability d="workspace" c="board" view="table" />,
};
export const TableMobile: Story = {
  ...mobile,
  render: () => <Capability d="workspace" c="board" view="table" mobile />,
};
export const Empty: Story = {
  ...desktop,
  name: "Empty",
  render: () => <Capability d="delivery" c="ci" empty />,
};
export const EmptyMobile: Story = {
  ...mobile,
  name: "Empty Mobile",
  render: () => <Capability d="delivery" c="ci" empty mobile />,
};
