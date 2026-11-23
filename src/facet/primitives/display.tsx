import type { CSSProperties, ReactNode } from "react";
import { useText } from "../i18n/TextProvider";
import { Icon, type IconName } from "./Icon";
import { Button } from "./controls";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** A share between 0 and 1 drawn as a bar. `null` means not measured, never zero. */
export function Meter({
  value,
  tone = "ok",
  thin,
  label,
}: {
  value: number | null;
  tone?: "ok" | "signal" | "warn" | "plan";
  thin?: boolean;
  label: string;
}) {
  const { t } = useText();
  const measured = value != null;
  return (
    <div
      className={cx(
        "t-meter",
        tone !== "ok" && `t-meter--${tone}`,
        thin && "t-meter--thin",
        !measured && "t-meter--unmeasured",
      )}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={measured ? Math.round(value * 100) : undefined}
      aria-valuetext={measured ? undefined : t("primitives.meter.unmeasured")}
    >
      {measured ? (
        <span
          className="t-meter__value"
          style={{ "--t-value": Math.max(0, Math.min(1, value)) } as CSSProperties}
        />
      ) : null}
    </div>
  );
}

export type MetricTone = "ok" | "warn" | "plan" | "bad" | "signal";

export type MetricProps = {
  /** What is counted. */
  label: ReactNode;
  /** The measured value. `null` or absent means not measured: it shows "—", never 0. */
  value?: number | null;
  /** The whole the value is part of, shown as "/ of". `null` means the whole is not measured. */
  of?: number | null;
  /** A unit after the number. */
  unit?: ReactNode;
  /** One quieter line below the number. */
  detail?: ReactNode;
  tone?: MetricTone;
  /** `large` uses the display size of an overview tile. */
  size?: "default" | "large";
  /** Draws a whole number counting up from 0; the text read out is always the final value. */
  count?: boolean;
  /** Formats a measured number; the active locale's grouping by default. */
  format?: (value: number) => string;
};

/**
 * A figure with its label. A value that was not measured is drawn as "—" and read as "not
 * measured"; it is never shown as 0. The count-up is drawn only (CSS), the number is text.
 */
export function Metric({
  label,
  value,
  of,
  unit,
  detail,
  tone,
  size = "default",
  count = false,
  format,
}: MetricProps) {
  const { t, number } = useText();
  const show = format ?? number;
  const measured = typeof value === "number" && Number.isFinite(value);
  const text = measured ? show(value) : null;
  // A CSS counter prints plain digits; it only stands in when the formatted text is the same.
  const counts =
    measured && count && Number.isInteger(value) && value >= 0 && text === String(value);
  const absent = (
    <>
      <span aria-hidden="true">—</span>
      <span className="t-sr-only">{t("primitives.metric.unmeasured")}</span>
    </>
  );
  const ofMeasured = typeof of === "number" && Number.isFinite(of);
  return (
    <div
      className={cx("t-metric", size === "large" && "t-metric--large")}
      data-measured={measured ? "true" : "false"}
    >
      <span className={cx("t-metric__value", tone && `t-${tone}`)} data-testid="metric-value">
        {counts ? (
          <>
            <span
              className="t-counter"
              aria-hidden="true"
              style={{ "--t-counter-target": value } as CSSProperties}
            />
            <span className="t-sr-only">{text}</span>
          </>
        ) : measured ? (
          <span>{text}</span>
        ) : (
          absent
        )}
        {of !== undefined ? (
          <small>
            {" / "}
            {ofMeasured ? show(of) : absent}
          </small>
        ) : null}
        {unit != null ? <span className="t-metric__unit"> {unit}</span> : null}
      </span>
      <span className="t-metric__label">{label}</span>
      {detail != null ? <span className="t-meta">{detail}</span> : null}
    </div>
  );
}

/**
 * The opening of every overview: one figure, one sentence, then a quieter line.
 * The figure may be absent when the finding is a sentence on its own.
 */
export function Finding({
  eyebrow,
  figure,
  of,
  tone,
  sentence,
  lead,
  aside,
  mark,
}: {
  eyebrow?: ReactNode;
  /** A figure-sized mark beside the number, e.g. a status icon. */
  mark?: ReactNode;
  figure?: ReactNode;
  of?: ReactNode;
  tone?: "ok" | "warn" | "plan" | "bad";
  sentence: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
}) {
  const number = (
    <span className={cx("t-hero-number", tone && `t-${tone}`)}>
      {figure}
      {of != null ? <small> / {of}</small> : null}
    </span>
  );
  return (
    <header className="t-finding t-stagger">
      {eyebrow ? <span className="t-eyebrow">{eyebrow}</span> : null}
      {figure != null ? (
        mark ? (
          <span className="t-finding__figure">
            {mark}
            {number}
          </span>
        ) : (
          number
        )
      ) : null}
      <h1 className="t-hero-sentence">{sentence}</h1>
      {lead ? <p className="t-lead">{lead}</p> : null}
      {aside ? <div className="t-finding__aside">{aside}</div> : null}
    </header>
  );
}

export function Section({
  title,
  meta,
  actions,
  children,
  id,
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      className="t-section"
      id={id}
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div className="t-section__head">
        <h2 className="t-h2">{title}</h2>
        {meta ? <span className="t-meta">{meta}</span> : null}
        {actions ? (
          <>
            <span className="t-spacer" />
            <div className="t-row">{actions}</div>
          </>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function Surface({
  children,
  level = "surface",
  pad = true,
  className,
  style,
}: {
  children: ReactNode;
  level?: "surface" | "raised" | "float" | "sunken";
  pad?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cx(`t-${level}`, pad && "t-pad", className)} style={style}>
      {children}
    </div>
  );
}

export type ListRowProps = {
  title: ReactNode;
  sub?: ReactNode;
  lead?: ReactNode;
  trail?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** The row stands for what is shown right now (`aria-current`). */
  current?: boolean;
};

/**
 * One row of a list. With `href` it is a link, with `onClick` a button; without either it is a
 * plain row that stays readable, never a button that does nothing.
 */
export function ListRow({ title, sub, lead, trail, href, onClick, current }: ListRowProps) {
  const inner = (
    <>
      <span>{lead}</span>
      <span className="t-list-row__main">
        <span className="t-list-row__title">{title}</span>
        {sub ? <span className="t-list-row__sub">{sub}</span> : null}
      </span>
      <span className="t-row">{trail}</span>
    </>
  );
  if (href) {
    return (
      <a className="t-list-row" href={href} aria-current={current ? "page" : undefined}>
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        className="t-list-row"
        aria-current={current || undefined}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="t-list-row t-list-row--static" aria-current={current || undefined}>
      {inner}
    </div>
  );
}

export function Skeleton({
  width = "100%",
  height = 14,
  radius,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
}) {
  return (
    <span className="t-skel" aria-hidden="true" style={{ width, height, borderRadius: radius }} />
  );
}

/** Line art for empty states: a stack of sheets, nothing on them. */
function EmptyArt({ icon }: { icon: IconName }) {
  return (
    <svg
      width="120"
      height="84"
      viewBox="0 0 120 84"
      fill="none"
      aria-hidden="true"
      className="t-empty__art"
    >
      <rect
        x="22"
        y="14"
        width="76"
        height="56"
        rx="8"
        stroke="currentColor"
        strokeDasharray="4 4"
      />
      <rect x="30" y="8" width="60" height="56" rx="8" stroke="currentColor" opacity=".5" />
      <foreignObject x="48" y="22" width="24" height="24">
        <Icon name={icon} size={24} />
      </foreignObject>
    </svg>
  );
}

export function EmptyState({
  title,
  body,
  icon = "contents",
  action,
  plain,
  tone,
}: {
  title: ReactNode;
  body?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
  plain?: boolean;
  /** `error` is announced as an alert with a warning; `forbidden` is a status with a lock. */
  tone?: "error" | "forbidden";
}) {
  return (
    <div
      className={cx("t-empty", plain && "t-empty--plain", tone && `t-empty--${tone}`)}
      role={tone === "error" ? "alert" : "status"}
    >
      <EmptyArt icon={tone === "error" ? "warning" : tone === "forbidden" ? "lock" : icon} />
      <p className="t-empty__title">{title}</p>
      {body ? <p className="t-empty__body">{body}</p> : null}
      {action ? (
        <div className="t-row t-row--wrap" style={{ justifyContent: "center" }}>
          {action}
        </div>
      ) : null}
    </div>
  );
}

export type ErrorStateProps = {
  /**
   * `error` (the default): something did not load, announced as an alert. `forbidden`: the
   * viewer lacks the right, a calm status with a lock.
   */
  kind?: "error" | "forbidden";
  /** "Does not load" or "No permission" by default. */
  title?: ReactNode;
  /** The measured cause, never a guess; drawn as code. */
  reason?: ReactNode;
  /** With `forbidden`: who may, e.g. "Owner · Lead". */
  who?: ReactNode;
  /** Shows "Try again"; only for `error`. */
  onRetry?: () => void;
  /** A further way, e.g. a link to the log or a request for the right. */
  action?: ReactNode;
};

/** A state that did not come: an error with its measured cause, or a missing right. */
export function ErrorState({
  kind = "error",
  title,
  reason,
  who,
  onRetry,
  action,
}: ErrorStateProps) {
  const { t } = useText();
  const forbidden = kind === "forbidden";
  const body = forbidden ? who : reason != null ? <span className="t-mono">{reason}</span> : null;
  return (
    <EmptyState
      tone={forbidden ? "forbidden" : "error"}
      title={title ?? t(forbidden ? "primitives.state.forbidden" : "primitives.state.failed")}
      body={body}
      action={
        <>
          {onRetry && !forbidden ? (
            <Button icon="refresh" onClick={onRetry}>
              {t("primitives.state.retry")}
            </Button>
          ) : null}
          {action}
        </>
      }
    />
  );
}

export type LoadingStateProps = {
  /** The shape of what comes: rows of a list, a table, or one surface. */
  shape?: "list" | "table" | "surface";
  /** Number of skeleton rows; 5 by default. */
  rows?: number;
  /** What is loading; "Loading" by default. Read out, not drawn. */
  label?: string;
};

const SKELETON_WIDTHS = [78, 62, 70, 54, 66];

/**
 * A skeleton in the shape of what comes. It is one polite status with a name, so a screen
 * reader hears that something is loading; the shimmer moves only transform and stands still
 * when motion is reduced.
 */
export function LoadingState({ shape = "list", rows = 5, label }: LoadingStateProps) {
  const { t } = useText();
  return (
    <div className="t-loading" data-shape={shape} role="status" aria-busy="true">
      <span className="t-sr-only">{label ?? t("primitives.spinner.loading")}</span>
      {Array.from({ length: Math.max(0, rows) }, (_, i) => (
        <div key={i} className="t-loading__row" data-testid="loading-row">
          <Skeleton
            width={`${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%`}
            height={shape === "surface" && i === 0 ? 120 : 14}
          />
          {shape === "surface" ? null : <Skeleton width="30%" height={10} />}
        </div>
      ))}
    </div>
  );
}

export type OfflineStateProps = {
  /** "Disconnected" by default. */
  title?: ReactNode;
  /** What this means here, e.g. "Showing the last known state". */
  detail?: ReactNode;
  /** Since when, as measured, e.g. "since 14:20". */
  since?: ReactNode;
  /** Shows "Reconnect". */
  onReconnect?: () => void;
};

/**
 * Offline inside an area: what the surface shows is the last known state. A calm status, not
 * an error; figures that depend on the connection show "—" (see `Metric`).
 */
export function OfflineState({ title, detail, since, onReconnect }: OfflineStateProps) {
  const { t } = useText();
  return (
    <div className="t-offline" role="status">
      <Icon name="offline" size={16} className="t-offline__sign" />
      <strong className="t-offline__title">{title ?? t("primitives.state.offline")}</strong>
      {detail != null ? <span className="t-offline__detail">{detail}</span> : null}
      {since != null ? <span className="t-offline__since t-mono">{since}</span> : null}
      {onReconnect ? (
        <Button size="small" icon="refresh" onClick={onReconnect}>
          {t("primitives.state.reconnect")}
        </Button>
      ) : null}
    </div>
  );
}

/** Proportions of a whole as one band; each segment can act as a filter. */
export function Distribution({
  label,
  parts,
  onPick,
}: {
  label: string;
  parts: { key: string; label: string; value: number; tone?: string; active?: boolean }[];
  onPick?: (key: string) => void;
}) {
  const { number } = useText();
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div className="t-dist" role="group" aria-label={label}>
      <div className="t-dist__band">
        {parts.map((p, i) => (
          <button
            key={p.key}
            type="button"
            className="t-dist__seg"
            aria-pressed={p.active}
            title={`${p.label}: ${p.value}`}
            aria-label={`${p.label}: ${p.value}`}
            onClick={() => onPick?.(p.key)}
            style={{
              flexGrow: p.value / total,
              background:
                p.tone ?? `color-mix(in srgb, var(--t-signal) ${90 - i * 12}%, var(--t-sunken))`,
            }}
          />
        ))}
      </div>
      <div className="t-dist__legend">
        {parts.map((p, i) => (
          <span key={p.key} className="t-row" style={{ gap: 6 }}>
            <span
              className="t-dot"
              style={{
                background:
                  p.tone ?? `color-mix(in srgb, var(--t-signal) ${90 - i * 12}%, var(--t-sunken))`,
              }}
            />
            <span>{p.label}</span>
            <span className="t-meta">{number(p.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** A stack where the focused card is sharp and its neighbours recede by distance. */
export function DepthDeck<T>({
  items,
  focus,
  render,
  label,
}: {
  items: T[];
  focus: number;
  render: (item: T, index: number) => ReactNode;
  label: string;
}) {
  return (
    <div className="t-deck" role="list" aria-label={label}>
      {items.map((it, i) => (
        <div
          key={i}
          role="listitem"
          className="t-depth"
          data-depth={String(Math.min(2, Math.abs(i - focus)))}
        >
          {render(it, i)}
        </div>
      ))}
    </div>
  );
}
