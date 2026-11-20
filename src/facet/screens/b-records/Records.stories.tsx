import { localized } from "../../../i18n/legacy/facet/screens/b-records/Records.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";

const tablet = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "tablet" } },
} as const;
import type { CollectionState, SortDir } from "../../primitives/collection";
import { RecordsPage, type RecordsView } from "./RecordsPage";
import type { LensTab } from "./RecordsLens";
import type { Lifecycle, RecordRow } from "./model";
import {
  MANY_ROWS,
  REAL_ROWS,
  applyFilters,
  distributionsFor,
  facetsFor,
  fieldGroups,
  filterChips,
  matrixRows,
  dossierOf,
  networkOf,
  search,
  sortRows,
  summaryOf,
  type Filters,
  type SortKey,
} from "./storyData";

const meta: Meta = { title: "Screens/B Records/Records" };
export default meta;
type Story = StoryObj;

type DemoProps = {
  mobile?: boolean;
  rows?: RecordRow[];
  view: RecordsView;
  query?: string;
  filters?: Filters;
  page?: number;
  pageSize?: number;
  state?: CollectionState;
  many?: boolean;
};

function Demo({
  mobile,
  rows = REAL_ROWS,
  view: v0,
  query: q0 = "",
  filters: f0 = {},
  page: p0 = 1,
  pageSize: s0 = 25,
  state,
  many,
}: DemoProps) {
  const [view, setView] = useState<RecordsView>(v0);
  const [query, setQuery] = useState(q0);
  const [filters, setFilters] = useState<Filters>(f0);
  const [page, setPage] = useState(p0);
  const [pageSize, setPageSize] = useState(s0);
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({
    key: "changedAt",
    dir: "desc",
  });
  const [focus, setFocus] = useState("workspace/board/label-limit");
  const [lensTab, setLensTab] = useState<LensTab>("promises");
  const [lensOpen, setLensOpen] = useState(0);
  const filtered = applyFilters(rows, filters);
  const matched = search(filtered, query);
  const sorted = sortRows(matched, sort.key as SortKey, sort.dir);
  const shown = mobile
    ? sorted.slice(0, page * pageSize).slice(0, 40)
    : sorted.slice((page - 1) * pageSize, page * pageSize);
  const loading = state === "loading";
  const effective: CollectionState = state ?? (matched.length === 0 ? "filtered-empty" : "ready");
  const toggle = (key: string) => {
    setPage(1);
    if (key === "drift") return setFilters((f) => ({ ...f, drift: !f.drift }));
    const [kind, value] = key.split(":");
    if (kind === "lc")
      return setFilters((f) => ({
        ...f,
        lifecycle: f.lifecycle === value ? undefined : (value as Lifecycle),
      }));
    setFilters((f) => ({ ...f, domain: f.domain === value ? undefined : value }));
  };
  return (
    <Screen area="records" mobile={mobile}>
      <RecordsPage
        state={effective}
        mobile={mobile}
        summary={
          loading
            ? {
                total: null,
                provenPct: null,
                drift: null,
                knowledgeOpen: null,
                domains: null,
                assumptions: null,
              }
            : summaryOf(rows)
        }
        matched={matched.length}
        query={query}
        view={view}
        facets={loading ? [] : facetsFor(rows, filters)}
        filters={filterChips(filters)}
        rows={shown}
        page={page}
        pageSize={pageSize}
        sort={sort}
        distributions={many ? distributionsFor(filtered) : undefined}
        field={fieldGroups(filtered, query)}
        matrix={matrixRows(filtered)}
        network={view === "network" ? networkOf(filtered, query) : undefined}
        lens={
          view === "lens"
            ? {
                focus: matched.some((r) => r.id === focus)
                  ? dossierOf(focus)
                  : matched[0]
                    ? dossierOf(matched[0].id)
                    : null,
                hits: query ? matched.slice(0, 5) : [],
                tab: lensTab,
                open: lensOpen,
              }
            : undefined
        }
        onFocus={(id) => {
          setFocus(id);
          setLensOpen(0);
        }}
        onLensTab={setLensTab}
        onLensUnfold={setLensOpen}
        suggestions={REAL_ROWS.filter(
          (r) => r.slug.startsWith("commit") || r.slug.startsWith("adr"),
        ).slice(0, 4)}
        onQuery={(q) => {
          setQuery(q);
          setPage(1);
        }}
        onView={setView}
        onFacet={toggle}
        onRemoveFilter={(k) => setFilters((f) => ({ ...f, [k]: undefined }))}
        onReset={() => {
          setFilters({});
          setQuery("");
        }}
        onSort={(key) =>
          setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }))
        }
        onPage={setPage}
        onPageSize={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        onCell={(domain) => setFilters((f) => ({ ...f, domain }))}
        onDistribution={(band, key) =>
          band === localized.text1
            ? setFilters((f) => ({ ...f, domain: key }))
            : setFilters((f) => ({ ...f, lifecycle: key as Lifecycle }))
        }
      />
    </Screen>
  );
}

export const Lens: Story = { ...desktop, render: () => <Demo view="lens" /> };
export const LensSearch: Story = {
  ...desktop,
  render: () => <Demo view="lens" query="plugin" />,
};
export const LensMobile: Story = {
  ...mobile,
  render: () => <Demo mobile view="lens" />,
};

export const FieldSearch: Story = {
  ...desktop,
  name: "Field Search",
  render: () => <Demo view="field" query="plugin" />,
};
export const FieldSearchMobile: Story = {
  ...mobile,
  name: "Field Search Mobile",
  render: () => <Demo mobile view="field" query="plugin" />,
};

export const List: Story = { ...desktop, render: () => <Demo view="list" /> };
export const ListMobile: Story = {
  ...mobile,

  render: () => <Demo mobile view="list" pageSize={15} />,
};

export const Table: Story = {
  ...desktop,
  name: "Table",
  render: () => <Demo view="table" rows={MANY_ROWS.slice(0, 500)} pageSize={25} />,
};
export const TableMobile: Story = {
  ...mobile,
  name: "Table Mobile",
  render: () => <Demo mobile view="table" rows={MANY_ROWS.slice(0, 500)} pageSize={10} />,
};

export const Matrix: Story = { ...desktop, render: () => <Demo view="matrix" /> };
export const MatrixMobile: Story = {
  ...mobile,

  render: () => <Demo mobile view="matrix" />,
};

export const FilterActive: Story = {
  ...desktop,
  name: "Filter Active",
  render: () => <Demo view="list" filters={{ domain: "navigation", drift: true }} />,
};
export const FilterActiveMobile: Story = {
  ...mobile,
  name: "Filter Active Mobile",
  render: () => <Demo mobile view="list" filters={{ domain: "navigation", drift: true }} />,
};

export const NoMatches: Story = {
  ...desktop,
  name: "No Matches",
  render: () => <Demo view="list" query="commit-gate" filters={{ lifecycle: "planned" }} />,
};
export const NoMatchesMobile: Story = {
  ...mobile,
  name: "No Matches Mobile",
  render: () => <Demo mobile view="list" query="commit-gate" filters={{ lifecycle: "planned" }} />,
};

export const Many: Story = {
  ...desktop,
  name: "Many",
  render: () => <Demo view="table" rows={MANY_ROWS} many pageSize={50} page={3} />,
};
export const ManyMobile: Story = {
  ...mobile,
  name: "Many Mobile",
  render: () => <Demo mobile view="table" rows={MANY_ROWS} many pageSize={10} />,
};

export const Network: Story = { ...desktop, render: () => <Demo view="network" query="plugin" /> };
export const NetworkMobile: Story = {
  ...mobile,
  render: () => <Demo mobile view="network" query="plugin" />,
};

export const TableTablet: Story = {
  ...tablet,
  name: "Table Tablet",
  render: () => <Demo view="table" rows={MANY_ROWS.slice(0, 500)} pageSize={25} />,
};

export const Loading: Story = {
  ...desktop,
  name: "Loading",
  render: () => <Demo view="list" state="loading" />,
};
export const LoadingMobile: Story = {
  ...mobile,
  name: "Loading Mobile",
  render: () => <Demo mobile view="field" state="loading" />,
};
