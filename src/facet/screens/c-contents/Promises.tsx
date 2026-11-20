import { Button, Chip } from "../../primitives/controls";
import { Collection, CollectionToolbar, Pagination, type Facet } from "../../primitives/collection";
import { Sheet } from "../../primitives/overlay";
import { Icon } from "../../primitives/Icon";
import { useText } from "../../i18n/TextProvider";
import type { TextKey } from "../../i18n/en";
import { ShareBar } from "./charts";
import { Gwt, KindFrame, MiniStat, RecordRef, capOf, short, splitGwt, stripMd } from "./frame";
import type { PromiseItem, PromiseRecord, PromiseState, ViewDef } from "./model";

export type PromisesView = "list" | "mosaic" | "open";

export type PromisesPageProps = {
  view: PromisesView;
  state?: "ready" | "filtered-empty";
  totals: {
    total: number;
    proven: number;
    open: number;
    deviating: number;
    records: number;

    listed?: number;
  };
  items: PromiseItem[];
  records: PromiseRecord[];
  page: number;
  pageSize: number;
  total: number;
  query: string;
  facets: Facet[];
  selected?: PromiseItem | null;
  suggestions?: string[];
  mobile?: boolean;
  onView?: (v: PromisesView) => void;
  onQuery?: (q: string) => void;
  onFacet?: (key: string) => void;
  onReset?: () => void;
  onPage?: (p: number) => void;
  onSelect?: (key: string | null) => void;
  onOpenRecord?: (id: string) => void;
};

const VIEWS: (ViewDef<PromisesView> & { label: TextKey })[] = [
  { value: "list", label: "c.promises.view.list", icon: "list" },
  { value: "mosaic", label: "c.promises.view.mosaic", icon: "grid" },
  { value: "open", label: "c.promises.view.openFirst", icon: "promise" },
];

export const STATE_WORD: Record<PromiseState, TextKey> = {
  proven: "c.promises.state.proven",
  open: "c.promises.state.open",
  deviation: "c.promises.state.deviation",
};
const STATE_TONE: Record<PromiseState, "ok" | "warn" | "bad"> = {
  proven: "ok",
  open: "warn",
  deviation: "bad",
};

function StateMark({ state }: { state: PromiseState }) {
  const { t } = useText();
  return (
    <span className={`t-c-state t-c-state--${state}`}>
      <span aria-hidden="true" className={`t-dot t-dot--${STATE_TONE[state]}`} />
      {t(STATE_WORD[state])}
    </span>
  );
}

function PromiseDetail({
  item,
  onOpenRecord,
}: {
  item: PromiseItem;
  onOpenRecord?: (id: string) => void;
}) {
  const { t } = useText();
  return (
    <div className="t-stack" data-testid="promise-detail">
      <div className="t-row t-row--wrap">
        <StateMark state={item.state} />
        <span className="t-meta">{item.scenarioId}</span>
      </div>
      <Gwt text={item.text} />
      <div className="t-c-sub">
        <span className="t-label">{t("c.promises.detail.tests")}</span>
        {item.tests.length ? (
          <ul className="t-c-plain">
            {item.tests.map((test) => (
              <li key={test.name} className="t-row">
                <span className="t-badge t-badge--plain">{test.kind}</span>
                <span className="t-mono t-wrap t-c-small" title={test.name}>
                  {test.name.split("::").pop()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={item.state === "proven" ? "t-c-small t-muted" : "t-c-small t-warn"}>
            {item.state === "proven"
              ? t("c.promises.detail.provenNoTest")
              : t("c.promises.detail.noTest")}
          </p>
        )}
      </div>
      <div className="t-row t-row--wrap">
        <Button size="small" icon="records" onClick={() => onOpenRecord?.(item.recordId)}>
          {t("c.record", { id: short(item.recordId) })}
        </Button>
        <Button size="small" variant="quiet" icon="copy">
          {t("c.copyId")}
        </Button>
      </div>
    </div>
  );
}

export function PromisesPage(p: PromisesPageProps) {
  const { t, plural, number } = useText();
  const { totals, view, mobile } = p;
  const provenShare = totals.total ? totals.proven / totals.total : 0;
  const detail = p.selected ? (
    <PromiseDetail item={p.selected} onOpenRecord={p.onOpenRecord} />
  ) : null;
  return (
    <KindFrame
      groupId="Registry"
      testId="promises-page"
      kindLabel={t("c.kind.promises")}
      group="Registry"
      figure={number(totals.open)}
      of={number(totals.total)}
      tone={totals.open ? "warn" : "ok"}
      sentence={
        totals.open ? plural("c.promises.sentenceOpen", totals.open) : t("c.promises.sentenceAll")
      }
      lead={
        <>
          {t("c.promises.lead", {
            share: Math.round(provenShare * 100),
            records: totals.records,
          })}
          {totals.listed != null && totals.listed < totals.total ? (
            <span className="t-c-subset" data-testid="promise-subset">
              {" "}
              {t("c.promises.subset", { count: totals.listed })}
            </span>
          ) : null}
        </>
      }
      stats={
        <>
          <MiniStat label={t("c.promises.state.proven")} value={totals.proven} tone="ok" />
          <MiniStat label={t("c.promises.state.open")} value={totals.open} tone="warn" />
          <MiniStat
            label={t("c.promises.stat.deviations")}
            value={totals.deviating}
            tone={totals.deviating ? "bad" : undefined}
          />
        </>
      }
      views={VIEWS.map((v) => ({ ...v, label: t(v.label) }))}
      view={view}
      onView={p.onView}
      aside={
        !mobile && view !== "mosaic" && detail ? (
          <div className="t-raised t-pad t-c-aside">{detail}</div>
        ) : undefined
      }
    >
      <Collection
        state={p.state ?? "ready"}
        toolbar={
          <CollectionToolbar
            query={p.query}
            queryLabel={t("c.promises.search")}
            placeholder={t("c.promises.searchPlaceholder")}
            facets={p.facets}
            onQuery={p.onQuery}
            onFacet={p.onFacet}
            onReset={p.onReset}
            sortLabel={view === "open" ? t("c.promises.view.openFirst") : "Record"}
          />
        }
        filteredEmpty={{
          query: p.query,
          onReset: p.onReset,
          suggestions: p.suggestions?.length ? (
            <span className="t-row t-row--wrap" data-testid="promise-suggestions">
              <span className="t-meta">{t("c.closest")}</span>
              {p.suggestions.map((s) => (
                <Chip key={s} mono onClick={() => p.onOpenRecord?.(s)}>
                  {short(s)}
                </Chip>
              ))}
            </span>
          ) : undefined,
        }}
        pagination={
          view === "mosaic" ? undefined : (
            <Pagination
              page={p.page}
              pageSize={p.pageSize}
              total={p.total}
              onPage={p.onPage}
              compact={mobile}
            />
          )
        }
      >
        {view === "mosaic" ? (
          <Mosaic records={p.records} onOpenRecord={p.onOpenRecord} />
        ) : view === "open" ? (
          <OpenFirst
            items={p.items}
            selected={p.selected?.key}
            hidden={totals.proven}
            onSelect={p.onSelect}
          />
        ) : (
          <ul className="t-c-rows t-stagger" aria-label={t("c.kind.promises")}>
            {p.items.map((it) => (
              <li key={it.key}>
                <button
                  type="button"
                  className="t-c-prow"
                  aria-current={p.selected?.key === it.key || undefined}
                  onClick={() => p.onSelect?.(it.key)}
                >
                  <StateMark state={it.state} />
                  <span className="t-c-prow__main">
                    <span className="t-c-prow__then t-clamp-2">
                      {stripMd(splitGwt(it.text).then)}
                    </span>
                    <span className="t-meta t-wrap">
                      {capOf(it.recordId)} · {short(it.recordId)} · {it.scenarioId}
                    </span>
                  </span>
                  <span className="t-c-prow__tests t-meta">
                    <Icon name="test" size={12} /> {it.tests.length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Collection>
      {mobile && detail ? (
        <Sheet
          open
          side="bottom"
          title={t("c.promises.one")}
          meta={p.selected?.recordId}
          onClose={() => p.onSelect?.(null)}
        >
          {detail}
        </Sheet>
      ) : null}
    </KindFrame>
  );
}

function Mosaic({
  records,
  onOpenRecord,
}: {
  records: PromiseRecord[];
  onOpenRecord?: (id: string) => void;
}) {
  const { t } = useText();
  const domains = [...new Set(records.map((r) => r.domain))];
  return (
    <div className="t-stack" style={{ gap: 20 }} data-testid="promise-mosaic">
      <div className="t-c-legend">
        <span className="t-c-legend__sw" style={{ background: "var(--t-ok)" }} />{" "}
        {t("c.promises.state.proven")}
        <span className="t-c-legend__sw" style={{ background: "var(--t-warn)" }} />{" "}
        {t("c.promises.state.open")}
        <span className="t-c-legend__sw" style={{ background: "var(--t-bad)" }} />{" "}
        {t("c.promises.legend.deviation")}
        <span className="t-meta">{t("c.promises.legend.cell")}</span>
      </div>
      {domains.map((d) => {
        const list = records.filter((r) => r.domain === d);
        const cells = list.flatMap((r) => r.cells);
        const open = cells.filter((c) => c.state !== "proven").length;
        return (
          <section key={d} aria-label={d} className="t-stack" style={{ gap: 8 }}>
            <div className="t-row">
              <h2 className="t-h3 t-mono">{d}</h2>
              <span className="t-meta">
                {t("c.promises.domainMeta", {
                  records: list.length,
                  promises: cells.length,
                  open,
                })}
              </span>
            </div>
            <div className="t-c-mosaic">
              {list.map((r) => {
                const ro = r.cells.filter((c) => c.state !== "proven").length;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className="t-c-mosaic__rec"
                    data-open={ro ? "true" : undefined}
                    title={`${r.id}: ${t("c.promises.cellsOpen", { count: r.cells.length, open: ro })}`}
                    onClick={() => onOpenRecord?.(r.id)}
                  >
                    <span className="t-c-mosaic__name t-mono t-wrap">{short(r.id)}</span>
                    <span className="t-c-mosaic__cells" aria-hidden="true">
                      {r.cells.map((c) => (
                        <span
                          key={c.scenarioId}
                          className={`t-c-mosaic__cell t-c-mosaic__cell--${c.state}`}
                        />
                      ))}
                    </span>
                    <span className="t-sr">
                      {t("c.promises.cellsOpen", { count: r.cells.length, open: ro })}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function OpenFirst({
  items,
  selected,
  hidden,
  onSelect,
}: {
  items: PromiseItem[];
  selected?: string;
  hidden: number;
  onSelect?: (key: string) => void;
}) {
  const { t, number } = useText();
  const byRecord = new Map<string, PromiseItem[]>();
  items.forEach((i) => byRecord.set(i.recordId, [...(byRecord.get(i.recordId) ?? []), i]));
  return (
    <div className="t-stack" style={{ gap: 16 }} data-testid="promise-open-first">
      {[...byRecord.entries()].map(([rid, list]) => (
        <section key={rid} className="t-surface t-c-group" aria-label={rid}>
          <header className="t-c-group__head">
            <RecordRef id={rid} />
            <span className="t-spacer" />
            <ShareBar
              label={t("c.openCount", { count: list.length })}
              parts={[
                {
                  key: "o",
                  value: list.filter((i) => i.state === "open").length,
                  tone: "warn",
                },
                {
                  key: "a",
                  value: list.filter((i) => i.state === "deviation").length,
                  tone: "bad",
                },
              ]}
            />
            <span className="t-meta">{t("c.openCount", { count: list.length })}</span>
          </header>
          <ol className="t-c-plain">
            {list.map((it) => (
              <li key={it.key}>
                <button
                  type="button"
                  className="t-c-openrow"
                  aria-current={selected === it.key || undefined}
                  onClick={() => onSelect?.(it.key)}
                >
                  <StateMark state={it.state} />
                  <span className="t-mono t-c-small t-wrap">{it.scenarioId}</span>
                  <span className="t-c-openrow__then t-ellipsis">
                    {stripMd(splitGwt(it.text).then)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="t-meta t-c-center">{t("c.promises.provenFollow", { count: number(hidden) })}</p>
    </div>
  );
}
