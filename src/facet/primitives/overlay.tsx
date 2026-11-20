import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useText } from "../i18n/TextProvider";
import { Icon, type IconName } from "./Icon";
import { IconButton } from "./controls";

/**
 * Overlays are pure: whether they are open is a prop, and closing is a callback.
 * Focus handling and outside clicks belong to the logic layer of the app; the
 * breadcrumb's sibling list is the exception, since every page that shows one
 * needs the same search, Esc and outside press, and it still only calls back.
 *
 * A menu's keyboard is the other exception (WAI-ARIA menu button): the arrows
 * walk its items and wrap, Home and End reach the ends, and when it closes with
 * the focus inside, the focus goes back to the control that opened it instead of
 * falling to the page. Whether it is open still stays with the app.
 */

/** Which item takes the focus when a menu opens from the keyboard. */
export type MenuFocus = "first" | "last";

/**
 * Hands the opening focus to a menu that a component draws from a slot (the
 * role menu in the top bar), where the trigger cannot pass a prop.
 */
export const MenuFocusContext = createContext<MenuFocus | undefined>(undefined);

const MENU_ITEM = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

function menuItems(menu: Element | null): HTMLElement[] {
  if (!menu) return [];
  return Array.from(menu.querySelectorAll<HTMLElement>(MENU_ITEM)).filter(
    (el) => !(el as HTMLButtonElement).disabled,
  );
}

function focusItem(menu: Element | null, at: MenuFocus) {
  const items = menuItems(menu);
  items[at === "first" ? 0 : items.length - 1]?.focus();
}

/**
 * The keyboard of an open menu. Focuses the first or last item when it was
 * opened from the keyboard, and gives the focus back to the opener when it
 * closes with the focus inside it. A layout effect, so the cleanup still sees
 * the focused item before React removes the menu from the document.
 */
// @facet: interface/overlays/menu-navigation
// @facet-role: primary
export function useMenuKeyboard(ref: RefObject<HTMLElement | null>, openFocus?: MenuFocus) {
  const fromContext = useContext(MenuFocusContext);
  const initial = useRef(openFocus ?? fromContext);
  useLayoutEffect(() => {
    const menu = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    if (initial.current) focusItem(menu, initial.current);
    return () => {
      if (!menu || !opener || opener === document.body) return;
      if (menu.contains(document.activeElement) && !menu.contains(opener)) opener.focus();
    };
  }, [ref]);
  return (e: ReactKeyboardEvent<HTMLElement>) => {
    const items = menuItems(ref.current);
    if (!items.length) return;
    const at = items.indexOf(e.target as HTMLElement);
    let next: number | null = null;
    if (e.key === "ArrowDown") next = at < 0 ? 0 : (at + 1) % items.length;
    else if (at < 0)
      return; // a field in the menu's header keeps its other keys
    else if (e.key === "ArrowUp") next = (at - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next == null) return;
    e.preventDefault();
    items[next].focus();
  };
}

/**
 * The control that opens a menu: Enter, Space and the arrows open it from the
 * keyboard with the focus on an item (Down and Enter the first, Up the last); a
 * pointer opens it without moving the focus. `focus` goes to the menu's
 * `openFocus` (or through `MenuFocusContext`). An arrow on the control of an
 * open menu moves into it; the menu stands beside the control in one wrapper.
 */
// @facet: interface/overlays/menu-navigation
// @facet-role: primary
export function useMenuTrigger(open: boolean, onToggle?: () => void) {
  const [focus, setFocus] = useState<MenuFocus | undefined>(undefined);
  return {
    focus,
    onClick: (e: ReactMouseEvent<HTMLElement>) => {
      // A click from Enter or Space carries no pointer press (detail 0).
      setFocus(e.detail === 0 ? "first" : undefined);
      onToggle?.();
    },
    onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const at: MenuFocus = e.key === "ArrowDown" ? "first" : "last";
      if (open) {
        focusItem(e.currentTarget.parentElement?.querySelector('[role="menu"]') ?? null, at);
        return;
      }
      setFocus(at);
      onToggle?.();
    },
  };
}

export type MenuItem = {
  key: string;
  label: ReactNode;
  sub?: ReactNode;
  icon?: IconName;
  meta?: ReactNode;
  current?: boolean;
  active?: boolean;
  onSelect?: () => void;
};

export function Menu({
  label,
  groups,
  style,
  className,
  header,
  footer,
  openFocus,
}: {
  label: string;
  groups: { label?: string; items: MenuItem[] }[];
  style?: CSSProperties;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  /** The item that takes the focus when the menu opens from the keyboard. */
  openFocus?: MenuFocus;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = useMenuKeyboard(ref, openFocus);
  return (
    <div
      ref={ref}
      className={`t-popover t-float ${className ?? ""}`}
      role="menu"
      aria-label={label}
      style={style}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {header}
      {groups.map((g, gi) => (
        <div key={gi} role="group" aria-label={g.label}>
          {g.label ? <div className="t-menu-label">{g.label}</div> : null}
          {g.items.map((it) => (
            <button
              key={it.key}
              type="button"
              role="menuitem"
              className="t-menu-item"
              aria-current={it.current || undefined}
              data-active={it.active || undefined}
              onClick={it.onSelect}
            >
              {it.icon ? <Icon name={it.icon} size={16} /> : null}
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <span className="t-wrap">{it.label}</span>
                {it.sub ? <span className="t-meta t-wrap">{it.sub}</span> : null}
              </span>
              {it.meta ? <span className="t-meta">{it.meta}</span> : null}
            </button>
          ))}
        </div>
      ))}
      {footer}
    </div>
  );
}

export type SheetProps = {
  open: boolean;
  side?: "right" | "bottom" | "full";
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  /** Without a scrim the page behind stays usable (the chat dock). */
  modal?: boolean;
  width?: number;
};

// @facet: interface/overlays/dialogs-and-sheets
// @facet-role: primary
export function Sheet({
  open,
  side = "right",
  title,
  meta,
  actions,
  footer,
  children,
  onClose,
  modal = true,
  width,
}: SheetProps) {
  const { t } = useText();
  if (!open) return null;
  return (
    <>
      {modal ? <div className="t-scrim" aria-hidden="true" onClick={onClose} /> : null}
      <section
        className={`t-sheet t-sheet--${side}`}
        role={modal ? "dialog" : "complementary"}
        aria-modal={modal || undefined}
        aria-label={typeof title === "string" ? title : undefined}
        style={width && side === "right" ? { width } : undefined}
      >
        {side === "bottom" ? <div className="t-sheet__grip" aria-hidden="true" /> : null}
        <header className="t-sheet__head">
          <div className="t-stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
            <span className="t-h3 t-wrap">{title}</span>
            {meta ? <span className="t-meta t-wrap">{meta}</span> : null}
          </div>
          {actions}
          {onClose ? (
            <IconButton icon="close" label={t("primitives.overlay.close")} onClick={onClose} />
          ) : null}
        </header>
        <div className="t-sheet__body">{children}</div>
        {footer ? <footer className="t-sheet__foot">{footer}</footer> : null}
      </section>
    </>
  );
}

// @facet: interface/overlays/dialogs-and-sheets
// @facet-role: primary
export function Dialog({
  open,
  title,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
}) {
  const { t } = useText();
  if (!open) return null;
  return (
    <>
      <div className="t-scrim" aria-hidden="true" onClick={onClose} />
      <section
        className="t-dialog t-float"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
      >
        <header className="t-sheet__head">
          <span className="t-h3" style={{ flex: 1 }}>
            {title}
          </span>
          {onClose ? (
            <IconButton icon="close" label={t("primitives.overlay.close")} onClick={onClose} />
          ) : null}
        </header>
        <div className="t-sheet__body">{children}</div>
        {footer ? <footer className="t-sheet__foot">{footer}</footer> : null}
      </section>
    </>
  );
}

// @facet: interface/feedback/toasts
// @facet-role: primary
export function Toast({
  tone = "neutral",
  children,
  action,
}: {
  tone?: "neutral" | "ok" | "bad";
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="t-toast" role="status">
      <Icon
        name={tone === "ok" ? "check" : tone === "bad" ? "error" : "info"}
        size={16}
        className={tone === "neutral" ? undefined : `t-${tone}`}
      />
      <span>{children}</span>
      {action}
    </div>
  );
}

export function Tooltip({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span className="t-tooltip" role="tooltip" style={style}>
      {children}
    </span>
  );
}

/* Breadcrumbs ------------------------------------------------------------ */

export type Crumb = {
  key: string;
  label: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Siblings reachable from this segment's caret. */
  siblings?: MenuItem[];
  mono?: boolean;
};

/** The words a sibling is found by: its key, and its label where that is text. */
function siblingText(it: MenuItem): string {
  return typeof it.label === "string" ? `${it.key} ${it.label}` : it.key;
}

/** The siblings whose text holds every word of `query`, in their order. */
export function filterSiblings(items: MenuItem[], query: string): MenuItem[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((it) => {
    const text = siblingText(it).toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

/**
 * Every segment is a place. The last one is the current page and not a link;
 * a segment without `href` or `onClick` is plain text, never a dead button.
 * A segment with siblings carries a caret that opens them (`openKey`).
 *
 * The open list has a search field: typing filters the siblings, Enter opens
 * the first hit, ArrowDown moves to the list. Esc or a press outside the list
 * calls `onClose`; the caret then holds the focus again after Esc. The query
 * is the container's (`query`, `onQuery`) when it passes one, so a list it
 * restores comes back as it was; otherwise the list keeps its own.
 *
 */
// @facet: interface/overlays/breadcrumbs
// @facet-role: primary
export function Breadcrumbs({
  crumbs,
  openKey,
  onToggleSiblings,
  query,
  onQuery,
  onClose,
}: {
  crumbs: Crumb[];
  openKey?: string | null;
  onToggleSiblings?: (key: string) => void;
  query?: string;
  onQuery?: (query: string) => void;
  onClose?: () => void;
}) {
  const { t } = useText();
  // A list the container does not hold keeps its own search, which starts
  // empty each time a list opens: it belongs to the key it was typed under.
  const [own, setOwn] = useState<{ key: string | null | undefined; query: string }>({
    key: null,
    query: "",
  });
  const openRef = useRef<HTMLSpanElement>(null);
  const q = query ?? (own.key === openKey ? own.query : "");
  const setQuery = onQuery ?? ((next: string) => setOwn({ key: openKey, query: next }));
  const open = openKey != null && crumbs.some((c) => c.key === openKey && c.siblings?.length);
  // The list opens to be searched: its field takes the focus.
  useEffect(() => {
    if (open) openRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [open, openKey]);
  // A press anywhere outside the open list closes it; Esc closes it and hands
  // the focus back to its caret.
  useEffect(() => {
    if (!open || !onClose) return;
    const onDown = (e: PointerEvent) => {
      const box = openRef.current;
      if (box && e.target instanceof Node && !box.contains(e.target)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const caret = openRef.current?.querySelector<HTMLElement>(".t-crumbs__caret");
      onClose();
      caret?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <nav className="t-crumbs" aria-label={t("primitives.crumbs.label")}>
      <ol>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          const isOpen = openKey === c.key;
          const hits = isOpen && c.siblings ? filterSiblings(c.siblings, q) : [];
          return (
            <li key={c.key}>
              {last ? (
                <span aria-current="page" className={c.mono ? "t-mono" : undefined}>
                  {c.label}
                </span>
              ) : c.href ? (
                <a href={c.href} className={c.mono ? "t-mono" : undefined}>
                  {c.label}
                </a>
              ) : c.onClick ? (
                <button type="button" onClick={c.onClick} className={c.mono ? "t-mono" : undefined}>
                  {c.label}
                </button>
              ) : (
                // A segment that leads nowhere is not offered as a button.
                <span className={c.mono ? "t-mono t-crumbs__text" : "t-crumbs__text"}>
                  {c.label}
                </span>
              )}
              {c.siblings && c.siblings.length ? (
                <span ref={isOpen ? openRef : undefined} className="t-crumbs__anchor">
                  <button
                    type="button"
                    className="t-crumbs__caret"
                    aria-label={t("primitives.crumbs.showSiblings")}
                    aria-expanded={isOpen}
                    data-testid={`crumb-caret-${c.key}`}
                    onClick={() => onToggleSiblings?.(c.key)}
                  >
                    <Icon name="chevronDown" size={12} />
                  </button>
                  {isOpen ? (
                    <Menu
                      label={t("primitives.crumbs.siblings")}
                      className="t-crumbs__menu"
                      groups={[{ items: hits }]}
                      style={{ top: 26, left: -12 }}
                      header={
                        <div className="t-crumbs__find">
                          <label className="t-search">
                            <Icon name="search" size={14} />
                            <input
                              type="search"
                              aria-label={t("primitives.crumbs.filter")}
                              placeholder={t("primitives.crumbs.filter")}
                              value={q}
                              onChange={(e) => setQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  hits[0]?.onSelect?.();
                                } else if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  openRef.current
                                    ?.querySelector<HTMLElement>('[role="menuitem"]')
                                    ?.focus();
                                }
                              }}
                            />
                          </label>
                        </div>
                      }
                      footer={
                        hits.length ? null : (
                          <div className="t-menu-label" role="status">
                            {t("primitives.crumbs.noMatch")}
                          </div>
                        )
                      }
                    />
                  ) : null}
                </span>
              ) : null}
              {!last ? (
                <span className="t-crumbs__sep" aria-hidden="true">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
