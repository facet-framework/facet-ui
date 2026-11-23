import type { ReactNode } from "react";
import { useText } from "../i18n/TextProvider";
import { Button, IconButton, SearchField } from "../primitives/controls";
import { Icon, type IconName } from "../primitives/Icon";
import {
  Menu,
  MenuFocusContext,
  Sheet,
  useMenuTrigger,
  type MenuItem,
} from "../primitives/overlay";

/**
 * The application chrome around `AppShell`: the history controls and menu,
 * the navigation bar, the phone tab bar and the sheet for everything the tab
 * bar has no room for. Product marks, palettes and settings are the app's own
 * and come in through slots.
 */

/* History ------------------------------------------------------------------ */

export type HistoryEntry = {
  key: string;
  label: string;
  /** What kind of place it is, and where, in one quiet line. */
  sub?: string;
  icon?: IconName;
  /** When it was visited, already formatted. */
  time?: string;
  /** The place the reader is on now. */
  current?: boolean;
};

export type HistoryMenuProps = {
  /** Newest first. */
  entries: HistoryEntry[];
  /** A quiet note beside the heading, e.g. how long the history is kept. */
  scope?: ReactNode;
  filter?: string;
  onFilter?: (query: string) => void;
  onPick?: (key: string) => void;
  onClear?: () => void;
  /** How many entries are listed; the rest are counted below the list. */
  limit?: number;
  /** From this many entries on a filter field heads the list. */
  filterFrom?: number;
};

/** The places of a session, newest first, the current one marked. */
export function HistoryMenu({
  entries,
  scope,
  filter = "",
  onFilter,
  onPick,
  onClear,
  limit = 14,
  filterFrom = 20,
}: HistoryMenuProps) {
  const { t, plural } = useText();
  const q = filter.trim().toLowerCase();
  const shown = q
    ? entries.filter((e) => `${e.label} ${e.sub ?? ""}`.toLowerCase().includes(q))
    : entries;
  const items: MenuItem[] = shown.slice(0, limit).map((e) => ({
    key: e.key,
    label: e.label,
    sub: e.sub,
    icon: e.icon,
    meta: e.time,
    current: e.current,
    onSelect: () => onPick?.(e.key),
  }));
  return (
    <Menu
      label={t("primitives.history.label")}
      className="t-history"
      header={
        <div className="t-history__head">
          <div className="t-row t-row--between">
            <span className="t-label">
              {t("primitives.history.heading", { count: entries.length })}
            </span>
            {scope ? <span className="t-meta">{scope}</span> : null}
          </div>
          {entries.length >= filterFrom ? (
            <SearchField
              label={t("primitives.history.filter")}
              value={filter}
              placeholder={t("primitives.history.filter")}
              onChange={onFilter}
            />
          ) : null}
        </div>
      }
      groups={[{ items }]}
      footer={
        <div className="t-history__foot">
          <span className="t-meta">
            {shown.length > limit ? plural("primitives.history.older", shown.length - limit) : null}
          </span>
          {onClear ? (
            <Button size="small" variant="quiet" icon="trash" onClick={onClear}>
              {t("primitives.history.clear")}
            </Button>
          ) : null}
        </div>
      }
    />
  );
}

export type HistoryNavProps = {
  canBack: boolean;
  canForward: boolean;
  onBack?: () => void;
  onForward?: () => void;
  /** With it, a history button opens this menu; a right click on Back opens it too. */
  history?: { open: boolean; onToggle: () => void; menu: ReactNode };
  /** The phone form: only Back, without a frame. */
  compact?: boolean;
};

/**
 * Back, forward and the history menu as one group, for `AppBar`'s `lead`.
 * A disabled button says why in its name, so the keyboard reaches a reason.
 */
export function HistoryNav({
  canBack,
  canForward,
  onBack,
  onForward,
  history,
  compact,
}: HistoryNavProps) {
  const { t } = useText();
  const keys = useMenuTrigger(!!history?.open, history?.onToggle);
  return (
    <div className="t-historynav" data-compact={compact || undefined}>
      <IconButton
        icon="back"
        label={canBack ? t("primitives.history.back") : t("primitives.history.backNone")}
        size="small"
        disabled={!canBack}
        onClick={onBack}
        onContextMenu={
          history
            ? (e) => {
                e.preventDefault();
                history.onToggle();
              }
            : undefined
        }
      />
      {!compact ? (
        <IconButton
          icon="forward"
          label={canForward ? t("primitives.history.forward") : t("primitives.history.forwardNone")}
          size="small"
          disabled={!canForward}
          onClick={onForward}
        />
      ) : null}
      {history && !compact ? (
        <IconButton
          icon="history"
          label={t("primitives.history.label")}
          size="small"
          pressed={history.open}
          aria-haspopup="menu"
          aria-expanded={history.open}
          onClick={keys.onClick}
          onKeyDown={keys.onKeyDown}
        />
      ) : null}
      {history?.open ? (
        <MenuFocusContext.Provider value={keys.focus}>{history.menu}</MenuFocusContext.Provider>
      ) : null}
    </div>
  );
}

/* Navigation --------------------------------------------------------------- */

export type NavItem = {
  key: string;
  label: string;
  icon?: IconName;
  /** Drawn instead of the icon, e.g. a mark for an area an extension adds. */
  mark?: ReactNode;
  current?: boolean;
  /** A count that waits, e.g. open findings. Zero and absent draw nothing. */
  badge?: number;
  /** Placed after a divider, behind the primary items. */
  secondary?: boolean;
  /** Read after the label by screen readers only, e.g. "extension". */
  note?: string;
};

function NavLead({ item, size }: { item: NavItem; size: number }) {
  if (item.mark) return <span aria-hidden="true">{item.mark}</span>;
  return item.icon ? <Icon name={item.icon} size={size} /> : null;
}

export type NavBarProps = {
  items: NavItem[];
  onPick?: (key: string) => void;
  /** The accessible name of the navigation landmark. */
  label?: string;
};

/** The row of areas under the app bar; the current one is underlined. */
export function NavBar({ items, onPick, label }: NavBarProps) {
  const { t, number } = useText();
  const primary = items.filter((i) => !i.secondary);
  const secondary = items.filter((i) => i.secondary);
  const render = (i: NavItem) => (
    <button
      key={i.key}
      type="button"
      className="t-nav__item"
      aria-current={i.current ? "page" : undefined}
      onClick={() => onPick?.(i.key)}
    >
      <NavLead item={i} size={16} />
      <span>{i.label}</span>
      {i.note ? <span className="t-sr"> · {i.note}</span> : null}
      {i.badge ? <span className="t-nav__badge">{number(i.badge)}</span> : null}
    </button>
  );
  return (
    <nav className="t-nav" aria-label={label ?? t("primitives.nav.label")}>
      {primary.map(render)}
      {secondary.length ? <span className="t-nav__divider" aria-hidden="true" /> : null}
      {secondary.map(render)}
    </nav>
  );
}

export type TabBarItem = {
  key: string;
  label: string;
  icon: IconName;
  current?: boolean;
  /** Something new waits behind this tab: a dot, named for screen readers. */
  badge?: boolean;
};

/** The phone navigation at the bottom of `AppShell` (its `tabbar` slot). */
export function MobileTabBar({
  items,
  onPick,
  label,
}: {
  items: TabBarItem[];
  onPick?: (key: string) => void;
  label?: string;
}) {
  const { t } = useText();
  return (
    <nav className="t-tabbar" aria-label={label ?? t("primitives.nav.label")}>
      {items.map((i) => (
        <button
          key={i.key}
          type="button"
          className="t-tabbar__item"
          aria-current={i.current ? "page" : undefined}
          onClick={() => onPick?.(i.key)}
        >
          <span className="t-tabbar__icon">
            <Icon name={i.icon} size={22} />
            {i.badge ? (
              <span className="t-tabbar__dot" role="img" aria-label={t("primitives.nav.new")} />
            ) : null}
          </span>
          <span>{i.label}</span>
        </button>
      ))}
    </nav>
  );
}

export type MoreSheetProps = {
  open: boolean;
  /** The sheet's title; "More" by default. */
  title?: ReactNode;
  meta?: ReactNode;
  /** The areas the tab bar has no room for, as tiles. */
  items: NavItem[];
  onPick?: (key: string) => void;
  /** One exclusive choice above the tiles, e.g. a role or a workspace. */
  choice?: {
    label: string;
    options: { key: string; label: string }[];
    current?: string;
    onPick?: (key: string) => void;
  };
  /** The actions the desktop app bar carries. */
  actions?: ReactNode;
  /** The sheet's foot, e.g. theme and settings. */
  footer?: ReactNode;
  onClose?: () => void;
};

/** Everything the phone tab bar has no room for, in a sheet from the bottom. */
export function MoreSheet({
  open,
  title,
  meta,
  items,
  onPick,
  choice,
  actions,
  footer,
  onClose,
}: MoreSheetProps) {
  const { t } = useText();
  return (
    <Sheet
      open={open}
      side="bottom"
      title={title ?? t("primitives.nav.more")}
      meta={meta}
      onClose={onClose}
      footer={footer}
    >
      {choice && choice.options.length ? (
        <div className="t-stack t-more__choice">
          <span className="t-label">{choice.label}</span>
          <div className="t-row t-row--wrap" role="radiogroup" aria-label={choice.label}>
            {choice.options.map((o, i) => (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={o.key === choice.current}
                tabIndex={
                  o.key === choice.current ||
                  (i === 0 && !choice.options.some((x) => x.key === choice.current))
                    ? 0
                    : -1
                }
                className="t-chip"
                onClick={() => choice.onPick?.(o.key)}
                onKeyDown={(e) => {
                  const step =
                    e.key === "ArrowRight" || e.key === "ArrowDown"
                      ? 1
                      : e.key === "ArrowLeft" || e.key === "ArrowUp"
                        ? -1
                        : 0;
                  if (!step) return;
                  e.preventDefault();
                  const n = choice.options.length;
                  const to = (i + step + n) % n;
                  choice.onPick?.(choice.options[to].key);
                  const radios =
                    e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]');
                  radios?.[to]?.focus();
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {actions ? <div className="t-row t-row--wrap t-more__actions">{actions}</div> : null}
      <div className="t-more__grid">
        {items.map((i) => (
          <button
            key={i.key}
            type="button"
            className="t-more__tile t-surface"
            aria-current={i.current ? "page" : undefined}
            onClick={() => onPick?.(i.key)}
          >
            <NavLead item={i} size={22} />
            <span>{i.label}</span>
            {i.note ? <span className="t-sr"> · {i.note}</span> : null}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
