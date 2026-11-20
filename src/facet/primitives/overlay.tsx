import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useText } from "../i18n/TextProvider";
import { Icon, type IconName } from "./Icon";
import { IconButton } from "./controls";

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
}: {
  label: string;
  groups: { label?: string; items: MenuItem[] }[];
  style?: CSSProperties;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className={`t-popover t-float ${className ?? ""}`}
      role="menu"
      aria-label={label}
      style={style}
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

  modal?: boolean;
  width?: number;
};

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

export type Crumb = {
  key: string;
  label: ReactNode;
  href?: string;
  onClick?: () => void;

  siblings?: MenuItem[];
  mono?: boolean;
};

function siblingText(it: MenuItem): string {
  return typeof it.label === "string" ? `${it.key} ${it.label}` : it.key;
}

export function filterSiblings(items: MenuItem[], query: string): MenuItem[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((it) => {
    const text = siblingText(it).toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

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

  const [own, setOwn] = useState<{ key: string | null | undefined; query: string }>({
    key: null,
    query: "",
  });
  const openRef = useRef<HTMLSpanElement>(null);
  const q = query ?? (own.key === openKey ? own.query : "");
  const setQuery = onQuery ?? ((next: string) => setOwn({ key: openKey, query: next }));
  const open = openKey != null && crumbs.some((c) => c.key === openKey && c.siblings?.length);

  useEffect(() => {
    if (open) openRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [open, openKey]);

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
