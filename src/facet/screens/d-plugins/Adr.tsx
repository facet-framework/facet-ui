import { Icon } from "../../primitives/Icon";
import { Badge, Button, Chip, Dot, Field, IconButton, type Tone } from "../../primitives/controls";
import { Distribution, EmptyState } from "../../primitives/display";
import {
  Collection,
  CollectionToolbar,
  DataTable,
  Pagination,
  type CollectionState,
} from "../../primitives/collection";
import { Sheet } from "../../primitives/overlay";
import { useText } from "../../i18n/TextProvider";
import type { TextKey } from "../../i18n/en";
import { Facts, Inline, Markdown, PluginHead, noop, useLifecycleLabel } from "./shared";

export const ADR_FOLD_WORDS = 500;

export type AdrStatus = "proposed" | "accepted" | "superseded" | "rejected" | "unknown";

export const ADR_STATUSES: AdrStatus[] = ["proposed", "accepted", "superseded", "rejected"];
const TONE: Record<AdrStatus, Tone> = {
  proposed: "plan",
  accepted: "ok",
  ["superseded"]: "neutral",
  rejected: "bad",
  unknown: "warn",
};
const COLOR: Record<AdrStatus, string> = {
  proposed: "var(--t-plan)",
  accepted: "var(--t-ok)",
  ["superseded"]: "var(--t-faint)",
  rejected: "var(--t-bad)",
  unknown: "var(--t-warn)",
};

const STATUS_KEY: Record<AdrStatus, TextKey> = {
  proposed: "d.adr.status.proposed",
  accepted: "d.adr.status.accepted",
  ["superseded"]: "d.adr.status.superseded",
  rejected: "d.adr.status.rejected",
  unknown: "d.adr.status.unknown",
};

export function useAdrStatusLabel() {
  const { t } = useText();
  return (s: AdrStatus) => t(STATUS_KEY[s]);
}

export function AdrStatusBadge({ status }: { status: AdrStatus }) {
  const label = useAdrStatusLabel();
  return <Badge tone={TONE[status]}>{label(status)}</Badge>;
}

export function AdrAuthors({ authors }: { authors: string[] | null }) {
  const { t } = useText();
  if (authors == null)
    return (
      <span className="t-muted" title={t("d.adr.authorsUnknown")} data-testid="adr-authors-unknown">
        —
      </span>
    );
  if (!authors.length)
    return (
      <span className="t-muted" data-testid="adr-authors-none">
        {t("d.adr.authorsNone")}
      </span>
    );
  return <span>{authors.join(", ")}</span>;
}

export type AdrItem = {
  number: number;
  title: string;
  status: AdrStatus;
  date: string;

  authors: string[] | null;
  area: string;
  supersededBy?: number;
  refs: number;
  file: string;
};

export type AdrView = "timeline" | "board" | "table";
export type AdrSortKey =
  "number" | "title" | "status" | "date" | "area" | "authors" | "refs" | "sup";

export const BOARD_CAP = 12;

export type AdrCollectionProps = {
  state: CollectionState;
  view: AdrView;
  items: AdrItem[];
  total: number;
  counts: Record<AdrStatus, number>;
  page: number;
  pageSize: number;
  query: string;
  activeStatus?: AdrStatus | null;
  directory: string;

  sort?: { key: AdrSortKey; dir: "asc" | "desc" };
  mobile?: boolean;
  onSort?: (key: AdrSortKey) => void;
  onView?: (v: AdrView) => void;
  onQuery?: (q: string) => void;
  onStatus?: (s: string) => void;
  onPage?: (p: number) => void;
  onPageSize?: (n: number) => void;
  onOpen?: (n: number) => void;
  onCreate?: () => void;

  createDisabledReason?: string;
  onSettings?: () => void;
  onReset?: () => void;
};

const pad = (n: number) => String(n).padStart(4, "0");

function AdrCard({ a, onOpen }: { a: AdrItem; onOpen: (n: number) => void }) {
  const { plural } = useText();
  return (
    <button type="button" className="t-d-adrcard t-interactive" onClick={() => onOpen(a.number)}>
      <span className="t-row t-row--between">
        <span className="t-mono t-meta">ADR {pad(a.number)}</span>
        <span className="t-mono t-meta">{a.date}</span>
      </span>
      <span className="t-d-adrcard__title t-clamp-2">{a.title}</span>
      <span className="t-row t-row--wrap t-meta" style={{ gap: 8 }}>
        <span className="t-mono">{a.area}</span>
        <span>{plural("d.adr.card.records", a.refs)}</span>
        {a.supersededBy ? <span>· → {pad(a.supersededBy)}</span> : null}
      </span>
    </button>
  );
}

function Timeline({
  items,
  dir,
  onOpen,
}: {
  items: AdrItem[];
  dir: "asc" | "desc";
  onOpen: (n: number) => void;
}) {
  const sign = dir === "asc" ? 1 : -1;
  const chronological = [...items].sort(
    (a, b) => (a.date.localeCompare(b.date) || a.number - b.number) * sign,
  );
  const years = new Map<string, AdrItem[]>();
  for (const a of chronological) {
    const y = a.date.slice(0, 4);
    years.set(y, [...(years.get(y) ?? []), a]);
  }
  const { t } = useText();
  return (
    <div className="t-d-adrtime" aria-label={t("d.adr.timeline")}>
      {[...years.entries()].map(([year, list]) => (
        <section key={year} className="t-d-adrtime__year">
          <h3 className="t-d-adrtime__label">
            {year} <span className="t-meta">{list.length}</span>
          </h3>
          <ol className="t-d-adrtime__list t-stagger">
            {list.map((a) => (
              <li key={a.number} className="t-d-adrtime__item" data-status={a.status}>
                <span
                  className="t-d-adrtime__node"
                  style={{ background: COLOR[a.status] }}
                  aria-hidden="true"
                />
                <span className="t-mono t-meta t-d-adrtime__date">{a.date.slice(5)}</span>
                <button
                  type="button"
                  className="t-d-adrtime__body"
                  onClick={() => onOpen(a.number)}
                >
                  <span className="t-row" style={{ gap: 8 }}>
                    <span className="t-mono t-meta">{pad(a.number)}</span>
                    <span className="t-wrap">{a.title}</span>
                  </span>
                  <span className="t-row t-meta" style={{ gap: 8 }}>
                    <AdrStatusBadge status={a.status} />
                    <AdrAuthors authors={a.authors} />
                    <span className="t-mono">{a.area}</span>
                    {a.supersededBy ? (
                      <span>{t("d.adr.supersededBy", { number: pad(a.supersededBy) })}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function Board({
  items,
  counts,
  onOpen,
  onMore,
}: {
  items: AdrItem[];
  counts: Record<AdrStatus, number>;
  onOpen: (n: number) => void;
  onMore: (s: AdrStatus) => void;
}) {
  const { t, number } = useText();
  const label = useAdrStatusLabel();
  return (
    <div className="t-d-board" aria-label="Board">
      {ADR_STATUSES.map((s) => {
        const col = items
          .filter((a) => a.status === s)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, BOARD_CAP);
        const rest = counts[s] - col.length;
        return (
          <section key={s} className="t-d-board__col" aria-label={label(s)}>
            <header className="t-row t-row--between">
              <span className="t-row" style={{ gap: 6 }}>
                <span className="t-dot" style={{ background: COLOR[s] }} />
                <span className="t-label">{label(s)}</span>
              </span>
              <span className="t-mono t-meta">{number(counts[s])}</span>
            </header>
            <div className="t-stack t-stagger" style={{ gap: 8 }}>
              {col.map((a) => (
                <AdrCard key={a.number} a={a} onOpen={onOpen} />
              ))}
            </div>
            {rest > 0 ? (
              <Button size="small" variant="quiet" icon="forward" onClick={() => onMore(s)}>
                {t("d.adr.board.more", { count: rest })}
              </Button>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

const SORT_KEY: Record<AdrSortKey, TextKey | null> = {
  number: "d.adr.col.number",
  title: "d.adr.col.title",
  status: null,
  date: "d.adr.col.date",
  area: "d.adr.col.area",
  authors: "d.adr.col.authors",
  refs: null,
  sup: "d.adr.col.supersededBy",
};
const SORT_FIXED: Partial<Record<AdrSortKey, string>> = { status: "Status", refs: "Records" };

export function AdrCollection({
  state,
  view,
  items,
  total,
  counts,
  page,
  pageSize,
  query,
  activeStatus,
  directory,
  sort = { key: "number", dir: "desc" },
  mobile,
  onSort = noop,
  onView = noop,
  onQuery = noop,
  onStatus = noop,
  onPage = noop,
  onPageSize = noop,
  onOpen = noop,
  onCreate = noop,
  createDisabledReason,
  onSettings = noop,
  onReset = noop,
}: AdrCollectionProps) {
  const { t, number } = useText();
  const statusLabel = useAdrStatusLabel();
  const sortKey = SORT_KEY[sort.key];
  const sortLabel = sortKey ? t(sortKey) : (SORT_FIXED[sort.key] ?? sort.key);
  const shown = activeStatus ? counts[activeStatus] : total;
  const accepted = total
    ? t("shell.percent", { value: Math.round((counts.accepted / total) * 100) })
    : "—";
  return (
    <div className="t-page t-stack" style={{ gap: 20 }}>
      <PluginHead
        icon="decision"
        title={t("d.adr.title")}
        count={state === "loading" ? "—" : number(total)}
        meta={<span className="t-mono">{directory}</span>}
        sentence={
          state === "loading"
            ? t("d.adr.reading")
            : total
              ? t("d.adr.sentence", { share: accepted, waiting: counts.proposed })
              : t("d.adr.sentenceNone")
        }
        actions={
          <>
            {mobile ? (
              <IconButton icon="settings" label={t("d.adr.directory")} onClick={onSettings} />
            ) : (
              <Button variant="quiet" icon="settings" onClick={onSettings}>
                {t("d.adr.directory")}
              </Button>
            )}
            <Button
              variant="primary"
              icon="plus"
              onClick={onCreate}
              disabledReason={createDisabledReason}
            >
              {t("d.adr.new")}
            </Button>
          </>
        }
      />
      <Collection
        state={state}
        toolbar={
          <CollectionToolbar<AdrView>
            query={query}
            queryLabel={t("d.adr.search")}
            placeholder={t("d.adr.searchPlaceholder")}
            facets={ADR_STATUSES.map((s) => ({
              key: s,
              label: statusLabel(s),
              count: counts[s],
              active: activeStatus === s,
            }))}
            views={[
              { value: "timeline", label: t("d.adr.timeline"), icon: "timeline" },
              { value: "board", label: "Board", icon: "board" },
              { value: "table", label: t("d.adr.view.table"), icon: "table" },
            ]}
            view={view}
            sortLabel={
              view === "table"
                ? `${sortLabel} ${sort.dir === "asc" ? "▲" : "▼"}`
                : t("d.adr.newestFirst")
            }
            onQuery={onQuery}
            onFacet={onStatus}
            onView={onView}
            onReset={onReset}
          />
        }
        distribution={
          state === "ready" ? (
            <Distribution
              label={t("d.adr.byStatus")}
              parts={ADR_STATUSES.map((s) => ({
                key: s,
                label: statusLabel(s),
                value: counts[s],
                tone: COLOR[s],
                active: activeStatus === s,
              }))}
              onPick={onStatus}
            />
          ) : null
        }
        empty={{
          icon: "decision",
          title: t("d.adr.empty.title"),
          body: (
            <>
              {t("d.adr.empty.before")}
              <span className="t-mono">{directory}</span>
              {t("d.adr.empty.after")}
            </>
          ),
          action: (
            <>
              <Button
                variant="primary"
                icon="plus"
                onClick={onCreate}
                disabledReason={createDisabledReason}
              >
                {t("d.adr.empty.first")}
              </Button>
              <Button icon="folder" onClick={onSettings}>
                {t("d.adr.empty.other")}
              </Button>
            </>
          ),
        }}
        filteredEmpty={{ query, onReset }}
        error={{ title: t("d.adr.error"), reason: directory, onRetry: onReset }}
        pagination={
          view === "board" ? null : (
            <Pagination
              page={page}
              pageSize={pageSize}
              pageSizes={[30, 60, 120]}
              total={shown}
              compact={mobile}
              onPage={onPage}
              onPageSize={onPageSize}
            />
          )
        }
      >
        {view === "timeline" ? <Timeline items={items} dir={sort.dir} onOpen={onOpen} /> : null}
        {view === "board" ? (
          <Board items={items} counts={counts} onOpen={onOpen} onMore={onStatus} />
        ) : null}
        {view === "table" && mobile ? (
          <ul className="t-d-cardlist">
            {items.map((a) => (
              <li key={a.number}>
                <AdrCard a={a} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        ) : null}
        {view === "table" && !mobile ? (
          <DataTable<AdrItem>
            label={t("d.adr.title")}
            rows={items}
            rowKey={(a) => String(a.number)}
            sort={sort}
            onSort={(k) => onSort(k as AdrSortKey)}
            onRowClick={(a) => onOpen(a.number)}
            columns={[
              {
                key: "number",
                label: t("d.adr.col.number"),
                sortable: true,
                width: 72,
                render: (a) => <span className="t-mono">{pad(a.number)}</span>,
              },
              { key: "title", label: t("d.adr.col.title"), sortable: true, render: (a) => a.title },
              {
                key: "status",
                label: "Status",
                sortable: true,
                render: (a) => <AdrStatusBadge status={a.status} />,
              },
              {
                key: "date",
                label: t("d.adr.col.date"),
                sortable: true,
                render: (a) => <span className="t-mono">{a.date}</span>,
              },
              {
                key: "area",
                label: t("d.adr.col.area"),
                sortable: true,
                render: (a) => <span className="t-mono">{a.area}</span>,
              },
              {
                key: "authors",
                label: t("d.adr.col.authors"),
                sortable: true,
                render: (a) => <AdrAuthors authors={a.authors} />,
              },
              {
                key: "refs",
                label: "Records",
                numeric: true,
                sortable: true,
                render: (a) => a.refs,
              },
              {
                key: "sup",
                label: t("d.adr.col.supersededBy"),
                sortable: true,
                render: (a) =>
                  a.supersededBy ? <span className="t-mono">{pad(a.supersededBy)}</span> : "—",
              },
            ]}
          />
        ) : null}
      </Collection>
    </div>
  );
}

export type AdrDetail = {
  number: number;
  title: string;
  status: AdrStatus;
  rawStatus: string;
  date: string;
  file: string;

  authors: string[] | null;
  supersedes?: { number: number; title: string };
  supersededBy?: { number: number; title: string };
};

export type AdrReaderProps = {
  adr: AdrDetail;

  markdown: string;

  facts?: [string, string][];

  anchor?: string | null;
  toc: { id: string; label: string }[];
  records: { id: string; summary: string; lifecycle: string }[];

  chain?: { number: number; title: string; status: AdrStatus; date: string }[];

  readable?: boolean;
  mobile?: boolean;
  onBack?: () => void;
  onOpenRecord?: (id: string) => void;
  onLink?: (href: string) => void;
  onCopyCode?: (code: string) => void;
};

export function AdrReader({
  adr,
  markdown,
  facts = [],
  anchor = null,
  toc,
  records,
  readable = true,
  chain = [],
  mobile,
  onBack = noop,
  onOpenRecord = noop,
  onLink = noop,
  onCopyCode = noop,
}: AdrReaderProps) {
  const { t, plural } = useText();
  const lifecycleLabel = useLifecycleLabel();
  const fold = markdown.split(/\s+/).filter(Boolean).length > ADR_FOLD_WORDS;
  return (
    <article className="t-page t-d-adr t-anim-focus" aria-label={adr.title}>
      <Button variant="quiet" size="small" icon="back" onClick={onBack}>
        {t("d.adr.title")}
      </Button>
      <header className="t-d-adr__head">
        <span className="t-d-adr__num t-mono">{pad(adr.number)}</span>
        <div className="t-stack" style={{ gap: 6, minWidth: 0 }}>
          <h1 className="t-d-article__title">{adr.title}</h1>
          <div className="t-row t-row--wrap" style={{ gap: 8 }}>
            {adr.status === "unknown" ? (
              <span className="t-meta">
                {t("d.adr.header.saysBefore")}
                <span className="t-mono">{adr.rawStatus}</span>
                {t("d.adr.header.saysAfter")}
              </span>
            ) : null}
            <span className="t-meta t-d-adr__meta">
              {adr.date} · <AdrAuthors authors={adr.authors} /> ·{" "}
              <span className="t-mono">{adr.file}</span>
            </span>
          </div>
          {facts.length ? (
            <dl className="t-d-adr__front" data-testid="adr-front">
              {facts.map(([k, v], i) => (
                <div key={i} className="t-d-adr__fact">
                  <dt>{k}</dt>
                  <dd>
                    <Inline text={v} onLink={onLink} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className="t-row t-row--wrap" style={{ gap: 8 }}>
            {adr.supersedes ? (
              <Chip icon="back" onClick={() => onLink(`adr:${adr.supersedes?.number}`)}>
                {t("d.adr.supersedes", {
                  number: pad(adr.supersedes.number),
                  title: adr.supersedes.title,
                })}
              </Chip>
            ) : null}
            {adr.supersededBy ? (
              <Chip icon="forward" onClick={() => onLink(`adr:${adr.supersededBy?.number}`)}>
                {t("d.adr.supersededBy", { number: pad(adr.supersededBy.number) })}
              </Chip>
            ) : null}
          </div>
        </div>
        <dl className="t-d-adr__status" data-testid="adr-status">
          <dt>Status:</dt>
          <dd>
            <AdrStatusBadge status={adr.status} />
          </dd>
        </dl>
      </header>
      {mobile ? (
        <nav className="t-d-chipbar" aria-label={t("d.adr.toc")}>
          {toc.map((entry) => (
            <Chip key={entry.id} onClick={() => onLink(`#${entry.id}`)}>
              {entry.label}
            </Chip>
          ))}
        </nav>
      ) : null}
      {chain.length > 1 ? (
        <nav className="t-d-chain" aria-label={t("d.adr.chain")}>
          <span className="t-label">{t("d.adr.chainCount", { count: chain.length })}</span>
          <ol className="t-d-chain__list">
            {chain.map((c) => (
              <li key={c.number} aria-current={c.number === adr.number ? "step" : undefined}>
                <button
                  type="button"
                  className="t-d-chain__item"
                  onClick={() => onLink(`adr:${c.number}`)}
                >
                  <span className="t-row" style={{ gap: 8 }}>
                    <span className="t-mono t-meta">{pad(c.number)}</span>
                    <AdrStatusBadge status={c.status} />
                  </span>
                  <span className="t-clamp-2">{c.title}</span>
                  <span className="t-mono t-meta">{c.date}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="t-d-adr__grid">
        {!mobile ? (
          <nav className="t-d-toc" aria-label={t("d.adr.toc")}>
            <span className="t-label">{t("d.adr.toc")}</span>
            {toc.map((entry) => (
              <a
                key={entry.id}
                href={`#${entry.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onLink(`#${entry.id}`);
                }}
              >
                {entry.label}
              </a>
            ))}
          </nav>
        ) : null}
        <div className="t-d-article__body">
          {readable ? (
            <Markdown
              source={markdown}
              onLink={onLink}
              onCopyCode={onCopyCode}
              anchors
              fold={fold}
              openAnchor={anchor}
            />
          ) : (
            <EmptyState
              tone="error"
              icon="error"
              title={t("d.adr.unreadable.title")}
              body={
                <>
                  <span className="t-mono">{adr.file}</span>
                  {t("d.adr.unreadable.body")}
                </>
              }
            />
          )}
        </div>
        <aside className="t-stack" style={{ gap: 12 }}>
          <section className="t-d-card" aria-label={t("d.adr.linked")}>
            <span className="t-label">{plural("d.adr.names", records.length)}</span>
            {records.map((r) => (
              <button
                key={r.id}
                type="button"
                className="t-d-recordlink"
                onClick={() => onOpenRecord(r.id)}
              >
                <span className="t-mono t-wrap">{r.id}</span>
                <span className="t-meta t-clamp-2">{r.summary || t("d.adr.noSummary")}</span>
                <Badge plain>{lifecycleLabel(r.lifecycle)}</Badge>
              </button>
            ))}
          </section>
          <section className="t-d-card" aria-label={t("d.adr.head")}>
            <span className="t-label">{t("d.adr.head")}</span>
            <Facts
              rows={[
                [
                  t("d.adr.fact.number"),
                  <span key="n" className="t-mono">
                    {pad(adr.number)}
                  </span>,
                ],
                ["Status", adr.rawStatus],
                [t("d.adr.col.date"), adr.date],
                [
                  t("d.adr.fact.file"),
                  <span key="f" className="t-mono t-wrap">
                    {adr.file}
                  </span>,
                ],
              ]}
            />
          </section>
        </aside>
      </div>
    </article>
  );
}

export type AdrStatusFormProps = {
  adr: AdrDetail;
  next: AdrStatus;
  reason: string;
  reasonError?: string;
  successor?: number | null;
  successors: { number: number; title: string }[];
  branch: string;
  diff: string;
  mobile?: boolean;
  onNext?: (s: AdrStatus) => void;
  onChange?: (field: string, value: string) => void;
  onSubmit?: () => void;
  onClose?: () => void;
};

export function AdrStatusForm({
  adr,
  next,
  reason,
  reasonError,
  successor,
  successors,
  branch,
  diff,
  mobile,
  onNext = noop,
  onChange = noop,
  onSubmit = noop,
  onClose = noop,
}: AdrStatusFormProps) {
  const { t } = useText();
  const statusLabel = useAdrStatusLabel();
  return (
    <Sheet
      open
      side={mobile ? "bottom" : "right"}
      title={t("d.adr.proposeStatus")}
      meta={`ADR ${pad(adr.number)} · ${adr.title}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {t("d.adr.cancel")}
          </Button>
          <Button
            variant="primary"
            icon="pr"
            disabled={!!reasonError || next === adr.status}
            onClick={onSubmit}
          >
            {t("d.adr.proposeAsPr")}
          </Button>
        </>
      }
    >
      <div className="t-stack" style={{ gap: 16 }}>
        <div className="t-d-statusflow">
          <AdrStatusBadge status={adr.status} />
          <Icon name="forward" size={14} />
          <AdrStatusBadge status={next} />
        </div>
        <div className="t-d-radios" role="radiogroup" aria-label={t("d.adr.newStatus")}>
          {ADR_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={next === s}
              className="t-d-radio"
              disabled={s === adr.status}
              onClick={() => onNext(s)}
            >
              <span className="t-dot" style={{ background: COLOR[s] }} />
              {statusLabel(s)}
              {s === adr.status ? <span className="t-meta">{t("d.adr.now")}</span> : null}
            </button>
          ))}
        </div>
        {next === "superseded" ? (
          <Field label={t("d.adr.col.supersededBy")}>
            {(id) => (
              <select
                id={id}
                className="t-select"
                value={successor ?? ""}
                onChange={(e) => onChange("successor", e.target.value)}
              >
                <option value="">{t("d.adr.choose")}</option>
                {successors.map((s) => (
                  <option key={s.number} value={s.number}>
                    {pad(s.number)} · {s.title}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : null}
        <Field label={t("d.adr.reason")} error={reasonError} hint={t("d.adr.reasonHint")}>
          {(id) => (
            <textarea
              id={id}
              className="t-textarea"
              rows={4}
              value={reason}
              aria-invalid={!!reasonError}
              onChange={(e) => onChange("reason", e.target.value)}
            />
          )}
        </Field>
        <Facts
          rows={[
            [
              t("d.adr.branch"),
              <span key="b" className="t-mono">
                {branch}
              </span>,
            ],
            [
              t("d.adr.fact.file"),
              <span key="f" className="t-mono">
                {adr.file}
              </span>,
            ],
          ]}
        />
        <pre className="t-d-codeblock" aria-label={t("d.adr.headChange")}>
          {diff}
        </pre>
      </div>
    </Sheet>
  );
}

export type AdrNewFormProps = {
  number: number;
  title: string;
  titleError?: string;
  context: string;
  decision: string;
  consequences: string;
  records: string[];
  file: string;
  mobile?: boolean;
  onChange?: (field: string, value: string) => void;
  onRemoveRecord?: (id: string) => void;
  onAddRecord?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
};

export function AdrNewForm({
  number,
  title,
  titleError,
  context,
  decision,
  consequences,
  records,
  file,
  onChange = noop,
  onRemoveRecord = noop,
  onAddRecord = noop,
  onSubmit = noop,
  onCancel = noop,
}: AdrNewFormProps) {
  const { t } = useText();
  const statusLabel = useAdrStatusLabel();
  const sections: [string, string, string, string][] = [
    ["context", t("d.adr.section.context"), context, t("d.adr.section.contextHint")],
    ["decision", t("d.adr.section.decision"), decision, t("d.adr.section.decisionHint")],
    [
      "consequences",
      t("d.adr.section.consequences"),
      consequences,
      t("d.adr.section.consequencesHint"),
    ],
  ];
  return (
    <form
      className="t-page t-d-form t-anim-rise"
      aria-label={t("d.adr.new")}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <PluginHead
        icon="decision"
        title={t("d.adr.new")}
        count={`ADR ${pad(number)}`}
        sentence={<span className="t-mono">{file}</span>}
      />
      <Field label={t("d.adr.col.title")} error={titleError}>
        {(id) => (
          <input
            id={id}
            className="t-input"
            value={title}
            aria-invalid={!!titleError}
            onChange={(e) => onChange("title", e.target.value)}
          />
        )}
      </Field>
      <div className="t-d-form__grid">
        <Field label="Status">
          {(id) => <input id={id} className="t-input" value={statusLabel("proposed")} readOnly />}
        </Field>
        <Field label={t("d.adr.col.date")}>
          {(id) => <input id={id} className="t-input t-mono" value="2026-11-13" readOnly />}
        </Field>
      </div>
      {sections.map(([key, label, value, hint]) => (
        <Field key={key} label={label} hint={hint}>
          {(id) => (
            <textarea
              id={id}
              className="t-textarea"
              rows={key === "decision" ? 3 : 4}
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
            />
          )}
        </Field>
      ))}
      <div className="t-field">
        <span className="t-field__label">{t("d.adr.affects")}</span>
        <div className="t-row t-row--wrap" style={{ gap: 6 }}>
          {records.map((r) => (
            <Chip key={r} mono icon="records" onRemove={() => onRemoveRecord(r)}>
              {r}
            </Chip>
          ))}
          <Button size="small" variant="quiet" icon="plus" onClick={onAddRecord}>
            {t("d.adr.linkRecord")}
          </Button>
        </div>
      </div>
      <footer className="t-d-form__foot">
        <span className="t-meta">{t("d.adr.proposedVia")}</span>
        <span className="t-spacer" />
        <Button variant="quiet" onClick={onCancel}>
          {t("d.adr.cancel")}
        </Button>
        <Button type="submit" variant="primary" icon="pr" disabled={!!titleError}>
          {t("d.adr.proposeDraft")}
        </Button>
      </footer>
    </form>
  );
}

export type AdrDirectoryProps = {
  directory: string;
  error?: string;
  found: number | null;
  sample: string[];
  ignored: { file: string; reason: string }[];
  onChange?: (v: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
};

export function AdrDirectorySetting({
  directory,
  error,
  found,
  sample,
  ignored,
  onChange = noop,
  onSave = noop,
  onCancel = noop,
}: AdrDirectoryProps) {
  const { t, plural } = useText();
  return (
    <section className="t-page t-d-form t-anim-rise" aria-label={t("d.adr.dir.label")}>
      <PluginHead icon="folder" title={t("d.adr.dir.title")} sentence={t("d.adr.dir.sentence")} />
      <Field label="adr.directory" error={error} hint={t("d.adr.dir.hint")}>
        {(id) => (
          <input
            id={id}
            className="t-input t-mono"
            value={directory}
            aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </Field>
      <div className="t-d-card">
        <span className="t-label">{t("d.adr.dir.preview")}</span>
        <span className="t-h3" data-testid="adr-found">
          {found == null ? "—" : plural("d.adr.dir.found", found)}
        </span>
        <ul className="t-d-filelist">
          {sample.map((f) => (
            <li key={f} className="t-row">
              <Icon name="file" size={14} /> <span className="t-mono t-wrap">{f}</span>
            </li>
          ))}
        </ul>
        {ignored.length ? (
          <>
            <span className="t-label">{t("d.adr.dir.skipped", { count: ignored.length })}</span>
            <ul className="t-d-filelist">
              {ignored.map((f) => (
                <li key={f.file} className="t-row">
                  <Dot tone="warn" /> <span className="t-mono t-wrap">{f.file}</span>
                  <span className="t-meta">{f.reason}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      <pre
        className="t-d-codeblock"
        aria-label=".facetrc.yaml"
      >{`# .facetrc.yaml\nadr:\n  directory: ${directory}`}</pre>
      <footer className="t-d-form__foot">
        <span className="t-spacer" />
        <Button variant="quiet" onClick={onCancel}>
          {t("d.adr.cancel")}
        </Button>
        <Button variant="primary" icon="check" disabled={!!error} onClick={onSave}>
          {t("d.adr.dir.apply")}
        </Button>
      </footer>
    </section>
  );
}

export function AdrEmpty({
  directory,
  onCreate = noop,
  createDisabledReason,
  onSettings = noop,
}: {
  directory: string;
  onCreate?: () => void;

  createDisabledReason?: string;
  onSettings?: () => void;
}) {
  return (
    <AdrCollection
      state="empty"
      view="timeline"
      items={[]}
      total={0}
      counts={{ proposed: 0, accepted: 0, ["superseded"]: 0, rejected: 0, unknown: 0 }}
      page={1}
      pageSize={25}
      query=""
      directory={directory}
      onCreate={onCreate}
      createDisabledReason={createDisabledReason}
      onSettings={onSettings}
    />
  );
}
