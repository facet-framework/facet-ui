import { Button, Tabs } from "../../primitives/controls";
import { Meter } from "../../primitives/display";
import { DataTable } from "../../primitives/collection";
import { Icon } from "../../primitives/Icon";
import { useText } from "../../i18n/TextProvider";
import type { TextKey } from "../../i18n/en";
import { BandChart, Sunburst, sunColor } from "./charts";
import { KeyValues, KindFrame, MiniStat } from "./frame";
import type { CalibrationMetric, Outlier, TaxDomain, ViewDef } from "./model";

export type TaxonomyView = "tree" | "sunburst";

export type TaxonomyPageProps = {
  view: TaxonomyView;
  domains: TaxDomain[];
  expanded: string[];
  selected?: string | null;
  mobile?: boolean;
  onView?: (v: TaxonomyView) => void;
  onToggle?: (id: string) => void;
  onSelect?: (id: string) => void;
  onOpenOverview?: (id: string) => void;
};

const T_VIEWS: (ViewDef<TaxonomyView> & { label: TextKey })[] = [
  { value: "tree", label: "c.tax.view.tree", icon: "tree" },
  { value: "sunburst", label: "c.tax.view.sun", icon: "globe" },
];

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function TaxonomyPage(p: TaxonomyPageProps) {
  const { t, number } = useText();
  const caps = p.domains.flatMap((d) => d.capabilities.map((c) => ({ ...c, domain: d })));
  const records = sum(caps.map((c) => c.records));
  const empty = caps.filter((c) => c.records === 0).length;
  const sel =
    p.domains.find((d) => d.id === p.selected) ?? caps.find((c) => c.id === p.selected) ?? null;
  return (
    <KindFrame
      groupId="Registry"
      testId="taxonomy-page"
      kindLabel={t("c.kind.taxonomy")}
      group="Registry"
      figure={p.domains.length}
      sentence={t("c.tax.sentence", {
        areas: p.domains.length,
        caps: caps.length,
        records,
      })}
      lead={empty ? t("c.tax.leadEmpty", { count: empty }) : t("c.tax.leadAll")}
      stats={
        <>
          <MiniStat label={t("c.tax.areas")} value={p.domains.length} />
          <MiniStat label={t("c.tax.caps")} value={caps.length} />
          <MiniStat label={t("c.tax.empty")} value={empty} tone={empty ? "warn" : undefined} />
        </>
      }
      views={T_VIEWS.map((v) => ({ ...v, label: t(v.label) }))}
      view={p.view}
      onView={p.onView}
    >
      {p.view === "tree" ? (
        <ul
          className="t-c-tree"
          role="tree"
          aria-label={t("c.kind.taxonomy")}
          data-testid="taxonomy-tree"
        >
          {p.domains.map((d) => {
            const open = p.expanded.includes(d.id);
            const dr = sum(d.capabilities.map((c) => c.records));
            const dp = sum(d.capabilities.map((c) => c.proven));
            return (
              <li
                key={d.id}
                role="treeitem"
                aria-expanded={open}
                aria-selected={p.selected === d.id}
              >
                <div className="t-c-tree__row t-c-tree__row--domain">
                  <button
                    type="button"
                    className="t-c-tree__caret"
                    aria-label={t(open ? "c.collapse" : "c.expand", { name: d.title })}
                    onClick={() => p.onToggle?.(d.id)}
                  >
                    <Icon name={open ? "chevronDown" : "chevronRight"} size={14} />
                  </button>
                  <button
                    type="button"
                    className="t-c-tree__name"
                    onClick={() => p.onSelect?.(d.id)}
                  >
                    <span className="t-h3">{d.title}</span>
                    <span className="t-meta">{d.id}</span>
                  </button>
                  <span className="t-badge t-badge--plain t-hide-mobile">{d.klass}</span>
                  <span className="t-meta t-hide-mobile">{d.team}</span>
                  <span className="t-c-tree__meter">
                    <Meter
                      value={dr ? dp / dr : null}
                      thin
                      label={t("c.prov.teamProven", { team: d.title })}
                    />
                  </span>
                  <span className="t-num t-c-tree__n">{number(dr)}</span>
                </div>
                {open ? (
                  <ul role="group" className="t-c-tree__children">
                    {d.capabilities.map((c) => (
                      <li key={c.id} role="treeitem" aria-selected={p.selected === c.id}>
                        <button
                          type="button"
                          className="t-c-tree__row"
                          onClick={() => p.onSelect?.(c.id)}
                        >
                          <span className="t-c-tree__indent" aria-hidden="true" />
                          <span className="t-c-tree__name">
                            <span>{c.title}</span>
                            <span className="t-meta">{c.id}</span>
                          </span>
                          <span className="t-meta t-hide-mobile">
                            {t("c.tax.promises", { count: c.scenarios })}
                          </span>
                          <span className="t-c-tree__meter">
                            <Meter
                              value={c.records ? c.proven / c.records : null}
                              thin
                              label={t("c.prov.teamProven", { team: c.title })}
                            />
                          </span>
                          <span
                            className={c.records ? "t-num t-c-tree__n" : "t-num t-c-tree__n t-warn"}
                          >
                            {number(c.records)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="t-c-sunlayout" data-testid="taxonomy-sun">
          <Sunburst
            label={t("c.tax.sunLabel")}
            size={p.mobile ? 340 : 520}
            selected={p.selected}
            nodes={p.domains.map((d) => ({
              key: d.id,
              label: d.title,
              value: Math.max(1, sum(d.capabilities.map((c) => c.records))),
              children: d.capabilities.map((c) => ({
                key: c.id,
                label: c.title,
                value: Math.max(1, c.records),
                tone: c.records === 0 ? "warn" : undefined,
              })),
            }))}
            center={
              <>
                <span className="t-c-sun__n">
                  {sel
                    ? number(
                        "capabilities" in sel
                          ? sum(sel.capabilities.map((c) => c.records))
                          : sel.records,
                      )
                    : number(records)}
                </span>
                <span className="t-meta">{sel ? sel.title : "Records"}</span>
              </>
            }
          />
          <div className="t-stack">
            <ul className="t-c-plain t-stack" style={{ gap: 4 }} aria-label={t("c.tax.areas")}>
              {p.domains.map((d, i) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className="t-c-legendrow"
                    aria-pressed={p.selected === d.id}
                    onClick={() => p.onSelect?.(d.id)}
                  >
                    <span
                      className="t-c-legend__sw"
                      style={{
                        background: sunColor(i),
                      }}
                    />
                    <span style={{ flex: 1 }}>{d.title}</span>
                    <span className="t-meta">
                      {t("c.tax.capsShort", { count: d.capabilities.length })}
                    </span>
                    <span className="t-num">
                      {number(sum(d.capabilities.map((c) => c.records)))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {sel ? (
              <div className="t-raised t-pad t-stack" data-testid="taxonomy-detail">
                <span className="t-eyebrow">
                  {t("capabilities" in sel ? "c.tax.area" : "c.tax.cap")}
                </span>
                <span className="t-h2">{sel.title}</span>
                {"capabilities" in sel ? <p className="t-c-small t-ink2">{sel.purpose}</p> : null}
                <KeyValues
                  items={
                    "capabilities" in sel
                      ? [
                          [
                            "Id",
                            <span className="t-mono" key="i">
                              {sel.id}
                            </span>,
                          ],
                          [t("c.tax.class"), sel.klass],
                          ["Team", sel.team],
                          [t("c.tax.caps"), sel.capabilities.length],
                        ]
                      : [
                          [
                            "Id",
                            <span className="t-mono" key="i">
                              {sel.id}
                            </span>,
                          ],
                          ["Records", sel.records],
                          [t("c.kind.promises"), sel.scenarios],
                          [t("c.promises.state.proven"), `${sel.proven} / ${sel.records}`],
                        ]
                  }
                />
                <Button size="small" iconAfter="forward" onClick={() => p.onOpenOverview?.(sel.id)}>
                  {t("c.tax.openOverview")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </KindFrame>
  );
}

export type CalibrationView = "bands" | "outliers";

export type CalibrationPageProps = {
  view: CalibrationView;
  metrics: CalibrationMetric[];
  outliers: Outlier[];
  metric?: string;
  onView?: (v: CalibrationView) => void;
  onMetric?: (key: string) => void;
  onOpenRecord?: (id: string) => void;
};

const C_VIEWS: (ViewDef<CalibrationView> & { label: TextKey })[] = [
  { value: "bands", label: "c.cal.view.bands", icon: "calibrate" },
  { value: "outliers", label: "c.cal.view.outliers", icon: "warning" },
];

const SIDE: Record<Outlier["side"], TextKey> = {
  ["above"]: "c.cal.side.above",
  below: "c.cal.side.below",
};

export function CalibrationPage(p: CalibrationPageProps) {
  const { t } = useText();
  const outside = sum(p.metrics.map((m) => m.above + m.below));
  const inBand = p.metrics.filter((m) => m.median >= m.band.low && m.median <= m.band.high).length;
  const metric = p.metric ?? p.metrics[0]?.key;
  const current = p.metrics.find((m) => m.key === metric);
  const rows = p.outliers.filter((o) => o.metric === metric);
  return (
    <KindFrame
      groupId="Registry"
      testId="calibration-page"
      kindLabel={t("c.kind.calibration")}
      group="Registry"
      figure={inBand}
      of={p.metrics.length}
      tone={inBand === p.metrics.length ? "ok" : "warn"}
      sentence={t("c.cal.sentence", { count: inBand, total: p.metrics.length })}
      lead={
        <>
          <span className="t-c-lead-line">{t("c.cal.explain")}</span>
          <span className="t-c-lead-line">{t("c.cal.lead", { count: outside })}</span>
        </>
      }
      views={C_VIEWS.map((v) => ({ ...v, label: t(v.label) }))}
      view={p.view}
      onView={p.onView}
    >
      {p.view === "bands" ? (
        <div className="t-stack" style={{ gap: 14 }} data-testid="calibration-bands">
          <div className="t-c-legend">
            <span
              className="t-c-legend__sw"
              style={{ background: "var(--t-ok-wash)", outline: "1px solid var(--t-ok)" }}
            />{" "}
            Band
            <span className="t-c-legend__bar" /> Median
            <span className="t-c-legend__whisk" /> {t("c.cal.range")}
            <span
              className="t-c-legend__sw t-c-legend__sw--round"
              style={{ background: "var(--t-warn)" }}
            />{" "}
            {t("c.cal.outside")}
          </div>
          {p.metrics.map((m) => (
            <article key={m.key} className="t-surface t-pad t-c-bandcard">
              <header className="t-row t-row--wrap">
                <span className="t-h3">{m.label}</span>
                <span className="t-meta">{t("c.cal.samples", { count: m.samples })}</span>
                <span className="t-spacer" />
                <span
                  className={
                    m.median >= m.band.low && m.median <= m.band.high
                      ? "t-badge t-badge--ok"
                      : "t-badge t-badge--warn"
                  }
                >
                  Median {m.median} {m.unit}
                </span>
              </header>
              <BandChart
                label={t("c.cal.bandLabel", {
                  metric: m.label,
                  median: m.median,
                  low: m.band.low,
                  high: m.band.high,
                  min: m.min,
                  max: m.max,
                })}
                min={m.min}
                max={m.max}
                median={m.median}
                band={m.band}
                values={m.values}
              />
              <div className="t-row t-row--wrap t-c-small">
                <span className="t-meta">
                  Band {m.band.low}–{m.band.high}
                </span>
                <span className="t-meta">
                  {t("c.cal.range")} {m.min}–{m.max}
                </span>
                <span className="t-spacer" />
                <button
                  type="button"
                  className="t-c-linkish"
                  onClick={() => {
                    p.onMetric?.(m.key);
                    p.onView?.("outliers");
                  }}
                >
                  <span className={m.below ? "t-warn" : "t-muted"}>
                    {t("c.cal.belowCount", { count: m.below })}
                  </span>
                  {" · "}
                  <span className={m.above ? "t-warn" : "t-muted"}>
                    {t("c.cal.aboveCount", { count: m.above })}
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="t-stack" data-testid="calibration-outliers">
          <div className="t-c-tabscroll">
            <Tabs
              label={t("c.cal.metric")}
              value={metric ?? ""}
              items={p.metrics.map((m) => ({
                value: m.key,
                label: m.label,
                count: m.above + m.below,
              }))}
              onChange={p.onMetric}
            />
          </div>
          {current ? (
            <div className="t-row t-row--wrap t-c-small">
              <span className="t-meta">
                Band {current.band.low}–{current.band.high} {current.unit} · Median {current.median}
              </span>
            </div>
          ) : null}
          <DataTable
            label={t("c.cal.view.outliers")}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => p.onOpenRecord?.(r.id)}
            columns={[
              {
                key: "id",
                label: t("c.cal.col.where"),
                render: (r) => <span className="t-mono t-c-small">{r.id}</span>,
              },
              {
                key: "side",
                label: t("c.cal.col.side"),
                render: (r) => <span className="t-badge t-badge--warn">{t(SIDE[r.side])}</span>,
              },
              {
                key: "value",
                label: t("c.cal.col.value"),
                numeric: true,
                render: (r) => <span className="t-num">{r.value}</span>,
              },
              {
                key: "dist",
                label: t("c.cal.col.distance"),
                hideOnMobile: true,
                render: (r) => (
                  <span className="t-c-outbar" aria-hidden="true">
                    <span
                      style={{ width: `${Math.min(100, (r.value / (current?.max || 1)) * 100)}%` }}
                    />
                  </span>
                ),
              },
              {
                key: "band",
                label: "Band",
                hideOnMobile: true,
                render: (r) => <span className="t-meta">{r.band}</span>,
              },
            ]}
          />
          {rows.length === 0 ? <p className="t-meta t-c-center">{t("c.cal.noOutliers")}</p> : null}
        </div>
      )}
    </KindFrame>
  );
}
