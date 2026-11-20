import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";
import { reader } from "./data";
import type { SortDir } from "../../primitives/collection";
import { ProductPage, type ProductView } from "./ProductPage";
import { CREATION_DATES, DOMAINS, FEATURES } from "./data";

const meta: Meta = { title: "Screens/A Frame/Product" };
export default meta;
type Story = StoryObj;

const tablet = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "tablet" } },
} as const;

const EARLY = CREATION_DATES.findIndex((d) => d >= "2026-09-01");

function Product({
  mobile,
  view: v0 = "city",
  selected: s0 = null,
  time: t0,
  loading,
}: {
  mobile?: boolean;
  view?: ProductView;
  selected?: string | null;
  time?: number;
  loading?: boolean;
}) {
  const [view, setView] = useState<ProductView>(v0);
  const [selected, setSelected] = useState<string | null>(s0);
  const [time, setTime] = useState(t0 ?? CREATION_DATES.length - 1);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: "proven", dir: "asc" });
  return (
    <Screen area="product" mobile={mobile} {...reader("leadership")}>
      <ProductPage
        domains={DOMAINS}
        features={FEATURES}
        view={view}
        state={loading ? "loading" : "ready"}
        selected={selected}
        time={t0 != null ? { dates: CREATION_DATES, index: time } : undefined}
        mobile={mobile}
        page={page}
        sort={sort}
        onView={setView}
        onSelect={setSelected}
        onTime={setTime}
        onPage={setPage}
        onSort={(key) =>
          setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))
        }
      />
    </Screen>
  );
}

const PICK = "workspace/board/column";

export const CityTablet: Story = { ...tablet, render: () => <Product /> };
export const City: Story = { ...desktop, render: () => <Product /> };
export const CityMobile: Story = {
  ...mobile,
  render: () => <Product mobile />,
};
export const CitySelection: Story = {
  ...desktop,
  name: "City Selection",
  render: () => <Product selected={PICK} />,
};
export const CitySelectionMobile: Story = {
  ...mobile,
  name: "City Selection Mobile",
  render: () => <Product selected={PICK} mobile />,
};
export const Treemap: Story = {
  ...desktop,
  render: () => <Product view="treemap" />,
};
export const TreemapMobile: Story = {
  ...mobile,
  render: () => <Product view="treemap" mobile />,
};
export const List: Story = { ...desktop, render: () => <Product view="list" /> };
export const ListMobile: Story = {
  ...mobile,
  render: () => <Product view="list" mobile />,
};
export const TimeEarly: Story = {
  ...desktop,
  name: "Time Early",
  render: () => <Product time={EARLY} />,
};
export const TimeEarlyMobile: Story = {
  ...mobile,
  name: "Time Early Mobile",
  render: () => <Product time={EARLY} mobile />,
};
export const Loading: Story = {
  ...desktop,
  name: "Loading",
  render: () => <Product loading />,
};
export const LoadingMobile: Story = {
  ...mobile,
  name: "Loading Mobile",
  render: () => <Product loading mobile />,
};
