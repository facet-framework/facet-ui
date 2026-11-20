import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { PromisesPage, type PromisesView } from "./Promises";
import { openPromises, promiseItems, promiseRecords, promiseTotals } from "./data";
import { desk, mob, tab } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Promises" };
export default meta;

const SIZE = 25;

function Demo({
  initial,
  mobile,
  filtered,
}: {
  initial: PromisesView;
  mobile: boolean;
  filtered?: boolean;
}) {
  const [view, setView] = useState<PromisesView>(initial);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(filtered ? "anchor index" : "");
  const [openOnly, setOpenOnly] = useState(false);
  const [sel, setSel] = useState<string | null>(
    mobile || view === "mosaic"
      ? null
      : (initial === "open" ? openPromises[0] : promiseItems[3]).key,
  );
  const base = view === "open" ? openPromises : openOnly ? openPromises : promiseItems;
  const list = base.filter(
    (i) => !query || `${i.recordId} ${i.text}`.toLowerCase().includes(query.toLowerCase()),
  );
  const pageItems = view === "open" ? list : list.slice((page - 1) * SIZE, page * SIZE);
  return (
    <PromisesPage
      view={view}
      state={list.length ? "ready" : "filtered-empty"}
      totals={promiseTotals}
      items={pageItems}
      records={promiseRecords}
      page={page}
      pageSize={view === "open" ? Math.max(1, list.length) : SIZE}
      total={list.length}
      query={query}
      facets={[
        {
          key: "open",
          label: "open",
          count: promiseTotals.listedOpen,
          active: openOnly,
        },
        { key: "proven", label: "proven", count: promiseTotals.listedProven },
        { key: "unit", label: "Unit" },
        { key: "e2e", label: "E2E" },
      ]}
      selected={promiseItems.find((i) => i.key === sel) ?? null}
      suggestions={["core/anchors/index", "core/anchors/scan", "core/anchors/resolve"]}
      mobile={mobile}
      onView={(v) => {
        setView(v);
        setPage(1);
      }}
      onQuery={(q) => {
        setQuery(q);
        setPage(1);
      }}
      onFacet={(k) => k === "open" && setOpenOnly((o) => !o)}
      onReset={() => {
        setQuery("");
        setOpenOnly(false);
      }}
      onPage={setPage}
      onSelect={setSel}
    />
  );
}

export const List = desk("contents", "List", (m) => <Demo initial="list" mobile={m} />);
export const ListMobile = mob("contents", "List Mobile", (m) => <Demo initial="list" mobile={m} />);
export const Mosaic = desk("contents", "Mosaic", (m) => <Demo initial="mosaic" mobile={m} />);
export const MosaicMobile = mob("contents", "Mosaic Mobile", (m) => (
  <Demo initial="mosaic" mobile={m} />
));
export const OpenFirst = desk("contents", "Open First", (m) => (
  <Demo initial={"open"} mobile={m} />
));
export const OpenFirstMobile = mob("contents", "Open First Mobile", (m) => (
  <Demo initial={"open"} mobile={m} />
));
export const EmptyAfterFiltering = desk("contents", "Empty After Filtering", (m) => (
  <Demo initial="list" mobile={m} filtered />
));
export const EmptyAfterFilteringMobile = mob("contents", "Empty After Filtering Mobile", (m) => (
  <Demo initial="list" mobile={m} filtered />
));
export const ListTablet = tab("contents", "List", (m) => <Demo initial="list" mobile={m} />);
