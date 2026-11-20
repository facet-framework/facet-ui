import type { TextKey } from "../../i18n/en";
import { useText } from "../../i18n/TextProvider";
import { Icon } from "../../primitives/Icon";
import { Badge, Button, SearchField, Segment } from "../../primitives/controls";
import { EmptyState, Finding, Meter, Section, Stat } from "../../primitives/display";
import { DataTable, Pagination, type Column, type SortDir } from "../../primitives/collection";
import { Mosaic, Pyramid, Ring, pct, pctText, shareTone } from "./charts";
import type { CapabilityView, DomainView, DriftView, FeatureView, TestMix } from "./model";
import { LIFECYCLE, PathBar } from "./parts";

export type CapabilityPageView = "field" | "table";

export type AnchorFile = { path: string; anchors: number; records: number; roles: string[] };

export type CapabilityPageProps = {
  domain: DomainView;
  domains: DomainView[];
  capability: CapabilityView;
  features: FeatureView[];
  files: AnchorFile[];
  tests: TestMix | null;
  drift: DriftView[];
  teamName?: string;
  view: CapabilityPageView;
  query?: string;
  sort?: { key: string; dir: SortDir };
  mobile?: boolean;
  crumbOpen?: string | null;
  onToggleCrumb?: (key: string) => void;

  crumbQuery?: string;
  onCrumbQuery?: (query: string) => void;

  onCloseCrumb?: () => void;
  onNavigate?: (target: string) => void;
  onOpenDomain?: (id: string) => void;
  onOpenCapability?: (domain: string, capability: string) => void;
  onOpenRecord?: (id: string) => void;
  onView?: (v: CapabilityPageView) => void;
  onQuery?: (q: string) => void;
  onSort?: (key: string) => void;

  page?: number;
  onPage?: (page: number) => void;
  onNewRecord?: () => void;
};

const VIEWS: { value: CapabilityPageView; label: TextKey; icon: "grid" | "table" }[] = [
  { value: "field", label: "a.cap.view.field", icon: "grid" },
  { value: "table", label: "a.cap.view.table", icon: "table" },
];

const matches = (f: FeatureView, q: string) =>
  !q || (f.slug + " " + f.summary).toLowerCase().includes(q.toLowerCase());

export function CapabilityPage(p: CapabilityPageProps) {
  const { domain: d, capability: c, features: fs, query = "" } = p;
  const { t, number: nf } = useText();
  const scen = fs.reduce((a, f) => a + f.scenarios, 0);
  const proven = fs.reduce((a, f) => a + f.proven, 0);
  const share = pct(proven, scen);
  const hits = fs.filter((f) => matches(f, query)).length;
  const empty = fs.length === 0;

  return (
    <div className="t-page t-a-over" data-testid="capability">
      <PathBar
        mobile={p.mobile}
        openKey={p.crumbOpen}
        onToggleSiblings={p.onToggleCrumb}
        query={p.crumbQuery}
        onQuery={p.onCrumbQuery}
        onClose={p.onCloseCrumb}
        crumbs={[
          {
            key: "product",
            label: t("a.common.product"),
            onClick: () => p.onNavigate?.("product"),
          },
          {
            key: d.id,
            label: d.id,
            mono: true,
            onClick: () => p.onOpenDomain?.(d.id),
            siblings: p.domains.map((s) => ({
              key: s.id,
              label: s.title,
              sub: s.id,
              icon: "product",
              current: s.id === d.id,
              onSelect: () => p.onOpenDomain?.(s.id),
            })),
          },
          {
            key: c.id,
            label: c.id,
            mono: true,
            siblings: d.capabilities.map((s) => ({
              key: s.id,
              label: s.title,
              sub: `${d.id}/${s.id}`,
              icon: "layers",
              current: s.id === c.id,
              onSelect: () => p.onOpenCapability?.(d.id, s.id),
            })),
          },
        ]}
      />
      <div className="t-a-over__head">
        <Finding
          eyebrow={t("a.cap.eyebrow", { domain: d.title, team: p.teamName ?? d.team })}
          figure={empty ? "—" : pctText(share, t)}
          tone={empty ? undefined : shareTone(share)}
          sentence={c.title}
          lead={c.purpose}
          aside={
            <span className="t-meta">
              {empty
                ? t("a.domain.nothingToProve")
                : t("a.domain.carryTest", { proven, scenarios: scen })}
            </span>
          }
        />
        <div className="t-a-over__stats t-stagger">
          <Stat value={nf(fs.length)} label="Records" />
          <Stat
            value={empty ? "—" : `${nf(proven)} / ${nf(scen)}`}
            label={empty ? t("a.common.scenariosUnmeasured") : t("a.overview.kpi.proven")}
          />
          <Stat value={nf(p.files.length)} label={t("a.cap.anchorFiles")} />
          <Stat
            value={nf(p.drift.length)}
            tone={p.drift.length ? "warn" : "ok"}
            label={t("a.overview.drift")}
          />
        </div>
      </div>

      {empty ? (
        <EmptyState
          icon="records"
          title={t("a.cap.emptyTitle", { title: c.title })}
          body={t("a.cap.emptyBody", { domain: d.title, prefix: `${d.id}/${c.id}` })}
          action={
            <>
              <Button variant="primary" icon="plus" onClick={p.onNewRecord}>
                {t("a.cap.create")}
              </Button>
              <Button icon="product" onClick={() => p.onOpenDomain?.(d.id)}>
                {t("a.cap.toArea")}
              </Button>
            </>
          }
        />
      ) : (
        <div className="t-a-over__grid">
          <div className="t-a-over__main">
            <Section
              title="Records"
              meta={query ? t("a.cap.sharp", { hits, total: fs.length }) : nf(fs.length)}
              actions={
                <Segment
                  label={t("a.cap.viewLabel")}
                  value={p.view}
                  options={VIEWS.map((v) => ({ ...v, label: t(v.label) }))}
                  onChange={p.onView}
                />
              }
            >
              <div className="t-a-cap-search">
                <SearchField
                  label={t("a.cap.searchLabel")}
                  value={query}
                  placeholder={t("a.cap.searchPlaceholder", { title: c.title })}
                  onChange={p.onQuery}
                />
              </div>
              {p.view === "field" ? <Field {...p} /> : <Table {...p} />}
            </Section>
            <Section title={t("a.cap.mosaic")} meta={t("a.cap.mosaicMeta")}>
              <div className="t-surface t-a-mosaics" role="group" aria-label={t("a.cap.mosaic")}>
                {fs.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="t-a-mosaics__row"
                    onClick={() => p.onOpenRecord?.(f.id)}
                  >
                    <span className="t-mono t-wrap">{f.slug}</span>
                    <Mosaic
                      cells={
                        f.mosaic ?? Array.from({ length: f.scenarios }, (_, i) => i < f.proven)
                      }
                      label={f.slug}
                      size={10}
                    />
                    <span className="t-meta t-num">
                      {f.proven}/{f.scenarios}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          </div>
          <aside className="t-a-over__side" aria-label={t("a.cap.side")}>
            <section
              className="t-surface t-pad t-stack"
              style={{ gap: 8 }}
              aria-label={t("a.chart.testsByKind")}
            >
              <div className="t-a-panel-head">
                <span className="t-h3">{t("a.chart.testsByKind")}</span>
              </div>
              <Pyramid mix={p.tests} />
            </section>
            <section
              className="t-surface t-pad t-stack"
              style={{ gap: 6 }}
              aria-label={t("a.cap.anchorFiles")}
            >
              <div className="t-a-panel-head">
                <span className="t-h3">{t("a.cap.anchorFiles")}</span>
                <span className="t-meta">{nf(p.files.length)}</span>
              </div>
              {p.files.slice(0, 10).map((f) => (
                <div key={f.path} className="t-a-file">
                  <Icon name="file" size={14} />
                  <span className="t-mono t-wrap" title={f.path}>
                    {f.path}
                  </span>
                  <span className="t-meta">{f.records}×</span>
                </div>
              ))}
              {p.files.length > 10 ? (
                <Button size="small" variant="quiet" onClick={() => p.onNavigate?.("anchor")}>
                  {t("a.cap.allFiles", { count: p.files.length })}
                </Button>
              ) : null}
            </section>
            <section
              className="t-surface t-pad t-stack"
              style={{ gap: 8 }}
              aria-label={t("a.cap.knowledgeGaps")}
            >
              <div className="t-a-panel-head">
                <span className="t-h3">{t("a.cap.knowledgeGaps")}</span>
                <span className="t-meta">
                  {t("a.cap.slots", { count: fs.reduce((a, f) => a + f.knowledgeOpen, 0) })}
                </span>
              </div>
              <KnowledgeBars features={fs} />
            </section>
            <section
              className="t-surface t-pad t-stack"
              style={{ gap: 6 }}
              aria-label={t("a.overview.drift")}
            >
              <div className="t-a-panel-head">
                <span className="t-h3">{t("a.overview.drift")}</span>
                <span className="t-meta">{nf(p.drift.length)}</span>
              </div>
              {p.drift.length ? (
                p.drift.map((x) => (
                  <div key={x.path + x.record} className="t-a-file">
                    <Icon name="drift" size={14} className="t-warn" />
                    <span className="t-mono t-wrap">{x.path}</span>
                    <span className="t-meta">{x.changedAt.slice(5)}</span>
                  </div>
                ))
              ) : (
                <p className="t-a-calm">
                  <Icon name="check" size={16} className="t-ok" /> {t("a.cap.noDrift")}
                </p>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function KnowledgeBars({ features }: { features: FeatureView[] }) {
  const { t } = useText();
  const buckets = [0, 1, 2, 3, 4, 5].map(
    (k) => features.filter((f) => f.knowledgeOpen === k).length,
  );
  const max = Math.max(1, ...buckets);
  return (
    <div className="t-a-kbars" role="list" aria-label={t("a.cap.byOpenSlots")}>
      {buckets.map((n, k) => (
        <div key={k} role="listitem" className="t-a-kbars__row">
          <span className="t-meta">
            {k === 0 ? t("a.cap.full") : t("a.overview.stepsOpen", { count: k })}
          </span>
          <Meter
            value={n / max}
            thin
            tone={k === 0 ? "ok" : "warn"}
            label={t("a.overview.stepsOpen", { count: k })}
          />
          <span className="t-num t-meta">{n}</span>
        </div>
      ))}
    </div>
  );
}

const FIELD_PAGE = 24;

function Field({
  features,
  query = "",
  page = 1,
  mobile,
  onPage,
  onOpenRecord,
}: CapabilityPageProps) {
  const { t } = useText();

  const ordered = query
    ? [...features.filter((f) => matches(f, query)), ...features.filter((f) => !matches(f, query))]
    : features;
  const shown = ordered.slice((page - 1) * FIELD_PAGE, page * FIELD_PAGE);
  return (
    <>
      <div className="t-a-field" role="list" aria-label={t("a.cap.view.field")}>
        {shown.map((f) => {
          const hit = matches(f, query);
          const p = pct(f.proven, f.scenarios);
          return (
            <div
              key={f.id}
              role="listitem"
              className="t-depth"
              data-depth={query && !hit ? "2" : "0"}
            >
              <button
                type="button"
                className="t-surface t-a-card t-interactive"
                data-testid={`card-${f.slug}`}
                onClick={() => onOpenRecord?.(f.id)}
              >
                <span className="t-row t-row--between">
                  <span className="t-mono t-wrap">{f.slug}</span>
                  {f.lifecycle !== "active" ? (
                    <Badge tone={f.lifecycle === "planned" ? "plan" : "neutral"}>
                      {t(LIFECYCLE[f.lifecycle])}
                    </Badge>
                  ) : null}
                </span>
                <span className="t-muted t-clamp-2 t-a-card__summary">{f.summary}</span>
                <span className="t-row t-row--between">
                  <span className="t-row t-meta" style={{ gap: 10 }}>
                    <span>{t("a.cap.scenariosShort", { count: f.scenarios })}</span>
                    <span>{t("a.cap.anchorsCount", { count: f.anchors })}</span>
                    {f.drift ? <span className="t-warn">{t("a.overview.drift")}</span> : null}
                  </span>
                  <Ring value={p} size={34} label={f.slug}>
                    <span className="t-a-ring__small">{p == null ? "—" : p}</span>
                  </Ring>
                </span>
              </button>
            </div>
          );
        })}
      </div>
      {ordered.length > FIELD_PAGE ? (
        <Pagination
          page={page}
          pageSize={FIELD_PAGE}
          total={ordered.length}
          pageSizes={[24]}
          compact={mobile}
          onPage={onPage}
        />
      ) : null}
    </>
  );
}

function sortValue(f: FeatureView, key: string): number | string {
  switch (key) {
    case "scenarios":
      return f.scenarios;
    case "proven":
      return f.scenarios ? f.proven / f.scenarios : -1;
    case "tests":
      return f.tests;
    case "anchors":
      return f.anchors;
    case "knowledge":
      return 5 - f.knowledgeOpen;
    case "drift":
      return f.drift;
    default:
      return f.slug;
  }
}

export function byColumn(key: string, dir: SortDir) {
  return (a: FeatureView, b: FeatureView) => {
    const x = sortValue(a, key);
    const y = sortValue(b, key);
    const r = x < y ? -1 : x > y ? 1 : 0;
    if (r !== 0) return dir === "asc" ? r : -r;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  };
}

function Table({ features, query = "", sort, onSort, onOpenRecord }: CapabilityPageProps) {
  const { t, number: nf } = useText();
  const rows = features.filter((f) => matches(f, query));
  const ordered = sort ? [...rows].sort(byColumn(sort.key, sort.dir)) : rows;
  const cols: Column<FeatureView>[] = [
    {
      key: "slug",
      label: "Record",
      sortable: true,
      render: (f) => <span className="t-mono">{f.slug}</span>,
    },
    {
      key: "scenarios",
      label: t("a.cap.col.scenarios"),
      numeric: true,
      sortable: true,
      render: (f) => nf(f.scenarios),
    },
    {
      key: "proven",
      label: t("a.cap.col.proven"),
      sortable: true,
      render: (f) => (
        <Mosaic
          cells={f.mosaic ?? Array.from({ length: f.scenarios }, (_, i) => i < f.proven)}
          label={f.slug}
          size={7}
        />
      ),
    },
    {
      key: "tests",
      label: "Tests",
      numeric: true,
      sortable: true,
      hideOnMobile: true,
      render: (f) => nf(f.tests),
    },
    {
      key: "anchors",
      label: t("a.common.anchors"),
      numeric: true,
      sortable: true,
      hideOnMobile: true,
      render: (f) => nf(f.anchors),
    },
    {
      key: "knowledge",
      label: t("a.overview.author.knowledge"),
      numeric: true,
      sortable: true,
      hideOnMobile: true,
      render: (f) => `${5 - f.knowledgeOpen}/5`,
    },
    {
      key: "drift",
      label: t("a.overview.drift"),
      numeric: true,
      sortable: true,
      render: (f) =>
        f.drift ? <Badge tone="warn">{f.drift}</Badge> : <span className="t-muted">—</span>,
    },
  ];
  return (
    <DataTable
      label={t("a.cap.tableLabel")}
      columns={cols}
      rows={ordered}
      rowKey={(f) => f.id}
      sort={sort}
      onSort={onSort}
      onRowClick={(f) => onOpenRecord?.(f.id)}
      dense
    />
  );
}
