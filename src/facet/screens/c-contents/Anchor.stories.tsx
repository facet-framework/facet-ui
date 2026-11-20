import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import type { SortDir } from "../../primitives/collection";
import { AnchorsPage, type AnchorsView } from "./Code";
import { anchorDirs, anchorRoles, anchorRows } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Anchor" };
export default meta;

const SIZE = 50;

function Demo({ initial, mobile }: { initial: AnchorsView; mobile: boolean }) {
  const [view, setView] = useState(initial);
  const [dir, setDir] = useState<string | null>(anchorDirs[0]?.path ?? null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: "path", dir: "asc" });
  const rows = anchorRows.filter((r) => !query || `${r.path} ${r.recordId}`.includes(query));
  const sorted = [...rows].sort((a, b) => {
    const k = sort.key === "record" ? "recordId" : (sort.key as "path" | "role");
    const r = String(a[k]).localeCompare(String(b[k]));
    return sort.dir === "asc" ? r : -r;
  });
  return (
    <AnchorsPage
      view={view}
      dirs={anchorDirs}
      roles={anchorRoles}
      rows={sorted.slice((page - 1) * SIZE, page * SIZE)}
      page={page}
      pageSize={SIZE}
      total={rows.length}
      query={query}
      sort={sort}
      selectedDir={dir}
      mobile={mobile}
      onView={setView}
      onDir={setDir}
      onQuery={setQuery}
      onSort={(key) =>
        setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))
      }
      onPage={setPage}
    />
  );
}

export const Treemap = desk("contents", "Treemap", (m) => <Demo initial="treemap" mobile={m} />);
export const TreemapMobile = mob("contents", "Treemap Mobile", (m) => (
  <Demo initial="treemap" mobile={m} />
));
export const Table = desk("contents", "Table", (m) => <Demo initial="table" mobile={m} />);
export const TableMobile = mob("contents", "Table Mobile", (m) => (
  <Demo initial="table" mobile={m} />
));
