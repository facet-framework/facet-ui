import type { CSSProperties, ReactNode } from "react";
import { Badge, Button, Chip } from "../../primitives/controls";
import { Distribution, ListRow, Skeleton } from "../../primitives/display";
import {
  Collection,
  CollectionToolbar,
  DataTable,
  Pagination,
  type CollectionState,
  type Column,
  type Facet,
  type SortDir,
} from "../../primitives/collection";
import { Icon } from "../../primitives/Icon";
import { useText, type FacetText } from "../../i18n/TextProvider";
import {
  LIFECYCLE,
  dateText,
  pctText,
  share,
  type Lifecycle,
  type RecordKind,
  type RecordRow,
} from "./model";
import { LifecycleBadge, ProofBar, cx } from "./parts";
import { DependencyNetwork, type NetworkGraph } from "./DependencyNetwork";
import { RecordsLens, type LensState, type LensTab } from "./RecordsLens";

export type RecordsView = "lens" | "field" | "list" | "table" | "matrix" | "network";

export type FieldTile = {
  id: string;
  slug: string;
  lifecycle: Lifecycle;
  scenarios: number;
  proven: number;
  drift: number;

  match: boolean;
};
export type FieldGroup = {
  domain: string;
  capability: string;
  kind?: RecordKind;
  tiles: FieldTile[];
};

export type MatrixRow = {
  domain: string;
  capability: string;
  active: number;
  planned: number;
  deprecated: number;
  scenarios: number;
  proven: number;
  drift: number;
};

export type RecordsSummary = {
  total: number | null;
  provenPct: number | null;
  drift: number | null;
  knowledgeOpen: number | null;
  domains: number | null;

  assumptions: number | null;
};

export type RecordsPageProps = {
  state: CollectionState;
  mobile?: boolean;
  summary: RecordsSummary;

  matched: number;
  query: string;
  view: RecordsView;
  facets: Facet[];

  filters?: { key: string; label: string }[];
  rows: RecordRow[];
  page: number;
  pageSize: number;
  sort?: { key: string; dir: SortDir };
  distributions?: {
    label: string;
    parts: { key: string; label: string; value: number; tone?: string; active?: boolean }[];
  }[];
  field?: FieldGroup[];
  matrix?: MatrixRow[];
  network?: NetworkGraph;

  lens?: LensState;

  suggestions?: RecordRow[];
  onQuery?: (q: string) => void;
  onView?: (v: RecordsView) => void;
  onFacet?: (key: string) => void;
  onRemoveFilter?: (key: string) => void;
  onReset?: () => void;
  onSort?: (key: string) => void;
  onPage?: (page: number) => void;
  onPageSize?: (size: number) => void;
  onOpen?: (id: string) => void;
  onCell?: (domain: string, capability: string, lifecycle?: Lifecycle) => void;
  onDistribution?: (band: string, key: string) => void;
  onRetry?: () => void;

  onFocus?: (id: string) => void;
  onLensTab?: (tab: LensTab) => void;
  onLensUnfold?: (index: number) => void;
};

const viewsOf = (t: FacetText["t"]) => [
  { value: "lens" as const, label: t("b.records.view.lens"), icon: "eye" as const },
  { value: "field" as const, label: t("b.records.view.field"), icon: "grid" as const },
  { value: "list" as const, label: t("b.records.view.list"), icon: "list" as const },
  { value: "table" as const, label: t("b.records.view.table"), icon: "table" as const },
  { value: "matrix" as const, label: "Matrix", icon: "layers" as const },
  { value: "network" as const, label: t("b.records.view.network"), icon: "network" as const },
];

export function Hit({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;
  const out: ReactNode[] = [];
  let at = 0;
  const lower = text.toLowerCase();
  let i = lower.indexOf(q);
  while (i >= 0) {
    out.push(text.slice(at, i), <mark key={i}>{text.slice(i, i + q.length)}</mark>);
    at = i + q.length;
    i = lower.indexOf(q, at);
  }
  out.push(text.slice(at));
  return <>{out}</>;
}

function Head({
  summary,
  matched,
  filtered,
}: {
  summary: RecordsSummary;
  matched: number;
  filtered: boolean;
}) {
  const { t, plural, number } = useText();
  const s = summary;
  return (
    <header className="t-b-head t-stagger">
      <div className="t-b-head__main">
        <span className="t-eyebrow">Records</span>
        <div className="t-row t-row--baseline t-row--wrap" style={{ gap: 14 }}>
          <span className="t-b-head__figure t-num" data-testid="records-total">
            {s.total == null ? "—" : number(s.total)}
          </span>
          <h1 className="t-b-head__sentence">
            {s.total == null
              ? t("b.records.reading")
              : s.total === 0
                ? t("b.records.none")
                : t("b.records.sentence", {
                    domains: s.domains ?? "—",
                    assumptions: s.assumptions
                      ? plural("b.records.sentenceAssumptions", s.assumptions)
                      : "",
                    percent: pctText(s.provenPct, t),
                  })}
          </h1>
        </div>
        {filtered && s.total != null ? (
          <span className="t-meta" data-testid="records-matched">
            {t("b.records.visible", { matched, total: s.total })}
          </span>
        ) : null}
      </div>
      <dl className="t-b-head__stats">
        <div>
          <dt>{t("b.records.statProven")}</dt>
          <dd className="t-ok">{pctText(s.provenPct, t)}</dd>
        </div>
        <div>
          <dt>{t("b.records.statDrift")}</dt>
          <dd className={s.drift ? "t-warn" : undefined}>
            {s.drift == null ? "—" : number(s.drift)}
          </dd>
        </div>
        <div>
          <dt>{t("b.records.knowledgeOpen")}</dt>
          <dd>{s.knowledgeOpen == null ? "—" : number(s.knowledgeOpen)}</dd>
        </div>
      </dl>
    </header>
  );
}

function Place({ r }: { r: RecordRow }) {
  const { t } = useText();
  return r.kind === "assumption" ? (
    <>
      {t("b.kind.assumption")} · {r.capability}
    </>
  ) : (
    <>
      {r.domain} / {r.capability}
    </>
  );
}

function RowTrail({ r }: { r: RecordRow }) {
  const { t } = useText();
  return (
    <>
      {r.drift ? (
        <Badge tone="warn" plain>
          <Icon name="drift" size={12} /> {r.drift}
        </Badge>
      ) : null}
      {r.knowledgeOpen ? (
        <span className="t-meta t-hide-mobile" title={t("b.records.openKnowledgeFields")}>
          <Icon name="knowledge" size={12} /> {r.knowledgeOpen}
        </span>
      ) : null}
      <span className="t-meta t-hide-mobile" title={t("b.common.anchors")}>
        <Icon name="anchor" size={12} /> {r.anchors}
      </span>
      <ProofBar proven={r.proven} total={r.scenarios} />
    </>
  );
}

function RecordList({
  rows,
  query,
  onOpen,
}: {
  rows: RecordRow[];
  query: string;
  onOpen?: (id: string) => void;
}) {
  const { t } = useText();
  return (
    <div className="t-b-list t-surface t-stagger" role="list" aria-label="Records">
      {rows.map((r) => (
        <div role="listitem" key={r.id}>
          <ListRow
            lead={
              <span
                className={cx("t-b-lc", `t-b-lc--${r.lifecycle}`)}
                title={t(LIFECYCLE[r.lifecycle].label)}
              />
            }
            title={
              <span className="t-row" style={{ gap: 8 }}>
                <span className="t-mono">
                  <Hit text={r.slug} query={query} />
                </span>
                {r.lifecycle !== "active" ? <LifecycleBadge lifecycle={r.lifecycle} /> : null}
                {r.kind === "assumption" ? (
                  <Badge tone="signal">{t("b.kind.assumption")}</Badge>
                ) : null}
              </span>
            }
            sub={
              <>
                <Place r={r} /> · {r.owner ?? t("b.common.noTeam")} · {dateText(r.changedAt, t)}
                {r.summary ? <span className="t-b-list__summary"> — {r.summary}</span> : null}
              </>
            }
            trail={<RowTrail r={r} />}
            onClick={() => onOpen?.(r.id)}
          />
        </div>
      ))}
    </div>
  );
}

const columnsOf = ({ t, number }: FacetText): Column<RecordRow>[] => [
  {
    key: "slug",
    label: "Record",
    sortable: true,
    render: (r) => (
      <span className="t-stack" style={{ gap: 2 }}>
        <span className="t-mono">{r.slug}</span>
        <span className="t-meta">
          <Place r={r} />
        </span>
      </span>
    ),
  },
  {
    key: "lifecycle",
    label: t("b.records.column.lifecycle"),
    sortable: true,
    render: (r) => <LifecycleBadge lifecycle={r.lifecycle} />,
  },
  {
    key: "owner",
    label: "Team",
    sortable: true,
    hideOnMobile: true,
    render: (r) => r.owner ?? <span className="t-muted">—</span>,
  },
  {
    key: "proven",
    label: t("b.common.promises"),
    sortable: true,
    numeric: true,
    render: (r) => <ProofBar proven={r.proven} total={r.scenarios} />,
  },
  {
    key: "anchors",
    label: t("b.common.anchors"),
    sortable: true,
    numeric: true,
    render: (r) => number(r.anchors),
  },
  {
    key: "drift",
    label: t("b.common.drift"),
    sortable: true,
    numeric: true,
    render: (r) =>
      r.drift ? <span className="t-warn">{r.drift}</span> : <span className="t-muted">0</span>,
  },
  {
    key: "knowledgeOpen",
    label: t("b.records.knowledgeOpen"),
    sortable: true,
    numeric: true,
    hideOnMobile: true,
    render: (r) => `${r.knowledgeOpen}/5`,
  },
  {
    key: "changedAt",
    label: t("b.records.column.changed"),
    sortable: true,
    numeric: true,
    hideOnMobile: true,
    render: (r) => <span className="t-mono">{dateText(r.changedAt, t)}</span>,
  },
];

function SharpnessField({
  groups,
  query,
  onOpen,
  onCell,
}: {
  groups: FieldGroup[];
  query: string;
  onOpen?: (id: string) => void;
  onCell?: RecordsPageProps["onCell"];
}) {
  const { t, number } = useText();
  const searching = query.trim().length > 0;
  const hitsIn = (g: FieldGroup) => g.tiles.filter((x) => x.match).length;
  const ordered = searching
    ? [...groups].sort((a, b) => Number(hitsIn(b) > 0) - Number(hitsIn(a) > 0))
    : groups;
  const hits = groups.reduce((a, g) => a + g.tiles.filter((x) => x.match).length, 0);
  const hitGroups = groups.filter((g) => g.tiles.some((x) => x.match)).length;
  return (
    <div className="t-stack" style={{ gap: 14 }}>
      {searching ? (
        <p className="t-b-field__count" role="status">
          <strong>{number(hits)}</strong> {t("b.records.hits", { groups: hitGroups, query })}
        </p>
      ) : null}
      <div className="t-b-field">
        {ordered.map((g) => {
          const n = hitsIn(g);
          const depth = searching && n === 0 ? "2" : "0";
          return (
            <section
              key={`${g.domain}/${g.capability}`}
              className="t-b-field__group t-surface t-depth"
              data-depth={depth}
              aria-label={
                g.kind === "assumption"
                  ? `${t("b.common.assumptions")} / ${g.capability}`
                  : `${g.domain} / ${g.capability}`
              }
            >
              <header className="t-b-field__head">
                <button
                  type="button"
                  className="t-b-field__title"
                  onClick={() => onCell?.(g.domain, g.capability)}
                >
                  <span className="t-muted">
                    {g.kind === "assumption" ? t("b.common.assumptions") : g.domain} /
                  </span>{" "}
                  {g.capability}
                </button>
                <span className="t-meta">
                  {searching ? `${n} / ${g.tiles.length}` : g.tiles.length}
                </span>
              </header>
              <div className="t-b-field__tiles">
                {g.tiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    className={cx(
                      "t-b-tile",
                      `t-b-tile--${tile.lifecycle}`,
                      searching && tile.match && "t-b-tile--hit",
                    )}
                    data-depth={searching && !tile.match ? "1" : undefined}
                    title={t("b.records.tileTitle", {
                      id: tile.id,
                      proven: tile.proven,
                      total: tile.scenarios,
                    })}
                    onClick={() => onOpen?.(tile.id)}
                  >
                    <span
                      className="t-b-tile__proof"
                      style={
                        {
                          "--t-value": tile.scenarios ? tile.proven / tile.scenarios : 0,
                        } as CSSProperties
                      }
                      aria-hidden="true"
                    />
                    <span className="t-b-tile__name">
                      <Hit text={tile.slug} query={query} />
                    </span>
                    {tile.drift ? <Icon name="drift" size={11} className="t-warn" /> : null}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function heat(p: number | null): CSSProperties {
  if (p == null) return {};
  return {
    background: `color-mix(in srgb, var(--t-ok) ${Math.round(4 + p * 0.22)}%, transparent)`,
  };
}

function Matrix({
  rows,
  mobile,
  onCell,
}: {
  rows: MatrixRow[];
  mobile?: boolean;
  onCell?: RecordsPageProps["onCell"];
}) {
  const { t, plural } = useText();
  const domains = [...new Set(rows.map((r) => r.domain))];
  const max = Math.max(1, ...rows.map((r) => r.active + r.planned + r.deprecated));
  if (mobile) {
    return (
      <div className="t-stack" style={{ gap: 18 }}>
        {domains.map((d) => (
          <section key={d} className="t-stack" style={{ gap: 6 }} aria-label={d}>
            <span className="t-eyebrow">{d}</span>
            {rows
              .filter((r) => r.domain === d)
              .map((r) => {
                const n = r.active + r.planned + r.deprecated;
                return (
                  <button
                    key={r.capability}
                    type="button"
                    className="t-b-mcard t-surface"
                    onClick={() => onCell?.(r.domain, r.capability)}
                  >
                    <span className="t-row t-row--between">
                      <span className="t-mono">{r.capability}</span>
                      <span className="t-meta">{plural("b.common.records", n)}</span>
                    </span>
                    <span className="t-b-mcard__band" aria-hidden="true">
                      <span className="t-b-mcard__seg--active" style={{ flexGrow: r.active }} />
                      <span className="t-b-mcard__seg--planned" style={{ flexGrow: r.planned }} />
                      <span
                        className="t-b-mcard__seg--deprecated"
                        style={{ flexGrow: r.deprecated }}
                      />
                    </span>
                    <span className="t-row t-meta" style={{ gap: 12 }}>
                      <span>{t("b.records.lcCount.active", { count: r.active })}</span>
                      <span>{t("b.records.lcCount.planned", { count: r.planned })}</span>
                      <span>{t("b.records.lcCount.deprecated", { count: r.deprecated })}</span>
                      <span className="t-spacer" />
                      <span className="t-ok">{pctText(share(r.proven, r.scenarios), t)}</span>
                    </span>
                  </button>
                );
              })}
          </section>
        ))}
      </div>
    );
  }
  const cell = (r: MatrixRow, lc: Lifecycle) => {
    const n = r[lc];
    return (
      <td key={lc} className="t-num">
        <button
          type="button"
          className="t-b-matrix__cell"
          disabled={n === 0}
          aria-label={`${r.domain}/${r.capability}: ${n} ${t(LIFECYCLE[lc].label)}`}
          onClick={() => onCell?.(r.domain, r.capability, lc)}
        >
          <span
            className={cx("t-b-matrix__bar", `t-b-matrix__bar--${lc}`)}
            style={{ "--t-value": n / max } as CSSProperties}
          />
          <span>{n || "·"}</span>
        </button>
      </td>
    );
  };
  return (
    <div className="t-table-wrap">
      <table className="t-table t-b-matrix" aria-label={t("b.records.matrixLabel")}>
        <thead>
          <tr>
            <th>{t("b.records.matrixPlace")}</th>
            <th className="t-num">{t("b.lifecycle.active")}</th>
            <th className="t-num">{t("b.lifecycle.planned")}</th>
            <th className="t-num">{t("b.lifecycle.deprecated")}</th>
            <th className="t-num">{t("b.common.promisesProven")}</th>
            <th className="t-num">{t("b.common.drift")}</th>
          </tr>
        </thead>
        {domains.map((d) => {
          const rs = rows.filter((r) => r.domain === d);
          return (
            <tbody key={d}>
              <tr className="t-b-matrix__domain">
                <th colSpan={6} scope="rowgroup">
                  {d} <span className="t-meta">{plural("b.records.categories", rs.length)}</span>
                </th>
              </tr>
              {rs.map((r) => {
                const p = share(r.proven, r.scenarios);
                return (
                  <tr key={r.capability}>
                    <th scope="row" className="t-mono">
                      {r.capability}
                    </th>
                    {cell(r, "active")}
                    {cell(r, "planned")}
                    {cell(r, "deprecated")}
                    <td className="t-num t-b-matrix__heat" style={heat(p)}>
                      {pctText(p, t)}{" "}
                      <span className="t-meta">
                        {r.proven}/{r.scenarios}
                      </span>
                    </td>
                    <td className="t-num">
                      {r.drift ? (
                        <span className="t-warn">{r.drift}</span>
                      ) : (
                        <span className="t-muted">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div className="t-b-field" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="t-b-field__group t-surface">
          <Skeleton width="40%" height={12} />
          <div className="t-b-field__tiles">
            {Array.from({ length: 6 + ((i * 5) % 7) }, (_, j) => (
              <Skeleton key={j} width={60 + (((i + j) * 13) % 50)} height={24} radius={6} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecordsPage(p: RecordsPageProps) {
  const text = useText();
  const { t, plural } = text;
  const views = viewsOf(t);
  const columns = columnsOf(text);
  const filtered = p.query.trim().length > 0 || (p.filters?.length ?? 0) > 0;
  const paged = p.view === "list" || p.view === "table";
  const body =
    p.view === "lens" ? (
      <RecordsLens
        groups={p.field ?? []}
        query={p.query}
        lens={p.lens ?? { focus: null, hits: [], tab: "promises", open: 0 }}
        mobile={p.mobile}
        onFocus={p.onFocus}
        onOpen={p.onOpen}
        onTab={p.onLensTab}
        onUnfold={p.onLensUnfold}
      />
    ) : p.view === "field" ? (
      <SharpnessField groups={p.field ?? []} query={p.query} onOpen={p.onOpen} onCell={p.onCell} />
    ) : p.view === "matrix" ? (
      <>
        <Matrix rows={p.matrix ?? []} mobile={p.mobile} onCell={p.onCell} />
        {p.summary.assumptions ? (
          <p className="t-meta" data-testid="matrix-assumptions">
            {plural("b.records.outsideTaxonomy", p.summary.assumptions)}
          </p>
        ) : null}
      </>
    ) : p.view === "network" ? (
      <DependencyNetwork
        graph={p.network ?? { nodes: [], edges: [] }}
        query={p.query}
        mobile={p.mobile}
        onOpen={p.onOpen}
      />
    ) : p.view === "list" ? (
      <RecordList rows={p.rows} query={p.query} onOpen={p.onOpen} />
    ) : (
      <DataTable
        label="Records"
        columns={columns}
        rows={p.rows}
        rowKey={(r) => r.id}
        sort={p.sort}
        onSort={p.onSort}
        onRowClick={(r) => p.onOpen?.(r.id)}
      />
    );
  return (
    <div className="t-page t-b-records" data-testid="records-page">
      <Head summary={p.summary} matched={p.matched} filtered={filtered} />
      {p.state === "loading" && (p.view === "field" || p.view === "lens") ? (
        <div className="t-collection" aria-busy="true">
          <CollectionToolbar
            query={p.query}
            queryLabel={t("b.records.search")}
            facets={p.facets}
            views={views}
            view={p.view}
          />
          <FieldSkeleton />
        </div>
      ) : (
        <Collection
          state={p.state}
          toolbar={
            <>
              <CollectionToolbar
                query={p.query}
                queryLabel={t("b.records.search")}
                placeholder={t("b.records.placeholder")}
                facets={p.facets}
                views={views}
                view={p.view}
                sortLabel={
                  paged && p.sort
                    ? t("b.records.sorted", {
                        column: columns.find((c) => c.key === p.sort?.key)?.label ?? p.sort.key,
                      })
                    : undefined
                }
                onQuery={p.onQuery}
                onFacet={p.onFacet}
                onView={p.onView}
                onSortOpen={p.sort ? () => p.onSort?.(p.sort!.key) : undefined}
                onReset={p.onReset}
              />
              {p.filters?.length ? (
                <div
                  className="t-row t-row--wrap t-b-filters"
                  aria-label={t("b.records.activeFilters")}
                  role="group"
                >
                  <span className="t-label">{t("b.records.filteredBy")}</span>
                  {p.filters.map((f) => (
                    <Chip key={f.key} onRemove={() => p.onRemoveFilter?.(f.key)}>
                      {f.label}
                    </Chip>
                  ))}
                  <span className="t-meta">→ {plural("b.common.records", p.matched)}</span>
                </div>
              ) : null}
            </>
          }
          distribution={
            p.state === "ready" && p.view !== "lens" && p.distributions?.length ? (
              <div className="t-b-dists t-surface t-pad">
                {p.distributions.map((d) => (
                  <Distribution
                    key={d.label}
                    label={d.label}
                    parts={d.parts}
                    onPick={(k) => p.onDistribution?.(d.label, k)}
                  />
                ))}
              </div>
            ) : null
          }
          pagination={
            paged ? (
              <Pagination
                page={p.page}
                pageSize={p.pageSize}
                total={p.matched}
                compact={p.mobile}
                onPage={p.onPage}
                onPageSize={p.onPageSize}
              />
            ) : null
          }
          empty={{
            title: t("b.records.emptyTitle"),
            body: t("b.records.emptyBody"),
            icon: "records",
            action: <Button icon="plus">{t("b.records.emptyAction")}</Button>,
          }}
          filteredEmpty={{
            query: p.query || undefined,
            onReset: p.onReset,
            suggestions: p.suggestions?.length ? (
              <div className="t-b-suggest" aria-label={t("b.records.nearestLabel")}>
                <span className="t-label">{t("b.records.nearest")}</span>
                {p.suggestions.map((s) => (
                  <Button
                    key={s.id}
                    size="small"
                    variant="quiet"
                    icon="records"
                    onClick={() => p.onOpen?.(s.id)}
                  >
                    {s.id}
                  </Button>
                ))}
              </div>
            ) : undefined,
          }}
          error={{
            title: t("b.records.errorTitle"),
            reason: t("b.records.errorReason"),
            onRetry: p.onRetry,
          }}
        >
          {body}
        </Collection>
      )}
    </div>
  );
}
