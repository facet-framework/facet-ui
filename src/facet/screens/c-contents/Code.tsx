import { Button, Chip } from "../../primitives/controls";
import { Distribution, EmptyState, Meter } from "../../primitives/display";
import {
  Collection,
  CollectionToolbar,
  DataTable,
  Pagination,
  sortRows,
  type SortDir,
} from "../../primitives/collection";
import { Icon } from "../../primitives/Icon";
import { useText } from "../../i18n/TextProvider";
import type { TextKey } from "../../i18n/en";
import { Treemap, usePct } from "./charts";
import { KeyValues, KindFrame, MiniStat, PathRef, RecordRef } from "./frame";
import type {
  AnchorDir,
  AnchorRole,
  AnchorRow,
  FileGap,
  FileNode,
  RuleItem,
  ViewDef,
} from "./model";

export type AnchorsView = "treemap" | "table";

export type AnchorsPageProps = {
  view: AnchorsView;
  dirs: AnchorDir[];
  roles: { role: AnchorRole; count: number }[];
  rows: AnchorRow[];
  page: number;
  pageSize: number;
  total: number;
  query: string;
  sort?: { key: string; dir: SortDir };
  selectedDir?: string | null;
  mobile?: boolean;
  onView?: (v: AnchorsView) => void;
  onDir?: (path: string) => void;
  onQuery?: (q: string) => void;
  onSort?: (key: string) => void;
  onPage?: (p: number) => void;
  onRole?: (role: string) => void;
  onOpenRecord?: (id: string) => void;
};

const A_VIEWS: (Omit<ViewDef<AnchorsView>, "label"> & { label: TextKey | null })[] = [
  { value: "treemap", label: null, icon: "map" },
  { value: "table", label: "c.tests.view.table", icon: "table" },
];

const ROLE_TONE: Record<AnchorRole, string> = {
  primary: "var(--t-signal)",
  related: "color-mix(in srgb, var(--t-signal) 55%, var(--t-sunken))",
  config: "var(--t-plan)",
  data: "var(--t-ok)",
  none: "var(--t-faint)",
};

const roleLabel = (role: AnchorRole, t: (key: TextKey) => string) =>
  role === "none" ? t("c.anchors.role.none") : role;

export function AnchorsPage(p: AnchorsPageProps) {
  const { t, number } = useText();
  const anchors = p.roles.reduce((a, r) => a + r.count, 0);
  const files = p.dirs.reduce((a, d) => a + d.files, 0);
  const sel = p.dirs.find((d) => d.path === p.selectedDir);
  const maxDensity = Math.max(1, ...p.dirs.map((d) => d.anchors / Math.max(1, d.files)));
  const roleBand = (
    <Distribution
      label={t("c.anchors.rolesOf")}
      onPick={p.onRole}
      parts={p.roles.map((r) => ({
        key: r.role,
        label: roleLabel(r.role, t),
        value: r.count,
        tone: ROLE_TONE[r.role],
      }))}
    />
  );
  return (
    <KindFrame
      groupId="Code"
      testId="anchors-page"
      kindLabel={t("c.kind.anchors")}
      group="Code"
      figure={number(anchors)}
      sentence={t("c.anchors.sentence", { anchors, files })}
      lead={t("c.anchors.lead", {
        dirs: p.dirs.length,
        count: p.roles.find((r) => r.role === "none")?.count ?? 0,
      })}
      views={A_VIEWS.map((v) => ({ ...v, label: v.label ? t(v.label) : "Treemap" }))}
      view={p.view}
      onView={p.onView}
      aside={
        p.view === "treemap" && !p.mobile ? (
          <div className="t-stack">
            <div className="t-surface t-pad t-stack">
              <span className="t-label">{t("c.anchors.roles")}</span>
              {roleBand}
            </div>
            {sel ? (
              <div className="t-raised t-pad t-stack" data-testid="anchor-dir">
                <span className="t-eyebrow">{t("c.anchors.dir")}</span>
                <span className="t-h3 t-mono">{sel.path}/</span>
                <KeyValues
                  items={[
                    [t("c.kind.anchors"), number(sel.anchors)],
                    [t("c.files.label"), number(sel.files)],
                    ["Records", number(sel.records)],
                    [
                      t("c.anchors.perFile"),
                      number(Math.round((sel.anchors / Math.max(1, sel.files)) * 10) / 10),
                    ],
                  ]}
                />
              </div>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {p.view === "treemap" ? (
        <div className="t-stack" data-testid="anchors-treemap">
          {p.mobile ? roleBand : null}
          <Treemap
            label={t("c.anchors.treemap")}
            height={p.mobile ? 420 : 520}
            selected={p.selectedDir}
            onPick={p.onDir}
            items={p.dirs.map((d) => ({
              key: d.path,
              label: d.path,
              value: d.anchors,
              sub: t("c.anchors.dirSub", { files: d.files, records: d.records }),
              heat: d.anchors / Math.max(1, d.files) / maxDensity,
            }))}
          />
          <div className="t-c-legend">
            <span>{t("c.anchors.legendArea")}</span>
            <span
              className="t-c-legend__sw"
              style={{ background: "color-mix(in srgb, var(--t-signal) 20%, var(--t-raised))" }}
            />
            <span
              className="t-c-legend__sw"
              style={{ background: "color-mix(in srgb, var(--t-signal) 70%, var(--t-raised))" }}
            />
            <span>{t("c.anchors.legendColour")}</span>
          </div>
        </div>
      ) : (
        <Collection
          state="ready"
          toolbar={
            <CollectionToolbar
              query={p.query}
              queryLabel={t("c.anchors.search")}
              placeholder={t("c.anchors.searchPlaceholder")}
              onQuery={p.onQuery}
            />
          }
          distribution={roleBand}
          pagination={
            <Pagination
              page={p.page}
              pageSize={p.pageSize}
              total={p.total}
              onPage={p.onPage}
              compact={p.mobile}
            />
          }
        >
          <DataTable
            label={t("c.kind.anchors")}
            rows={p.rows}
            rowKey={(r) => `${r.path}:${r.line}:${r.recordId}`}
            sort={p.sort}
            onSort={p.onSort}
            dense
            columns={[
              {
                key: "path",
                label: t("c.anchors.col.place"),
                sortable: true,
                render: (r) => <PathRef path={r.path} line={r.line} />,
              },
              {
                key: "role",
                label: t("c.anchors.col.role"),
                sortable: true,
                render: (r) => (
                  <span className="t-row" style={{ gap: 6 }}>
                    <span className="t-dot" style={{ background: ROLE_TONE[r.role] }} />
                    {roleLabel(r.role, t)}
                  </span>
                ),
              },
              {
                key: "record",
                label: "Record",
                sortable: true,
                render: (r) => <RecordRef id={r.recordId} onOpen={p.onOpenRecord} />,
              },
            ]}
          />
        </Collection>
      )}
    </KindFrame>
  );
}

export type FilesView = "tree" | "gaps";

export type FilesPageProps = {
  view: FilesView;

  scan: { files: number | null; anchored: number; unanchored: number | null; loc: number | null };
  tree: FileNode[];
  expanded: string[];
  gaps: FileGap[];
  onView?: (v: FilesView) => void;
  onToggle?: (path: string) => void;
  onOpenFile?: (path: string) => void;
};

const FL_VIEWS: (ViewDef<FilesView> & { label: TextKey })[] = [
  { value: "tree", label: "c.files.view.tree", icon: "tree" },
  { value: "gaps", label: "c.files.view.gaps", icon: "warning" },
];

function FileTree({
  nodes,
  depth,
  expanded,
  onToggle,
}: {
  nodes: FileNode[];
  depth: number;
  expanded: string[];
  onToggle?: (path: string) => void;
}) {
  const { t, number } = useText();
  const pct = usePct();
  return (
    <>
      {nodes.map((n) => {
        const open = expanded.includes(n.path);
        const branch = !!n.children?.length;
        return (
          <li
            key={n.path}
            role="treeitem"
            aria-expanded={branch ? open : undefined}
            aria-selected={false}
          >
            <button
              type="button"
              className="t-c-tree__row"
              style={{ paddingLeft: 8 + depth * 18 }}
              onClick={() => branch && onToggle?.(n.path)}
            >
              <Icon name={branch ? (open ? "chevronDown" : "chevronRight") : "file"} size={14} />
              <span className="t-c-tree__name t-mono">
                {n.name}
                {branch ? "/" : ""}
              </span>
              <span className="t-c-tree__meter">
                <Meter
                  value={n.share}
                  thin
                  label={t("c.files.anchoredIn", { path: n.path })}
                  tone={n.share != null && n.share < 0.5 ? "warn" : "ok"}
                />
              </span>
              <span
                className="t-meta t-c-tree__pct"
                title={n.share == null ? t("c.notMeasured") : undefined}
              >
                {pct(n.share)}
              </span>
              <span className="t-num t-c-tree__n">{number(n.anchored)}</span>
            </button>
            {branch && open ? (
              <ul role="group" className="t-c-plain">
                <FileTree
                  nodes={n.children ?? []}
                  depth={depth + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                />
              </ul>
            ) : null}
          </li>
        );
      })}
    </>
  );
}

export function FilesPage(p: FilesPageProps) {
  const { t, number } = useText();
  const pct = usePct();
  const share = p.scan.files ? p.scan.anchored / p.scan.files : null;

  const gaps = sortRows(p.gaps, (g) => g.loc, "desc");
  const maxLoc = Math.max(1, ...gaps.map((g) => g.loc ?? 0));
  return (
    <KindFrame
      groupId="Code"
      testId="files-page"
      kindLabel={t("c.files.label")}
      group="Code"
      figure={number(p.scan.anchored)}
      of={
        p.scan.files == null ? (
          <span title={t("c.notMeasured")} data-testid="files-total-unmeasured">
            —
          </span>
        ) : (
          number(p.scan.files)
        )
      }
      tone={share == null ? undefined : share < 0.5 ? "warn" : "ok"}
      sentence={t("c.files.sentence", { share: pct(share) })}
      lead={t("c.files.lead", {
        count: p.scan.unanchored == null ? "—" : number(p.scan.unanchored),
        loc: p.scan.loc == null ? "—" : number(p.scan.loc),
      })}
      views={FL_VIEWS.map((v) => ({ ...v, label: t(v.label) }))}
      view={p.view}
      onView={p.onView}
    >
      {p.view === "tree" ? (
        <div className="t-surface t-c-treebox">
          <div className="t-c-tree__row t-c-tree__row--head" aria-hidden="true">
            <span />
            <span className="t-c-tree__name">{t("c.anchors.dir")}</span>
            <span className="t-c-tree__meter">{t("c.files.shareAnchored")}</span>
            <span className="t-c-tree__pct" />
            <span className="t-c-tree__n">{t("c.files.withAnchor")}</span>
          </div>
          <ul
            className="t-c-plain"
            role="tree"
            aria-label={t("c.files.view.tree")}
            data-testid="files-tree"
          >
            <FileTree nodes={p.tree} depth={0} expanded={p.expanded} onToggle={p.onToggle} />
          </ul>
        </div>
      ) : (
        <ol
          className="t-c-plain t-stack t-stagger"
          style={{ gap: 8 }}
          aria-label={t("c.files.view.gaps")}
          data-testid="files-gaps"
        >
          {gaps.map((g, i) => (
            <li key={g.path}>
              <button
                type="button"
                className="t-surface t-c-gap"
                onClick={() => p.onOpenFile?.(g.path)}
              >
                <span className="t-c-gap__rank t-mono">{i + 1}</span>
                <span className="t-stack" style={{ gap: 4, minWidth: 0 }}>
                  <PathRef path={g.path} />
                  <span className="t-c-gap__bar" aria-hidden="true">
                    <span style={{ width: `${((g.loc ?? 0) / maxLoc) * 100}%` }} />
                  </span>
                </span>
                {g.loc == null ? (
                  <span
                    className="t-c-gap__loc t-muted"
                    title={t("c.notMeasured")}
                    data-testid="file-gap-loc-unmeasured"
                  >
                    — · {t("c.notMeasured")}
                  </span>
                ) : (
                  <span className="t-c-gap__loc t-num">{t("c.files.lines", { count: g.loc })}</span>
                )}
                <span className="t-stack t-hide-mobile" style={{ gap: 2, width: 140 }}>
                  <Meter
                    value={g.dirAnchoredPct / 100}
                    thin
                    label={t("c.files.anchoredIn", { path: g.dir })}
                    tone={g.dirAnchoredPct < 75 ? "warn" : "ok"}
                  />
                  <span className="t-meta">
                    {g.dir}/ {t("c.percent", { value: g.dirAnchoredPct })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </KindFrame>
  );
}

export type RulesPageProps = {
  state: "ready" | "empty";
  items: RuleItem[];
  records: number;
  selected?: string | null;
  onSelect?: (id: string) => void;
  onCreate?: () => void;
  onOpenRecord?: (id: string) => void;
};

const STRENGTH: Record<RuleItem["strength"], TextKey> = {
  must: "c.rules.strength.must",
  should: "c.rules.strength.should",
  may: "c.rules.strength.may",
};

export function RulesPage({
  state,
  items,
  records,
  selected,
  onSelect,
  onCreate,
  onOpenRecord,
}: RulesPageProps) {
  const { t, number } = useText();
  const bound = new Set(items.flatMap((i) => i.appliesTo)).size;
  const broken = items.filter((i) => (i.violations ?? 0) > 0).length;

  const unmeasured = items.some((i) => i.violations == null);
  return (
    <KindFrame
      groupId="Context"
      testId="rules-page"
      kindLabel={t("c.kind.rules")}
      group={t("c.group.context")}
      figure={state === "empty" ? number(0) : number(items.length)}
      tone={broken ? "warn" : undefined}
      sentence={
        state === "empty"
          ? t("c.rules.sentenceNone")
          : t("c.rules.sentence", { count: items.length, bound, records })
      }
      lead={
        state === "empty"
          ? undefined
          : broken
            ? t("c.rules.leadBroken", { count: broken })
            : unmeasured
              ? t("c.rules.leadUnmeasured")
              : t("c.rules.leadOk")
      }
      stats={
        state === "empty" ? undefined : (
          <>
            <MiniStat
              label={t(STRENGTH.must)}
              value={items.filter((i) => i.strength === "must").length}
            />
            <MiniStat
              label={t(STRENGTH.should)}
              value={items.filter((i) => i.strength === "should").length}
            />
            <MiniStat
              label={t("c.rules.violations")}
              value={unmeasured ? null : items.reduce((a, i) => a + (i.violations ?? 0), 0)}
              tone={broken ? "warn" : unmeasured ? undefined : "ok"}
            />
          </>
        )
      }
      toolbar={
        state === "empty" ? undefined : (
          <Button size="small" icon="plus" onClick={onCreate}>
            {t("c.rules.create")}
          </Button>
        )
      }
    >
      {state === "empty" ? (
        <EmptyState
          icon="rule"
          title={t("c.rules.emptyTitle")}
          body={
            <>
              {t("c.rules.emptyBefore")}
              <code className="t-mono">docs/facets/policies/</code>
              {t("c.rules.emptyAfter")}
            </>
          }
          action={
            <Button variant="primary" icon="plus" onClick={onCreate}>
              {t("c.rules.createFirst")}
            </Button>
          }
        />
      ) : (
        <ul className="t-c-plain t-c-rules t-stagger" aria-label={t("c.kind.rules")}>
          {items.map((r) => (
            <li key={r.id}>
              <article
                className={
                  selected === r.id ? "t-raised t-c-rule t-selected" : "t-surface t-c-rule"
                }
              >
                <header className="t-row t-row--wrap">
                  <span
                    className={`t-badge ${r.strength === "must" ? "t-badge--signal" : "t-badge--plain"}`}
                  >
                    {t(STRENGTH[r.strength])}
                  </span>
                  <button
                    type="button"
                    className="t-c-linkish t-h3"
                    onClick={() => onSelect?.(r.id)}
                  >
                    {r.title}
                  </button>
                  <span className="t-spacer" />
                  {r.violations == null ? (
                    <span
                      className="t-badge t-badge--plain"
                      title={t("c.notMeasured")}
                      data-testid="rule-violations-unmeasured"
                    >
                      — · {t("c.notMeasured")}
                    </span>
                  ) : r.violations ? (
                    <span className="t-badge t-badge--warn">
                      {t("c.rules.violationCount", { count: r.violations })}
                    </span>
                  ) : (
                    <span className="t-badge t-badge--ok">{t("c.rules.kept")}</span>
                  )}
                </header>
                <p className="t-c-rule__stmt">{r.statement}</p>
                <div className="t-row t-row--wrap" style={{ gap: 4 }}>
                  <span className="t-meta">
                    {t("c.rules.appliesTo", { count: r.appliesTo.length })}
                  </span>
                  {r.appliesTo.slice(0, selected === r.id ? 12 : 4).map((id) => (
                    <Chip key={id} mono onClick={() => onOpenRecord?.(id)}>
                      {id.split("/").pop()}
                    </Chip>
                  ))}
                  {r.appliesTo.length > (selected === r.id ? 12 : 4) ? (
                    <span className="t-meta">
                      +{r.appliesTo.length - (selected === r.id ? 12 : 4)}
                    </span>
                  ) : null}
                </div>
                <span className="t-meta">
                  {r.id} · {r.source}
                </span>
              </article>
            </li>
          ))}
        </ul>
      )}
    </KindFrame>
  );
}
