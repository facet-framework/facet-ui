import { useState, type KeyboardEvent, type ReactNode } from "react";
import { useText } from "../i18n/TextProvider";
import { Icon, type IconName } from "./Icon";
import { Button, Chip, SearchField, Segment } from "./controls";
import { EmptyState, LoadingState } from "./display";

/* Data table ------------------------------------------------------------ */

export type SortDir = "asc" | "desc";

export type Column<R> = {
  key: string;
  label: string;
  /** Right-aligned, tabular figures. */
  numeric?: boolean;
  sortable?: boolean;
  width?: number | string;
  render: (row: R) => ReactNode;
  /** Hidden below 768 px; the mobile card shows only the remaining columns. */
  hideOnMobile?: boolean;
};

export type DataTableProps<R> = {
  label: string;
  columns: Column<R>[];
  rows: R[];
  rowKey: (row: R) => string;
  sort?: { key: string; dir: SortDir };
  onSort?: (key: string) => void;
  onRowClick?: (row: R) => void;
  /** Key of the selected row (`aria-selected`); only with `onRowClick`. */
  selectedKey?: string;
  dense?: boolean;
};

/**
 * A sortable table. Sorting is a click on the column header that toggles
 * ascending and descending; the state is announced through `aria-sort`, and a
 * sortable column that is not sorted says `none`. Below 768 px the table
 * becomes a list of cards (`.t-table-cards`).
 *
 * With `onRowClick` the rows form a grid with one tab stop: the arrows move
 * between rows, Home and End jump, Enter or Space activate, as a click does.
 * The scroll box is a named region that the keyboard can reach and scroll.
 */
export function DataTable<R>({
  label,
  columns,
  rows,
  rowKey,
  sort,
  onSort,
  onRowClick,
  selectedKey,
  dense,
}: DataTableProps<R>) {
  const [focusKey, setFocusKey] = useState<string>();
  const keys = rows.map(rowKey);
  const stop = focusKey != null && keys.includes(focusKey) ? focusKey : keys[0];
  const interactive = !!onRowClick;
  const onRowKeyDown = (row: R, e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick?.(row);
      return;
    }
    const at = keys.indexOf(rowKey(row));
    let to = -1;
    if (e.key === "ArrowDown") to = Math.min(keys.length - 1, at + 1);
    else if (e.key === "ArrowUp") to = Math.max(0, at - 1);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = keys.length - 1;
    if (to < 0) return;
    e.preventDefault();
    setFocusKey(keys[to]);
    const body = e.currentTarget.parentElement;
    Array.from(body?.querySelectorAll<HTMLElement>("tr[data-row]") ?? [])
      .find((el) => el.dataset.row === keys[to])
      ?.focus();
  };
  return (
    // A table wider than the screen scrolls; the keyboard must reach that scroll too.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="t-table-wrap" role="region" aria-label={label} tabIndex={0}>
      <table
        className={dense ? "t-table t-table--dense" : "t-table"}
        aria-label={label}
        role={interactive ? "grid" : undefined}
      >
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const ariaSort = active
                ? sort.dir === "asc"
                  ? "ascending"
                  : "descending"
                : c.sortable
                  ? "none"
                  : undefined;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={
                    [c.numeric ? "t-num" : "", c.hideOnMobile ? "t-hide-mobile" : ""]
                      .join(" ")
                      .trim() || undefined
                  }
                  style={{ width: c.width }}
                >
                  {c.sortable ? (
                    <button type="button" onClick={() => onSort?.(c.key)}>
                      {c.label}
                      <span aria-hidden="true" className={active ? "t-ink2" : "t-muted"}>
                        {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  ) : (
                    <span>{c.label}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const key = rowKey(r);
            return (
              <tr
                key={key}
                data-row={key}
                data-clickable={interactive ? "true" : undefined}
                aria-selected={interactive ? key === selectedKey : undefined}
                tabIndex={interactive ? (key === stop ? 0 : -1) : undefined}
                onClick={
                  interactive
                    ? () => {
                        setFocusKey(key);
                        onRowClick(r);
                      }
                    : undefined
                }
                onFocus={interactive ? () => setFocusKey(key) : undefined}
                onKeyDown={interactive ? (e) => onRowKeyDown(r, e) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    data-label={c.label}
                    className={
                      [c.numeric ? "t-num" : "", c.hideOnMobile ? "t-hide-mobile" : ""]
                        .join(" ")
                        .trim() || undefined
                    }
                  >
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** A sortable value; `null` or `undefined` means the value was not measured. */
export type SortValue = string | number | null | undefined;

/**
 * Sorts rows by one value without touching the input. Unmeasured values sort last in both
 * directions: a missing value is not the smallest or the largest one, and flipping the
 * direction must not move it to the top. Equal values keep their given order (stable sort).
 */
export function sortRows<R>(rows: readonly R[], value: (row: R) => SortValue, dir: SortDir): R[] {
  return [...rows].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    const xMissing = x == null;
    const yMissing = y == null;
    if (xMissing || yMissing) return xMissing === yMissing ? 0 : xMissing ? 1 : -1;
    const r = x < y ? -1 : x > y ? 1 : 0;
    return dir === "asc" ? r : -r;
  });
}

/* Pagination ------------------------------------------------------------ */

/** Page numbers with gaps: 1 … 4 5 [6] 7 8 … 48. */
export function pageWindow(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 2);
  const to = Math.min(pages - 1, page + 2);
  if (from > 2) out.push("gap");
  for (let p = from; p <= to; p++) out.push(p);
  if (to < pages - 1) out.push("gap");
  out.push(pages);
  return out;
}

export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  pageSizes?: number[];
  onPage?: (page: number) => void;
  onPageSize?: (size: number) => void;
  /** Mobile form: a "load more" button with the range instead of numbers. */
  compact?: boolean;
};

export function Pagination({
  page,
  pageSize,
  total,
  pageSizes = [25, 50, 100],
  onPage,
  onPageSize,
  compact,
}: PaginationProps) {
  const { t } = useText();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const range = (
    <span className="t-meta" aria-live="polite">
      {t("primitives.pager.range", { from, to, total })}
    </span>
  );
  if (compact) {
    return (
      <nav className="t-pager t-pager--compact" aria-label={t("primitives.pager.label")}>
        {range}
        {to < total ? (
          <Button onClick={() => onPage?.(page + 1)}>
            {t("primitives.pager.loadMore", { count: Math.min(pageSize, total - to) })}
          </Button>
        ) : null}
      </nav>
    );
  }
  return (
    <nav className="t-pager" aria-label={t("primitives.pager.label")}>
      {range}
      <span className="t-spacer" />
      <Button
        size="small"
        variant="quiet"
        icon="back"
        aria-label={t("primitives.pager.previous")}
        disabled={page <= 1}
        onClick={() => onPage?.(page - 1)}
      />
      {pageWindow(page, pages).map((p, i) =>
        p === "gap" ? (
          <span key={`g${i}`} className="t-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className="t-pager__num"
            aria-current={p === page ? "page" : undefined}
            aria-label={t("primitives.pager.page", { page: p })}
            onClick={() => onPage?.(p)}
          >
            {p}
          </button>
        ),
      )}
      <Button
        size="small"
        variant="quiet"
        icon="forward"
        aria-label={t("primitives.pager.next")}
        disabled={page >= pages}
        onClick={() => onPage?.(page + 1)}
      />
      <label className="t-row t-meta" style={{ gap: 6 }}>
        {t("primitives.pager.perPage")}
        <select
          className="t-select"
          style={{ width: 72, minHeight: 28, padding: "2px 8px" }}
          value={pageSize}
          onChange={(e) => onPageSize?.(Number(e.target.value))}
        >
          {pageSizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}

/* Toolbar --------------------------------------------------------------- */

export type ViewOption<V extends string> = { value: V; label: string; icon: IconName };

export type Facet = {
  key: string;
  label: string;
  count?: number;
  active?: boolean;
};

export type CollectionToolbarProps<V extends string> = {
  query: string;
  queryLabel: string;
  placeholder?: string;
  facets?: Facet[];
  views?: ViewOption<V>[];
  view?: V;
  sortLabel?: string;
  groupLabel?: string;
  onQuery?: (q: string) => void;
  onFacet?: (key: string) => void;
  onView?: (v: V) => void;
  onSortOpen?: () => void;
  onGroupOpen?: () => void;
  onReset?: () => void;
};

export function CollectionToolbar<V extends string>({
  query,
  queryLabel,
  placeholder,
  facets = [],
  views,
  view,
  sortLabel,
  groupLabel,
  onQuery,
  onFacet,
  onView,
  onSortOpen,
  onGroupOpen,
  onReset,
}: CollectionToolbarProps<V>) {
  const { t } = useText();
  const anyActive = facets.some((f) => f.active) || query.length > 0;
  return (
    <div className="t-toolbar" role="toolbar" aria-label={t("primitives.toolbar.label")}>
      <div className="t-toolbar__search">
        <SearchField
          label={queryLabel}
          value={query}
          placeholder={placeholder}
          onChange={onQuery}
        />
      </div>
      {facets.length ? (
        <div className="t-toolbar__facets">
          {facets.map((f) => (
            <Chip key={f.key} pressed={!!f.active} count={f.count} onClick={() => onFacet?.(f.key)}>
              {f.label}
            </Chip>
          ))}
          {anyActive ? (
            <Button size="small" variant="quiet" icon="close" onClick={onReset}>
              {t("primitives.toolbar.reset")}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="t-toolbar__end">
        {sortLabel ? (
          <Button size="small" variant="quiet" icon="sort" onClick={onSortOpen}>
            {sortLabel}
          </Button>
        ) : null}
        {groupLabel ? (
          <Button size="small" variant="quiet" icon="layers" onClick={onGroupOpen}>
            {groupLabel}
          </Button>
        ) : null}
        {views && view ? (
          <Segment
            label={t("primitives.toolbar.view")}
            value={view}
            options={views.map((v) => ({
              value: v.value,
              label: <span className="t-hide-mobile">{v.label}</span>,
              icon: v.icon,
            }))}
            onChange={onView}
          />
        ) : null}
      </div>
    </div>
  );
}

/* Collection frame ------------------------------------------------------- */

export type CollectionState = "ready" | "loading" | "empty" | "filtered-empty" | "error";

export type CollectionProps = {
  state: CollectionState;
  toolbar?: ReactNode;
  distribution?: ReactNode;
  children?: ReactNode;
  pagination?: ReactNode;
  empty?: { title: ReactNode; body?: ReactNode; icon?: IconName; action?: ReactNode };
  filteredEmpty?: { query?: string; onReset?: () => void; suggestions?: ReactNode };
  error?: { title: ReactNode; reason?: ReactNode; onRetry?: () => void };
  /** Number of skeleton rows while loading. */
  skeletonRows?: number;
};

/**
 * The frame every list in Atlas stands in: toolbar, optional distribution
 * band, body, pagination — and one defined form for each state.
 */
export function Collection({
  state,
  toolbar,
  distribution,
  children,
  pagination,
  empty,
  filteredEmpty,
  error,
  skeletonRows = 8,
}: CollectionProps) {
  const { t } = useText();
  return (
    <div className="t-collection" data-state={state} aria-busy={state === "loading" || undefined}>
      {toolbar}
      {distribution}
      {state === "loading" ? <LoadingState rows={skeletonRows} /> : null}
      {state === "empty" && empty ? (
        <EmptyState title={empty.title} body={empty.body} icon={empty.icon} action={empty.action} />
      ) : null}
      {state === "filtered-empty" ? (
        <EmptyState
          icon="search"
          title={
            filteredEmpty?.query
              ? t("primitives.collection.noMatchesFor", { query: filteredEmpty.query })
              : t("primitives.collection.noMatches")
          }
          body={t("primitives.collection.noMatchesHint")}
          action={
            <>
              <Button icon="close" onClick={filteredEmpty?.onReset}>
                {t("primitives.collection.resetFilters")}
              </Button>
              {filteredEmpty?.suggestions}
            </>
          }
        />
      ) : null}
      {state === "error" && error ? (
        <EmptyState
          tone="error"
          title={error.title}
          body={error.reason}
          action={
            error.onRetry ? (
              <Button icon="refresh" onClick={error.onRetry}>
                {t("primitives.state.retry")}
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {state === "ready" ? children : null}
      {state === "ready" ? pagination : null}
    </div>
  );
}

export function SortHint({ label, dir }: { label: string; dir: SortDir }) {
  return (
    <span className="t-row t-meta" style={{ gap: 4 }}>
      <Icon name="sort" size={12} />
      {label} {dir === "asc" ? "▲" : "▼"}
    </span>
  );
}
