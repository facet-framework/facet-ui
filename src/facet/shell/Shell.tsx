import { useRef, type ReactNode } from "react";
import { useHeightVar } from "./bars";
import { TooltipLayer } from "../primitives/tooltip";
import { IconButton, Kbd } from "../primitives/controls";
import { Icon } from "../primitives/Icon";
import { useText } from "../i18n/TextProvider";
export type AppShellProps = {
  top: ReactNode;
  nav?: ReactNode;
  tabbar?: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
  chat?: ReactNode;
  /** Without a theme the shell inherits the palette of its ancestor. */
  theme?: { theme: "facet" | "paper"; mode: "dark" | "light" };
  /** Mobile layout: no nav bar, a tab bar at the bottom. */
  mobile?: boolean;
  /** Focus mode: a wide page in larger type; what has neither pointer nor focus blurs. */
  focus?: boolean;
  /** Spacing of the whole shell: the `--t-s-*` steps shrink or grow; absent is normal. */
  density?: "compact" | "normal" | "spacious";
  /** Reduced: nothing in the shell animates or transitions. */
  reducedMotion?: boolean;
  /**
   * A modal overlay is open (the palette): the bars, the page, the tab bar and
   * the chat are inert — neither focusable nor read — until it closes.
   */
  modal?: boolean;
};

export function AppShell({
  top,
  nav,
  tabbar,
  children,
  overlay,
  chat,
  theme,
  mobile,
  focus,
  density,
  reducedMotion,
  modal,
}: AppShellProps) {
  // The head's real height, for everything that sticks or lands below it.
  const shell = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  useHeightVar("--t-bars-h", head, shell, mobile);
  return (
    <div
      ref={shell}
      className="t-app t-shell"
      data-testid="app-shell"
      data-t-theme={theme?.theme}
      data-t-mode={theme?.mode}
      data-layout={mobile ? "mobile" : "desktop"}
      data-focus={focus ? "on" : undefined}
      data-density={density && density !== "normal" ? density : undefined}
      data-motion={reducedMotion ? "reduced" : undefined}
    >
      <div className="t-shell__head" ref={head} data-testid="shell-head" inert={modal}>
        {top}
        {!mobile && nav ? <div className="t-shell__nav">{nav}</div> : null}
      </div>
      <main className="t-shell__main t-dotted" inert={modal}>
        {children}
      </main>
      {/* Contents-only wrappers: they carry inertness without a box of their own. */}
      <div className="t-shell__part" data-testid="shell-chrome" inert={modal}>
        {mobile ? tabbar : null}
        {chat}
      </div>
      {overlay}
      {/* Every `title` inside the shell, an IconButton's label included, gets a tooltip the keyboard reaches. */}
      <TooltipLayer />
    </div>
  );
}

/** A figure in the app bar. `null` is not measured: a dash, never zero. */
export type AppBarStat = {
  key: string;
  label: ReactNode;
  value: number | null;
  /** Shown instead of the formatted number, e.g. "82 %". */
  display?: ReactNode;
  tone?: "ok" | "warn" | "plan" | "bad";
};

export type AppBarProps = {
  /** Controls before the brand, e.g. `HistoryNav`. */
  lead?: ReactNode;
  /** The product mark and name at the start. */
  brand?: ReactNode;
  /** Makes the brand a button that leads home; `homeLabel` is its accessible name. */
  onHome?: () => void;
  homeLabel?: string;
  /** The current page or document. */
  title?: ReactNode;
  /** A quiet line beside the title: a state, a count, a timestamp. */
  meta?: ReactNode;
  /** Key figures after the brand; hidden on narrow screens and in the compact bar. */
  stats?: AppBarStat[];
  /** Controls in the middle, e.g. tabs. */
  children?: ReactNode;
  /**
   * A command field that opens the app's palette or search. `keys` are the
   * keyboard shortcut, shown as key caps; the compact bar shows a search button.
   */
  command?: { label: string; onOpen: () => void; keys?: string[] };
  /** Actions at the end. The compact bar leaves them to `MoreSheet`. */
  actions?: ReactNode;
  /** The phone form: lead, brand, the search button and the menu button. */
  compact?: boolean;
  /** Opens the app's menu, e.g. `MoreSheet`; drawn in the compact bar. */
  onMenu?: () => void;
};

/**
 * The bar at the top of `AppShell`: lead controls, brand, title, key figures,
 * a centre, a command field and actions. A product's own mark goes into
 * `brand`; the bar draws no logo of its own.
 */
export function AppBar({
  lead,
  brand,
  onHome,
  homeLabel,
  title,
  meta,
  stats,
  children,
  command,
  actions,
  compact,
  onMenu,
}: AppBarProps) {
  const { t, number } = useText();
  return (
    <header className="t-appbar" data-compact={compact || undefined}>
      {lead ? <div className="t-appbar__lead">{lead}</div> : null}
      {brand ? (
        onHome ? (
          <button
            type="button"
            className="t-appbar__brand t-appbar__brand--home"
            aria-label={homeLabel}
            onClick={onHome}
          >
            {brand}
          </button>
        ) : (
          <div className="t-appbar__brand">{brand}</div>
        )
      ) : null}
      {title ? (
        <div className="t-appbar__title">
          <span className="t-appbar__name">{title}</span>
          {meta && !compact ? <span className="t-meta">{meta}</span> : null}
        </div>
      ) : null}
      {stats?.length && !compact ? (
        <dl className="t-appbar__stats">
          {stats.map((s) => (
            <div key={s.key}>
              <dt>{s.label}</dt>
              <dd className={s.value != null && s.tone ? `t-num t-${s.tone}` : "t-num"}>
                {s.value == null ? (
                  <>
                    <span aria-hidden="true">—</span>
                    <span className="t-sr">{t("primitives.meter.unmeasured")}</span>
                  </>
                ) : (
                  (s.display ?? number(s.value))
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="t-appbar__centre">{compact ? null : children}</div>
      {command ? (
        compact ? (
          <IconButton icon="search" label={command.label} onClick={command.onOpen} />
        ) : (
          <button type="button" className="t-appbar__command" onClick={command.onOpen}>
            <Icon name="search" size={16} />
            <span className="t-appbar__command-label">{command.label}</span>
            {command.keys?.length ? (
              <span className="t-appbar__keys" aria-hidden="true">
                {command.keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
            ) : null}
          </button>
        )
      ) : null}
      {actions && !compact ? <div className="t-appbar__actions">{actions}</div> : null}
      {compact && onMenu ? (
        <IconButton icon="menu" label={t("primitives.appbar.menu")} onClick={onMenu} />
      ) : null}
    </header>
  );
}
