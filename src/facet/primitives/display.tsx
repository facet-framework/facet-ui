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

export function Stat({
  value,
  of,
  label,
  tone,
  large,
}: {
  value: ReactNode;
  of?: ReactNode;
  label: ReactNode;
  tone?: "ok" | "warn" | "plan" | "bad";
  large?: boolean;
}) {
  return (
    <div className={cx("t-stat", large && "t-stat--large")}>
      <span className={cx("t-stat__value", tone && `t-${tone}`)}>
        {value}
        {of != null ? <small> / {of}</small> : null}
      </span>
      <span className="t-stat__label">{label}</span>
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
  /** A figure-sized mark beside the number, e.g. the drift mark. */
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
};

export function ListRow({ title, sub, lead, trail, href, onClick }: ListRowProps) {
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
      <a className="t-list-row" href={href}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className="t-list-row" onClick={onClick}>
      {inner}
    </button>
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
  tone?: "error";
}) {
  return (
    <div
      className={cx("t-empty", plain && "t-empty--plain", tone === "error" && "t-empty--error")}
      role={tone === "error" ? "alert" : "status"}
    >
      <EmptyArt icon={tone === "error" ? "warning" : icon} />
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

export function ErrorState({
  title,
  reason,
  onRetry,
  action,
}: {
  title: ReactNode;
  reason?: ReactNode;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  const { t } = useText();
  return (
    <EmptyState
      tone="error"
      title={title}
      body={reason}
      action={
        <>
          {onRetry ? (
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
