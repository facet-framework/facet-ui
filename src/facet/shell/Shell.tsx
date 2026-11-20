import { useRef, type ReactNode } from "react";
import { useHeightVar } from "./bars";
import { useText, type FacetText } from "../i18n/TextProvider";
import { Icon, type IconName } from "../primitives/Icon";
import { Button, IconButton, Kbd, SearchField } from "../primitives/controls";
import {
  Menu,
  MenuFocusContext,
  Sheet,
  useMenuKeyboard,
  useMenuTrigger,
  type MenuItem,
} from "../primitives/overlay";
import { TooltipLayer } from "../primitives/tooltip";

/* Logo -------------------------------------------------------------------- */

/**
 * The mark's geometry geometry: two equal blocks
 * 44 × 78 in a 100 × 100 field, a gap of 12, the right block offset 22 below
 * the left. Never rounded: rounded corners are on the sheet's "not allowed" list.
 */
export const MARK = { block: 44, height: 78, gap: 12, offset: 22 } as const;

/**
 * The offset the mark shows for a drift share (0–1): level blocks for no
 * drift, the full brand offset when everything drifted, and at least 6 units
 * for any drift at all, so one drifting record still reads as offset. `null`
 * means not measured, which is never drawn as level (that would say zero).
 */
export function driftOffset(share: number | null | undefined): number | null {
  if (share == null || !Number.isFinite(share)) return null;
  if (share <= 0) return 0;
  return Math.max(6, Math.min(MARK.offset, 2 * Math.round((MARK.offset / 2) * share)));
}

export type LogoProps = {
  size?: number;
  /**
   * The drift share (0–1) the offset follows. Left out, the mark is the brand
   * mark; `null` is not measured and draws the resting colourway at the brand
   * offset, so an unmeasured state never reads as "no drift".
   */
  drift?: number | null;
  /** An accessible name; without one the mark is decoration beside a label. */
  label?: string;
  /**
   * The colour of the offset block: the brand signal, or the warning and bad
   * tones for a measured drift that is light or strong.
   */
  tone?: DriftTone;
};

/** How strongly a measured drift reads in the mark's second block. */
export type DriftTone = "signal" | "warn" | "bad";

/** Two offset blocks: the reader's mark. With `drift`, the offset is the measured drift. */
export function Logo({ size = 20, drift, label, tone = "signal" }: LogoProps) {
  const measured = drift === undefined ? MARK.offset : driftOffset(drift);
  const offset = measured ?? MARK.offset;
  const state =
    drift === undefined ? "brand" : measured == null ? "unmeasured" : offset ? "drift" : "level";
  // The pair stays centred in the field whatever the offset.
  const top = (MARK.offset - offset) / 2;
  const resting = state === "unmeasured";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="t-logo-mark"
      data-testid="logo-mark"
      data-state={state}
      data-offset={offset}
      data-tone={resting ? "resting" : tone}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <rect
        x="0"
        y="0"
        width={MARK.block}
        height={MARK.height}
        style={{
          fill: resting ? "var(--t-faint)" : "var(--t-ink)",
          transform: `translateY(${top}px)`,
        }}
      />
      <rect
        x={MARK.block + MARK.gap}
        y="0"
        width={MARK.block}
        height={MARK.height}
        style={{
          fill: resting ? "var(--t-faint)" : `var(--t-${tone})`,
          transform: `translateY(${top + offset}px)`,
        }}
      />
    </svg>
  );
}

/** The accessible name of a drift mark, in the language of `t`. */
export function driftMarkLabel(share: number | null, t: FacetText["t"]) {
  if (share == null) return t("shell.mark.unmeasured");
  if (share <= 0) return t("shell.mark.level");
  return t("shell.mark.drift", { value: t("shell.percent", { value: Math.round(share * 100) }) });
}

/** The mark as a drift indicator: offset by the measured share, named for a screen reader. */
export function DriftMark({ share, size = 40 }: { share: number | null; size?: number }) {
  const { t } = useText();
  return <Logo size={size} drift={share} label={driftMarkLabel(share, t)} />;
}

/* History ------------------------------------------------------------------ */

/** What kind of place a history entry is; the visible name comes from the dictionary. */
export type HistoryKind =
  "overviewPage" | "area" | "record" | "plugin" | "overview" | "content" | "settings";

export type HistoryEntry = {
  key: string;
  time: string;
  label: string;
  kind: HistoryKind;
  sub?: string;
  current?: boolean;
};

const KIND_ICON: Record<HistoryKind, IconName> = {
  overviewPage: "home",
  area: "product",
  record: "records",
  plugin: "diamond",
  overview: "layers",
  content: "contents",
  settings: "settings",
};

export type HistoryMenuProps = {
  entries: HistoryEntry[];
  filter?: string;
  onFilter?: (q: string) => void;
  onPick?: (key: string) => void;
  onClear?: () => void;
};

/** The list behind `‹`: places of this session, newest first, the current one marked. */
export function HistoryMenu({ entries, filter = "", onFilter, onPick, onClear }: HistoryMenuProps) {
  const { t, plural } = useText();
  const q = filter.trim().toLowerCase();
  const shown = q
    ? entries.filter((e) => (e.label + " " + (e.sub ?? "")).toLowerCase().includes(q))
    : entries;
  const items: MenuItem[] = shown.slice(0, 14).map((e) => ({
    key: e.key,
    label: e.label,
    sub: `${t(`shell.history.kind.${e.kind}`)}${e.sub ? " · " + e.sub : ""}`,
    icon: KIND_ICON[e.kind],
    meta: e.time,
    current: e.current,
    onSelect: () => onPick?.(e.key),
  }));
  return (
    <Menu
      label={t("shell.history.label")}
      className="t-history"
      style={{ top: "calc(100% + 8px)", left: 0, width: 380 }}
      header={
        <div className="t-stack" style={{ gap: 8, padding: "8px 8px 4px" }}>
          <div className="t-row t-row--between">
            <span className="t-label">{t("shell.history.heading", { count: entries.length })}</span>
            <span className="t-meta">{t("shell.history.scope")}</span>
          </div>
          {entries.length >= 20 ? (
            <SearchField
              label={t("shell.history.filter")}
              value={filter}
              placeholder={t("shell.history.filter")}
              onChange={onFilter}
            />
          ) : null}
        </div>
      }
      groups={[{ items }]}
      footer={
        <div
          className="t-row t-row--between"
          style={{ padding: "8px 8px 4px", borderTop: "1px solid var(--t-line)", marginTop: 6 }}
        >
          <span className="t-meta">
            {shown.length > 14 ? (
              plural("shell.history.older", shown.length - 14)
            ) : (
              <span>&nbsp;</span>
            )}
          </span>
          <Button size="small" variant="quiet" icon="trash" onClick={onClear}>
            {t("shell.history.clear")}
          </Button>
        </div>
      }
    />
  );
}

/* Top bar ------------------------------------------------------------------ */

/** `null` means not measured; it shows as a dash, never as zero. */
export type TopBarStats = {
  features: number | null;
  provenPct: number | null;
  drift: number | null;
  /**
   * Share of records with drift (0–1); the logo's offset follows it. Left out,
   * the logo stays the brand mark; with `drift: null` it is not measured.
   */
  driftShare?: number | null;
};

export type TopBarProps = {
  canBack: boolean;
  canForward: boolean;
  historyOpen?: boolean;
  history?: HistoryMenuProps;
  stats?: TopBarStats;
  roleName: string;
  roleOpen?: boolean;
  roleMenu?: ReactNode;
  theme: { label: string; icon: IconName };
  onBack?: () => void;
  onForward?: () => void;
  onHistory?: () => void;
  onCommand?: () => void;
  onRole?: () => void;
  onTheme?: () => void;
  onSettings?: () => void;
  /** A settings page the reader has not opened yet: the gear carries a dot. */
  settingsFresh?: boolean;
  onHome?: () => void;
  /** Mobile form: chevron, logo, search icon, menu. */
  compact?: boolean;
  onMenu?: () => void;
  /**
   * Actions the app adds to the bar, e.g. the doors plugins contribute. Drawn
   * before the command field; the compact bar leaves them to the More sheet.
   */
  actions?: ReactNode;
};

export function TopBar({
  canBack,
  canForward,
  historyOpen,
  history,
  stats,
  roleName,
  roleOpen,
  roleMenu,
  theme,
  onBack,
  onForward,
  onHistory,
  onCommand,
  onRole,
  onTheme,
  onSettings,
  settingsFresh,
  onHome,
  compact,
  onMenu,
  actions,
}: TopBarProps) {
  const { t, number } = useText();
  // The logo carries the measured drift; unmeasured is its own state, never level.
  const share = !stats ? undefined : stats.drift == null ? null : stats.driftShare;
  const historyKeys = useMenuTrigger(!!historyOpen && !!history, onHistory);
  const roleKeys = useMenuTrigger(!!roleOpen && !!roleMenu, onRole);
  return (
    <header className="t-top" data-compact={compact || undefined}>
      <div className="t-top__history" style={{ position: "relative" }}>
        <IconButton
          icon="back"
          label={canBack ? t("shell.top.back") : t("shell.top.backNone")}
          size="small"
          disabled={!canBack}
          onClick={onBack}
          onContextMenu={(e) => {
            e.preventDefault();
            onHistory?.();
          }}
        />
        {!compact ? (
          <IconButton
            icon="forward"
            label={canForward ? t("shell.top.forward") : t("shell.top.forwardNone")}
            size="small"
            disabled={!canForward}
            onClick={onForward}
          />
        ) : null}
        {!compact ? (
          <IconButton
            icon="history"
            label={t("shell.history.label")}
            size="small"
            pressed={historyOpen}
            aria-haspopup="menu"
            aria-expanded={historyOpen}
            onClick={historyKeys.onClick}
            onKeyDown={historyKeys.onKeyDown}
          />
        ) : null}
        {historyOpen && history ? (
          <MenuFocusContext.Provider value={historyKeys.focus}>
            <HistoryMenu {...history} />
          </MenuFocusContext.Provider>
        ) : null}
      </div>
      <button
        type="button"
        className="t-top__brand"
        onClick={onHome}
        aria-label={t("shell.top.home")}
        title={share === undefined ? undefined : driftMarkLabel(share, t)}
        data-testid="top-brand"
      >
        <Logo drift={share} />
        <span className="t-top__name">FACET Atlas</span>
      </button>
      {stats && !compact ? (
        <dl className="t-top__stats">
          <div>
            <dt>{t("shell.top.features")}</dt>
            <dd className="t-num">{stats.features == null ? "—" : number(stats.features)}</dd>
          </div>
          <div>
            <dt>{t("shell.top.proven")}</dt>
            <dd className="t-num">
              {stats.provenPct == null ? "—" : t("shell.percent", { value: stats.provenPct })}
            </dd>
          </div>
          <div>
            <dt>{t("shell.top.drift")}</dt>
            <dd
              className={
                stats.drift == null ? "t-num" : stats.drift ? "t-num t-warn" : "t-num t-ok"
              }
            >
              {stats.drift == null ? "—" : number(stats.drift)}
            </dd>
          </div>
        </dl>
      ) : null}
      <span className="t-spacer" />
      {actions && !compact ? (
        <div className="t-top__actions" data-testid="top-actions">
          {actions}
        </div>
      ) : null}
      {compact ? (
        <>
          <IconButton icon="search" label={t("shell.top.goTo")} onClick={onCommand} />
          {onMenu ? <IconButton icon="menu" label={t("shell.top.menu")} onClick={onMenu} /> : null}
        </>
      ) : (
        <>
          <button type="button" className="t-top__command" onClick={onCommand}>
            <Icon name="search" size={16} />
            <span>{t("shell.top.command")}</span>
            <span className="t-row" style={{ gap: 3, marginLeft: "auto" }}>
              <Kbd>{t("shell.top.ctrl")}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <div style={{ position: "relative" }}>
            <Button
              size="small"
              icon="person"
              iconAfter="chevronDown"
              aria-haspopup="menu"
              aria-expanded={roleOpen}
              onClick={roleKeys.onClick}
              onKeyDown={roleKeys.onKeyDown}
            >
              {roleName}
            </Button>
            {roleOpen ? (
              <MenuFocusContext.Provider value={roleKeys.focus}>
                {roleMenu}
              </MenuFocusContext.Provider>
            ) : null}
          </div>
          <IconButton icon={theme.icon} label={theme.label} onClick={onTheme} />
          <SettingsDoor fresh={settingsFresh} onSettings={onSettings} />
        </>
      )}
    </header>
  );
}

/** The gear, with a dot while a settings page waits unopened. */
function SettingsDoor({ fresh, onSettings }: { fresh?: boolean; onSettings?: () => void }) {
  const { t } = useText();
  const button = (
    <IconButton icon="settings" label={t("shell.top.settings")} onClick={onSettings} />
  );
  if (!fresh) return button;
  return (
    <span className="t-d-glow-anchor">
      {button}
      <span
        className="t-d-glow"
        role="img"
        aria-label={t("shell.top.settingsNew")}
        data-testid="settings-fresh"
      />
    </span>
  );
}

/* Role menu ------------------------------------------------------------------ */

export type RoleOption = { key: string; name: string; purpose: string };

export function RoleMenu({
  roles,
  current,
  onPick,
}: {
  roles: RoleOption[];
  current: string;
  onPick?: (key: string) => void;
}) {
  const { t } = useText();
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = useMenuKeyboard(ref);
  return (
    <div
      ref={ref}
      className="t-popover t-float"
      role="menu"
      aria-label={t("shell.role.label")}
      style={{ top: "calc(100% + 8px)", right: 0, width: 380 }}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div className="t-menu-label">{t("shell.role.who")}</div>
      {roles.map((r) => (
        <button
          key={r.key}
          type="button"
          role="menuitemradio"
          aria-checked={r.key === current}
          className="t-menu-item"
          onClick={() => onPick?.(r.key)}
        >
          <span className="t-stack" style={{ gap: 2 }}>
            <span>{r.name}</span>
            <span className="t-muted" style={{ fontSize: 12, lineHeight: 1.4 }}>
              {r.purpose}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* Navigation --------------------------------------------------------------------- */

export type NavItem = {
  key: string;
  label: string;
  icon: IconName;
  current?: boolean;
  /** A plugin area — marked with a diamond, kept after a divider. */
  plugin?: boolean;
  badge?: number;
};

export function NavBar({ items, onPick }: { items: NavItem[]; onPick?: (key: string) => void }) {
  const { t } = useText();
  const core = items.filter((i) => !i.plugin);
  const plugins = items.filter((i) => i.plugin);
  const render = (i: NavItem) => (
    <button
      key={i.key}
      type="button"
      className="t-nav__item"
      aria-current={i.current ? "page" : undefined}
      onClick={() => onPick?.(i.key)}
    >
      {i.plugin ? (
        <span className="t-plugin-mark" aria-hidden="true" />
      ) : (
        <Icon name={i.icon} size={16} />
      )}
      <span>{i.label}</span>
      {i.plugin ? <span className="t-sr"> · {t("shell.nav.plugin")}</span> : null}
      {i.badge ? <span className="t-nav__badge">{i.badge}</span> : null}
    </button>
  );
  return (
    <nav className="t-nav" aria-label={t("shell.nav.label")}>
      {core.map(render)}
      {plugins.length ? <span className="t-nav__divider" aria-hidden="true" /> : null}
      {plugins.map(render)}
    </nav>
  );
}

export function MobileTabBar({
  items,
  onPick,
}: {
  items: { key: string; label: string; icon: IconName; current?: boolean; badge?: boolean }[];
  onPick?: (key: string) => void;
}) {
  const { t } = useText();
  return (
    <nav className="t-tabbar" aria-label={t("shell.nav.label")}>
      {items.map((i) => (
        <button
          key={i.key}
          type="button"
          className="t-tabbar__item"
          aria-current={i.current ? "page" : undefined}
          onClick={() => onPick?.(i.key)}
        >
          <span style={{ position: "relative" }}>
            <Icon name={i.icon} size={22} />
            {i.badge ? <span className="t-tabbar__dot" aria-label={t("shell.tabbar.new")} /> : null}
          </span>
          <span>{i.label}</span>
        </button>
      ))}
    </nav>
  );
}

/**
 * Everything the mobile tab bar has no room for: the remaining areas, the
 * reader role, the palette and the settings.
 */
export function MoreSheet({
  open,
  items,
  roleName,
  roles,
  currentRole,
  theme,
  onPick,
  onRole,
  onTheme,
  onSettings,
  settingsFresh,
  onClose,
  actions,
}: {
  open: boolean;
  items: NavItem[];
  /** The actions the desktop top bar carries beside its command field. */
  actions?: ReactNode;
  roleName: string;
  roles?: RoleOption[];
  currentRole?: string;
  theme?: { label: string; icon: IconName };
  onPick?: (key: string) => void;
  onRole?: (key: string) => void;
  onTheme?: () => void;
  onSettings?: () => void;
  /** A settings page the reader has not opened yet: the settings button carries a dot. */
  settingsFresh?: boolean;
  onClose?: () => void;
}) {
  const { t } = useText();
  return (
    <Sheet
      open={open}
      side="bottom"
      title={t("shell.more.title")}
      meta={t("shell.more.role", { name: roleName })}
      onClose={onClose}
      footer={
        onSettings || onTheme ? (
          <div className="t-row" style={{ width: "100%" }}>
            {theme && onTheme ? (
              <Button icon={theme.icon} onClick={onTheme}>
                {theme.label}
              </Button>
            ) : null}
            <span className="t-spacer" />
            {onSettings ? (
              <span className="t-d-glow-anchor">
                <Button icon="settings" onClick={onSettings}>
                  {t("shell.top.settings")}
                </Button>
                {settingsFresh ? (
                  <span
                    className="t-d-glow"
                    role="img"
                    aria-label={t("shell.top.settingsNew")}
                    data-testid="more-settings-fresh"
                  />
                ) : null}
              </span>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {roles && roles.length ? (
        <div className="t-stack" style={{ gap: 8, marginBottom: 16 }}>
          <span className="t-label">{t("shell.role.who")}</span>
          <div className="t-row t-row--wrap" role="radiogroup" aria-label={t("shell.role.label")}>
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={r.key === currentRole}
                className="t-chip"
                onClick={() => onRole?.(r.key)}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {actions ? (
        <div className="t-row t-row--wrap t-more-actions" data-testid="more-actions">
          {actions}
        </div>
      ) : null}
      <div className="t-more-grid">
        {items.map((i) => (
          <button
            key={i.key}
            type="button"
            className="t-more-tile t-surface"
            onClick={() => onPick?.(i.key)}
          >
            {i.plugin ? (
              <span className="t-plugin-mark" aria-hidden="true" />
            ) : (
              <Icon name={i.icon} size={22} />
            )}
            <span>{i.label}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* App shell ---------------------------------------------------------------------- */

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

/* Boot ----------------------------------------------------------------------------- */

/** The boot phases in order; each one's visible name is `shell.boot.phase.<id>`. */
export const BOOT_PHASES = [
  "connect",
  "config",
  "records",
  "enumerate",
  "index",
  "model",
  "ready",
] as const;

export type BootPhase = (typeof BOOT_PHASES)[number];

/** The five-bar wave of the loading indicator: ink, signal, three resting. */
export function LoadMark({ size = 158 }: { size?: number }) {
  const { t } = useText();
  const bars: [number, string, string][] = [
    [0, "var(--t-ink)", "-2s"],
    [34, "var(--t-signal)", "-1.8s"],
    [68, "var(--t-faint)", "-1.6s"],
    [102, "var(--t-faint)", "-1.4s"],
    [136, "var(--t-faint)", "-1.2s"],
  ];
  return (
    <svg
      className="t-loadmark"
      width={size}
      viewBox="0 0 158 100"
      role="img"
      aria-label={t("shell.boot.mark")}
    >
      {bars.map(([x, fill, delay]) => (
        <rect key={x} x={x} y="11" width="22" height="78" style={{ fill, animationDelay: delay }} />
      ))}
    </svg>
  );
}

export type BootScreenProps = {
  phase: BootPhase;
  file?: string;
  /** 0–100, or null while counting has no denominator yet. */
  progress: number | null;
  counts: { records: number | null; files: number | null; anchors: number | null };
  /** "ready" plays the flight of the mark into the logo. */
  leaving?: boolean;
  error?: { title: string; reason: string; onRetry?: () => void };
};

export function BootScreen({ phase, file, progress, counts, leaving, error }: BootScreenProps) {
  const { t, number } = useText();
  const rank = BOOT_PHASES.indexOf(phase);
  const label = rank >= 0 ? t(`shell.boot.phase.${phase}`) : phase;
  const show = (n: number | null) => (n == null ? "—" : number(n));
  return (
    <div
      className="t-boot"
      data-leaving={leaving || undefined}
      aria-live="polite"
      data-testid="boot"
    >
      <div className="t-boot__in">
        <LoadMark />
        {error ? (
          <div className="t-stack" style={{ gap: 8 }}>
            <p className="t-boot__phase t-bad">{error.title}</p>
            <p className="t-muted" style={{ margin: 0 }}>
              {error.reason}
            </p>
            {error.onRetry ? (
              <div>
                <Button icon="refresh" onClick={error.onRetry}>
                  {t("shell.boot.reconnect")}
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="t-stack" style={{ gap: 4 }}>
              <p className="t-boot__phase">{label}</p>
              <p className="t-boot__file">{file || " "}</p>
            </div>
            <ol className="t-boot__steps" aria-label={t("shell.boot.phases")}>
              {BOOT_PHASES.map((k, i) => (
                <li
                  key={k}
                  data-state={i < rank ? "done" : i === rank ? "now" : "next"}
                  title={t(`shell.boot.phase.${k}`)}
                />
              ))}
            </ol>
            <div
              className="t-meter t-meter--signal t-meter--thin"
              role="progressbar"
              aria-label={t("shell.boot.progress")}
              aria-valuenow={progress ?? undefined}
              aria-valuetext={
                progress == null
                  ? t("shell.boot.shareUnknown")
                  : t("shell.percent", { value: progress })
              }
              data-indeterminate={progress == null || undefined}
            >
              <span
                className="t-meter__value"
                style={{ ["--t-value" as string]: (progress ?? 30) / 100 }}
              />
            </div>
            <div className="t-boot__counts">
              <span>
                {t("shell.boot.records")}{" "}
                <b data-testid="boot-count-records">{show(counts.records)}</b>
              </span>
              <span>
                {t("shell.boot.files")} <b data-testid="boot-count-files">{show(counts.files)}</b>
              </span>
              <span>
                {t("shell.boot.anchors")}{" "}
                <b data-testid="boot-count-anchors">{show(counts.anchors)}</b>
              </span>
              {progress == null ? (
                <span className="t-muted" data-testid="boot-no-share">
                  {t("shell.boot.noShare")}
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
