import type { ReactNode } from "react";
import { useText, type FacetText } from "../i18n/TextProvider";
import { Icon, type IconName } from "../primitives/Icon";
import { Button, IconButton, Kbd, SearchField } from "../primitives/controls";
import { Menu, Sheet, type MenuItem } from "../primitives/overlay";

export const MARK = { block: 44, height: 78, gap: 12, offset: 22 } as const;

export function driftOffset(share: number | null | undefined): number | null {
  if (share == null || !Number.isFinite(share)) return null;
  if (share <= 0) return 0;
  return Math.max(6, Math.min(MARK.offset, 2 * Math.round((MARK.offset / 2) * share)));
}

export type LogoProps = {
  size?: number;

  drift?: number | null;

  label?: string;
};

export function Logo({ size = 20, drift, label }: LogoProps) {
  const measured = drift === undefined ? MARK.offset : driftOffset(drift);
  const offset = measured ?? MARK.offset;
  const state =
    drift === undefined ? "brand" : measured == null ? "unmeasured" : offset ? "drift" : "level";

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
          fill: resting ? "var(--t-faint)" : "var(--t-signal)",
          transform: `translateY(${top + offset}px)`,
        }}
      />
    </svg>
  );
}

export function driftMarkLabel(share: number | null, t: FacetText["t"]) {
  if (share == null) return t("shell.mark.unmeasured");
  if (share <= 0) return t("shell.mark.level");
  return t("shell.mark.drift", { value: t("shell.percent", { value: Math.round(share * 100) }) });
}

export function DriftMark({ share, size = 40 }: { share: number | null; size?: number }) {
  const { t } = useText();
  return <Logo size={size} drift={share} label={driftMarkLabel(share, t)} />;
}

export type HistoryKind =
  "situation" | "area" | "dossier" | "plugin" | "overview" | "content" | "settings";

export type HistoryEntry = {
  key: string;
  time: string;
  label: string;
  kind: HistoryKind;
  sub?: string;
  current?: boolean;
};

const KIND_ICON: Record<HistoryKind, IconName> = {
  situation: "home",
  area: "product",
  dossier: "records",
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

export type TopBarStats = {
  features: number | null;
  provenPct: number | null;
  drift: number | null;

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
  onHome?: () => void;

  compact?: boolean;
  onMenu?: () => void;
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
  onHome,
  compact,
  onMenu,
}: TopBarProps) {
  const { t, number } = useText();

  const share = !stats ? undefined : stats.drift == null ? null : stats.driftShare;
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
            onClick={onHistory}
          />
        ) : null}
        {historyOpen && history ? <HistoryMenu {...history} /> : null}
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
              onClick={onRole}
            >
              {roleName}
            </Button>
            {roleOpen ? roleMenu : null}
          </div>
          <IconButton icon={theme.icon} label={theme.label} onClick={onTheme} />
          <IconButton icon="settings" label={t("shell.top.settings")} onClick={onSettings} />
        </>
      )}
    </header>
  );
}

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
  return (
    <div
      className="t-popover t-float"
      role="menu"
      aria-label={t("shell.role.label")}
      style={{ top: "calc(100% + 8px)", right: 0, width: 380 }}
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

export type NavItem = {
  key: string;
  label: string;
  icon: IconName;
  current?: boolean;

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
  onClose,
}: {
  open: boolean;
  items: NavItem[];
  roleName: string;
  roles?: RoleOption[];
  currentRole?: string;
  theme?: { label: string; icon: IconName };
  onPick?: (key: string) => void;
  onRole?: (key: string) => void;
  onTheme?: () => void;
  onSettings?: () => void;
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
              <Button icon="settings" onClick={onSettings}>
                {t("shell.top.settings")}
              </Button>
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

export type AppShellProps = {
  top: ReactNode;
  nav?: ReactNode;
  tabbar?: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
  chat?: ReactNode;

  theme?: { theme: "facet" | "paper"; mode: "dark" | "light" };

  mobile?: boolean;

  focus?: boolean;
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
}: AppShellProps) {
  return (
    <div
      className="t-app t-shell"
      data-testid="app-shell"
      data-t-theme={theme?.theme}
      data-t-mode={theme?.mode}
      data-layout={mobile ? "mobile" : "desktop"}
      data-focus={focus ? "on" : undefined}
    >
      <div className="t-shell__head">
        {top}
        {!mobile && nav ? <div className="t-shell__nav">{nav}</div> : null}
      </div>
      <main className="t-shell__main t-dotted">{children}</main>
      {mobile ? tabbar : null}
      {chat}
      {overlay}
    </div>
  );
}

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

  progress: number | null;
  counts: { records: number | null; files: number | null; anchors: number | null };

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
                {t("shell.boot.records")} <b>{show(counts.records)}</b>
              </span>
              <span>
                {t("shell.boot.files")} <b>{show(counts.files)}</b>
              </span>
              <span>
                {t("shell.boot.anchors")} <b>{show(counts.anchors)}</b>
              </span>
              {progress == null ? <span className="t-muted">{t("shell.boot.noShare")}</span> : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
