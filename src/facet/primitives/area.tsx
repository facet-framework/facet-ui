import {
  Fragment,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { reducedMotion } from "../shell/motion";
import { tabId } from "./controls";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** One tab of an area bar. */
export type AreaTab<V extends string = string> = {
  value: V;
  label: ReactNode;
  /** Link target with `kind="pages"`. */
  href?: string;
  /** A count after the label. */
  count?: ReactNode;
  /** A separator stands before the first tab of a new group. */
  group?: string;
};

export type AreaBarProps<V extends string = string> = {
  /** The area's title; also the accessible name of the tab bar. */
  title: ReactNode;
  /** One line beside the title: a state, a count, a time. Announced politely when it changes. */
  meta?: ReactNode;
  /**
   * `pages` (the default): links between pages, the current one with `aria-current="page"`.
   * `tabs`: an in-page tablist with one tab stop and arrow keys; pair it with `TabPanel`.
   */
  kind?: "pages" | "tabs";
  /** The active tab; the only truth. A press only reports `onChange`. */
  value: V;
  tabs: AreaTab<V>[];
  onChange?: (value: V) => void;
  /** The area's one primary action, e.g. a `Button`. */
  action?: ReactNode;
  /** Only the tab bar; the title stays as its accessible name, visually hidden. */
  compact?: boolean;
  /** Id of the panel below, for `aria-controls` with `kind="tabs"`. */
  panelId?: string;
  /** Prefix of the tab ids (`tabId(idPrefix, value)`); generated when absent. */
  idPrefix?: string;
  /**
   * Key of the area: the indicator glides in from the tab last visited under the same key, so
   * a page change between tabs still reads as one motion.
   */
  area?: string;
};

/** Where the indicator stands: offset and width of the active tab, and whether it glides. */
type Indicator = { x: number; width: number; glide: boolean };

const storageKey = (area: string) => `t-area-${area}`;
/** Session storage may be blocked (private window, sandbox); the indicator then does not glide in. */
function readLast(area: string): string | null {
  try {
    return window.sessionStorage.getItem(storageKey(area));
  } catch {
    return null;
  }
}
function remember(area: string, value: string): void {
  try {
    window.sessionStorage.setItem(storageKey(area), value);
  } catch {
    // Storage blocked: no glide on the next page, no harm.
  }
}

/**
 * The head of an area with tabs: title, one meta line, one action, and the tab bar below at a
 * fixed height, so the bar stands at the same place on every tab. Only the indicator moves: it
 * glides to the active tab (transform only); a long bar scrolls the active tab into view and
 * fades the edge that hides tabs. Nothing waits for a running transition and nothing turns
 * pointer events off; every press starts the next change at once.
 */
export function AreaBar<V extends string = string>({
  title,
  meta,
  kind = "pages",
  value,
  tabs,
  onChange,
  action,
  compact,
  panelId,
  idPrefix,
  area,
}: AreaBarProps<V>) {
  const generated = useId();
  const prefix = idPrefix ?? generated;
  const titleId = `${prefix}-title`;
  const inPage = kind === "tabs";
  const barRef = useRef<HTMLDivElement & HTMLElement>(null);
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const measured = useRef(false);

  const measureEdges = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return;
    const start = bar.scrollLeft > 2;
    const end = bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 2;
    setEdges((old) => (old.start === start && old.end === end ? old : { start, end }));
  }, []);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const target = document.getElementById(tabId(prefix, value));
    if (!bar || !target) return undefined;
    const reduced = reducedMotion();
    const to = {
      x: target.offsetLeft,
      width: target.offsetWidth,
      glide: measured.current && !reduced,
    };
    let frame = 0;
    const last = !measured.current && area ? readLast(area) : null;
    const from =
      last && last !== value && !reduced ? document.getElementById(tabId(prefix, last)) : null;
    if (from) {
      setIndicator({ x: from.offsetLeft, width: from.offsetWidth, glide: false });
      frame = window.requestAnimationFrame(() => setIndicator({ ...to, glide: true }));
    } else {
      setIndicator(to);
    }
    if (area) remember(area, value);
    // The active tab scrolls into view: at once on mount, smoothly afterwards.
    const margin = 32;
    const left = target.offsetLeft;
    const right = left + target.offsetWidth;
    let x: number | null = null;
    if (left - margin < bar.scrollLeft) x = Math.max(0, left - margin);
    else if (right + margin > bar.scrollLeft + bar.clientWidth)
      x = right + margin - bar.clientWidth;
    if (x !== null && typeof bar.scrollTo === "function") {
      bar.scrollTo({ left: x, behavior: measured.current && !reduced ? "smooth" : "auto" });
    }
    measured.current = true;
    measureEdges();
    return () => window.cancelAnimationFrame(frame);
  }, [value, tabs, prefix, area, measureEdges]);

  const select = (next: V, e: MouseEvent<HTMLElement>) => {
    const tab = tabs.find((t) => t.value === next);
    if (inPage || !tab?.href) e.preventDefault();
    if (next !== value) onChange?.(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const n = tabs.length;
    const at = tabs.findIndex((t) => t.value === value);
    const to =
      e.key === "ArrowRight"
        ? (at + 1) % n
        : e.key === "ArrowLeft"
          ? (at - 1 + n) % n
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : -1;
    if (to < 0 || !n) return;
    e.preventDefault();
    const next = tabs[to].value;
    if (next !== value) onChange?.(next);
    document.getElementById(tabId(prefix, next))?.focus();
  };

  const indicatorStyle = {
    "--t-indicator-x": `${indicator?.x ?? 0}px`,
    "--t-indicator-w": `${indicator?.width ?? 0}`,
    "--t-indicator-o": indicator ? 1 : 0,
  } as CSSProperties;

  const items = tabs.map((tab, i) => {
    const current = tab.value === value;
    const separator = i > 0 && !!tab.group && tab.group !== tabs[i - 1].group;
    const count =
      tab.count != null && tab.count !== "" ? (
        // The space keeps label and count apart for assistive technology.
        <>
          {" "}
          <span className="t-area-bar__count">{tab.count}</span>
        </>
      ) : null;
    const common = {
      id: tabId(prefix, tab.value),
      className: "t-area-bar__tab",
      "data-tab": tab.value,
      onClick: (e: MouseEvent<HTMLElement>) => select(tab.value, e),
    };
    return (
      <Fragment key={tab.value}>
        {separator ? (
          <span className="t-area-bar__separator" aria-hidden="true" data-testid="area-separator" />
        ) : null}
        {inPage ? (
          <button
            {...common}
            type="button"
            role="tab"
            aria-selected={current}
            aria-controls={panelId}
            tabIndex={current ? 0 : -1}
            onKeyDown={onKeyDown}
          >
            {tab.label}
            {count}
          </button>
        ) : (
          <a {...common} href={tab.href ?? "#"} aria-current={current ? "page" : undefined}>
            {tab.label}
            {count}
          </a>
        )}
      </Fragment>
    );
  });

  // The indicator comes first, so the tabs paint above it and receive every pointer event.
  const bar = (
    <>
      <span
        className="t-area-bar__indicator"
        data-testid="area-indicator"
        aria-hidden="true"
        data-glide={indicator?.glide ? "true" : "false"}
        style={indicatorStyle}
      />
      {items}
    </>
  );
  const barProps = {
    ref: barRef,
    className: "t-area-bar__tabs",
    "aria-labelledby": titleId,
    "data-edge-start": edges.start ? "true" : "false",
    "data-edge-end": edges.end ? "true" : "false",
    onScroll: measureEdges,
  };

  return (
    <div className={cx("t-area-bar", compact && "t-area-bar--compact")}>
      {compact ? (
        <span id={titleId} className="t-sr-only">
          {title}
        </span>
      ) : (
        <div className="t-area-bar__head">
          <h1 id={titleId} className="t-area-bar__title">
            {title}
          </h1>
          {meta != null ? (
            <span className="t-meta t-area-bar__meta" role="status">
              {meta}
            </span>
          ) : null}
          <span className="t-spacer" />
          {action}
        </div>
      )}
      {inPage ? (
        <div {...barProps} role="tablist">
          {bar}
        </div>
      ) : (
        <nav {...barProps}>{bar}</nav>
      )}
    </div>
  );
}

export type TabPanelProps = {
  /** Element id; the bar's or tabs' `panelId` points here. */
  id?: string;
  /** The active tab. A new value mounts fresh content and restarts the entry transition. */
  tabKey: string;
  /** With in-page tabs: the id of the active tab (`tabId(idPrefix, value)`). */
  labelledBy?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * The content below tabs. The one tab transition lives here: opacity and a 6 px rise. Every
 * change of `tabKey` mounts a fresh element, so a second press during a running change is
 * never queued and never swallowed.
 */
export function TabPanel({ id, tabKey, labelledBy, children, className }: TabPanelProps) {
  return (
    <div
      key={tabKey}
      id={id}
      className={cx("t-tab-panel", className)}
      role={labelledBy ? "tabpanel" : undefined}
      aria-labelledby={labelledBy}
      data-tab={tabKey}
    >
      {children}
    </div>
  );
}
