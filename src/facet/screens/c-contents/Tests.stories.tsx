import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import type { SortDir } from "../../primitives/collection";
import { TestsPage, type TestsView } from "./Evidence";
import { testFiles, testKinds, testRunners } from "./data";
import { desk, mob } from "./kit";
import type { TestFileRow, TestKind } from "./model";

const meta: Meta = { title: "Screens/C Contents/Tests" };
export default meta;

const SIZE = 25;

function Demo({
  initial,
  mobile,
  startPage = 1,
}: {
  initial: TestsView;
  mobile: boolean;
  startPage?: number;
}) {
  const [view, setView] = useState(initial);
  const [page, setPage] = useState(startPage);
  const [kind, setKind] = useState<TestKind | null>("Unit");
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: "promises", dir: "desc" });
  const [expanded, setExpanded] = useState<string[]>(["internal/cli", "packages/task"]);
  const sorted = [...testFiles].sort((a, b) => {
    const k = sort.key as keyof TestFileRow;
    const r =
      typeof a[k] === "number"
        ? (a[k] as number) - (b[k] as number)
        : String(a[k]).localeCompare(String(b[k]));
    return sort.dir === "asc" ? r : -r;
  });
  const files =
    view === "table" ? sorted.slice((page - 1) * SIZE, page * SIZE) : testFiles.slice(0, 120);
  return (
    <TestsPage
      view={view}
      kinds={testKinds}
      runners={testRunners}
      files={files}
      page={page}
      pageSize={SIZE}
      total={testFiles.length}
      sort={sort}
      kind={kind}
      expanded={expanded}
      mobile={mobile}
      onView={setView}
      onKind={(k) => setKind(k as TestKind)}
      onToggle={(d) => setExpanded((e) => (e.includes(d) ? e.filter((x) => x !== d) : [...e, d]))}
      onSort={(key) =>
        setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }))
      }
      onPage={setPage}
    />
  );
}

export const Pyramid = desk("contents", "Pyramid", (m) => <Demo initial="pyramid" mobile={m} />);
export const PyramidMobile = mob("contents", "Pyramid Mobile", (m) => (
  <Demo initial="pyramid" mobile={m} />
));
export const FileTree = desk("contents", "File Tree", (m) => <Demo initial="tree" mobile={m} />);
export const FileTreeMobile = mob("contents", "File Tree Mobile", (m) => (
  <Demo initial="tree" mobile={m} />
));
export const TablePage3 = desk("contents", "Table Page3", (m) => (
  <Demo initial="table" mobile={m} startPage={3} />
));
export const TablePage3Mobile = mob("contents", "Table Page3 Mobile", (m) => (
  <Demo initial="table" mobile={m} startPage={3} />
));
