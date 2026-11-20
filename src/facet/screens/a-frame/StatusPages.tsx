import type { CSSProperties, ReactNode } from "react";
import { useText } from "../../i18n/TextProvider";
import { Icon } from "../../primitives/Icon";
import { Button, Kbd, SearchField } from "../../primitives/controls";
import { ListRow } from "../../primitives/display";
import {
  BootScreen,
  type BootScreenProps,
  type HistoryEntry,
  HistoryMenu,
} from "../../shell/Shell";
import { Sheet, Tooltip } from "../../primitives/overlay";

export type StartPageProps = BootScreenProps & {
  freezeAt?: number;
};

export function StartPage({ freezeAt, ...boot }: StartPageProps) {
  return (
    <div
      className="t-a-start"
      data-testid="start"
      data-phase={boot.phase}
      data-freeze={freezeAt == null ? undefined : ""}
      style={freezeAt == null ? undefined : ({ "--t-a-freeze": freezeAt } as CSSProperties)}
    >
      <BootScreen {...boot} />
    </div>
  );
}

export type ConnectionBannerProps = {
  since: string;
  attempt: number;
  nextRetryIn: number | null;
  lastGood: string;
  endpoint: string;
  onRetry?: () => void;
  onDismiss?: () => void;
};

export function ConnectionBanner({
  since,
  attempt,
  nextRetryIn,
  lastGood,
  endpoint,
  onRetry,
  onDismiss,
}: ConnectionBannerProps) {
  const { t } = useText();
  return (
    <div className="t-a-offline" role="alert" data-testid="offline">
      <span className="t-a-offline__pulse" aria-hidden="true" />
      <div className="t-stack" style={{ gap: 2, minWidth: 0, flex: 1 }}>
        <span className="t-a-offline__title">{t("a.status.offline.title")}</span>
        <span className="t-meta t-a-offline__meta">
          {t("a.status.offline.meta", { since, attempt, endpoint, lastGood })}
        </span>
      </div>
      <span className="t-meta t-hide-mobile">
        {nextRetryIn == null
          ? t("a.status.offline.noRetry")
          : t("a.status.offline.retryIn", { seconds: nextRetryIn })}
      </span>
      <Button size="small" variant="primary" icon="refresh" onClick={onRetry}>
        {t("a.status.offline.connect")}
      </Button>
      {onDismiss ? (
        <Button
          size="small"
          variant="quiet"
          icon="close"
          aria-label={t("a.status.offline.dismiss")}
          onClick={onDismiss}
        />
      ) : null}
    </div>
  );
}

export function StaleFrame({ children }: { children: ReactNode }) {
  const { t } = useText();
  return (
    <div className="t-a-stale" aria-describedby="t-a-stale-note">
      <span id="t-a-stale-note" className="t-sr">
        {t("a.status.stale")}
      </span>
      {children}
    </div>
  );
}

export type NotFoundPageProps = {
  path: string;

  kind: string;
  suggestions: { id: string; label: string; sub: string; distance: number }[];
  onOpen?: (id: string) => void;
  onHome?: () => void;
  onSearch?: () => void;
  onBack?: () => void;
};

export function NotFoundPage({
  path,
  kind,
  suggestions,
  onOpen,
  onHome,
  onSearch,
  onBack,
}: NotFoundPageProps) {
  const { t, plural } = useText();
  return (
    <div className="t-page t-a-404" data-testid="not-found">
      <div className="t-a-404__in t-anim-rise">
        <svg className="t-a-404__art" viewBox="0 0 220 120" aria-hidden="true">
          <path
            d="M20 96 L110 44 L200 96 L110 148 Z"
            className="t-a-404__plate"
            transform="translate(0 -30)"
          />
          <rect x="70" y="38" width="22" height="40" rx="2" className="t-a-404__tower" />
          <rect x="128" y="28" width="22" height="50" rx="2" className="t-a-404__tower" />
          <rect x="99" y="52" width="22" height="26" rx="2" className="t-a-404__gap" />
        </svg>
        <span className="t-eyebrow">{t("a.status.notFound.eyebrow", { kind })}</span>
        <h1 className="t-h1">{t("a.status.notFound.title")}</h1>
        <p className="t-lead">
          <code className="t-mono t-a-404__path">{path}</code> {t("a.status.notFound.lead")}
        </p>
        <div className="t-row t-row--wrap" style={{ gap: 8 }}>
          <Button variant="primary" icon="search" onClick={onSearch}>
            {t("a.status.notFound.search")} <Kbd>{t("shell.top.ctrl")}</Kbd>
            <Kbd>K</Kbd>
          </Button>
          <Button icon="back" onClick={onBack}>
            {t("shell.top.back")}
          </Button>
          <Button variant="quiet" icon="home" onClick={onHome}>
            {t("a.status.notFound.home")}
          </Button>
        </div>
        {suggestions.length ? (
          <section className="t-surface t-a-404__near" aria-label={t("a.status.notFound.near")}>
            <div className="t-a-panel-head">
              <span className="t-h3">{t("a.status.notFound.didYouMean")}</span>
              <span className="t-meta">{t("a.status.notFound.byId")}</span>
            </div>
            {suggestions.map((s) => (
              <ListRow
                key={s.id}
                lead={<Icon name="records" size={14} />}
                title={<span className="t-mono">{s.label}</span>}
                sub={s.sub}
                trail={
                  <span className="t-meta">{plural("a.status.notFound.chars", s.distance)}</span>
                }
                onClick={() => onOpen?.(s.id)}
              />
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function PlacesOverlay({
  entries,
  filter,
  onFilter,
  onPick,
  onClear,
}: {
  entries: HistoryEntry[];
  filter: string;
  onFilter?: (q: string) => void;
  onPick?: (key: string) => void;
  onClear?: () => void;
}) {
  return (
    <div className="t-a-anchor t-a-anchor--history" data-testid="places">
      <HistoryMenu
        entries={entries}
        filter={filter}
        onFilter={onFilter}
        onPick={onPick}
        onClear={onClear}
      />
    </div>
  );
}

export function EmptyHistoryHint() {
  const { t } = useText();
  return (
    <div className="t-a-anchor t-a-anchor--history" data-testid="history-empty">
      <Tooltip style={{ top: "calc(100% + 6px)", left: 0, whiteSpace: "nowrap" }}>
        {t("a.status.historyEmpty")}
      </Tooltip>
    </div>
  );
}

export function PlacesSheet({
  entries,
  filter,
  onFilter,
  onPick,
  onClear,
  onClose,
}: {
  entries: HistoryEntry[];
  filter: string;
  onFilter?: (q: string) => void;
  onPick?: (key: string) => void;
  onClear?: () => void;
  onClose?: () => void;
}) {
  const { t, plural } = useText();
  const q = filter.trim().toLowerCase();
  const shown = q
    ? entries.filter((e) => (e.label + " " + (e.sub ?? "")).toLowerCase().includes(q))
    : entries;
  return (
    <Sheet
      open
      side="bottom"
      title={t("shell.history.label")}
      meta={t("a.status.places.meta", { count: entries.length })}
      onClose={onClose}
      footer={
        <Button size="small" variant="quiet" icon="trash" onClick={onClear}>
          {t("shell.history.clear")}
        </Button>
      }
    >
      <div className="t-stack" style={{ gap: 8 }} data-testid="places-sheet">
        {entries.length >= 20 ? (
          <SearchField
            label={t("shell.history.filter")}
            value={filter}
            placeholder={t("shell.history.filter")}
            onChange={onFilter}
          />
        ) : null}
        {q ? (
          <span className="t-meta">{plural("a.status.places.matches", shown.length)}</span>
        ) : null}
        <div role="list" aria-label={t("a.status.places.label")}>
          {shown.slice(0, 30).map((e) => (
            <div role="listitem" key={e.key}>
              <ListRow
                title={e.current ? <b>{e.label}</b> : e.label}
                sub={`${t(`shell.history.kind.${e.kind}`)}${e.sub ? " · " + e.sub : ""}`}
                trail={<span className="t-meta">{e.time}</span>}
                onClick={() => onPick?.(e.key)}
              />
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
