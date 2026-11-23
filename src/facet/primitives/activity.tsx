import type { CSSProperties, ReactNode } from "react";
import { useText } from "../i18n/TextProvider";
import { Icon, type IconName } from "./Icon";
import type { Tone } from "./controls";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** Up to two initials: the first letters of the first and last word. */
export function initials(name: string): string {
  const words = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (!words.length) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : (words[0][1] ?? "");
  return (first + last).toUpperCase();
}

/** The same name always gets the same of the four series colours. */
export function avatarHue(name: string): 1 | 2 | 3 | 4 {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ((h % 4) + 1) as 1 | 2 | 3 | 4;
}

export type AvatarProps = {
  /** The person's or agent's name; it is the accessible name and the source of the initials. */
  name: string;
  size?: number;
  /** An icon instead of initials, e.g. for an automated actor. */
  icon?: IconName;
  /** A state dot at the lower right. */
  status?: Tone;
  /** Draws a ring that pulses while the actor is busy. */
  busy?: boolean;
};

export function Avatar({ name, size = 32, icon, status, busy }: AvatarProps) {
  const style = {
    "--t-avatar": `var(--t-series-${avatarHue(name)})`,
    width: size,
    height: size,
    fontSize: Math.round(size * 0.38),
  } as CSSProperties;
  return (
    <span
      className={cx("t-avatar", busy && "t-avatar--busy")}
      role="img"
      aria-label={name}
      style={style}
    >
      {icon ? <Icon name={icon} size={Math.round(size * 0.5)} /> : initials(name)}
      {status ? <span className={cx("t-avatar__status", `t-dot--${status}`)} /> : null}
    </span>
  );
}

export type TimelineItem = {
  key: string;
  title: ReactNode;
  /** When it happened, already formatted (e.g. "14:02" or "2 min ago"). */
  time?: ReactNode;
  body?: ReactNode;
  tone?: Tone;
  icon?: IconName;
  /** Still running: the marker pulses. */
  live?: boolean;
};

/** Events in order, each with a marker on one vertical line. */
export function Timeline({ label, items }: { label: string; items: TimelineItem[] }) {
  return (
    <ol className="t-timeline" aria-label={label}>
      {items.map((it) => (
        <li
          key={it.key}
          className={cx(
            "t-timeline__item",
            it.tone && it.tone !== "neutral" && `t-timeline__item--${it.tone}`,
            it.live && "t-timeline__item--live",
          )}
        >
          <span className="t-timeline__mark" aria-hidden="true">
            {it.icon ? <Icon name={it.icon} size={12} /> : null}
          </span>
          <div className="t-timeline__main">
            <div className="t-row t-row--between t-row--baseline">
              <span className="t-timeline__title">{it.title}</span>
              {it.time ? <span className="t-meta">{it.time}</span> : null}
            </div>
            {it.body ? <div className="t-timeline__body">{it.body}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** An indeterminate activity indicator. It is still under reduced motion. */
export function Spinner({ label, size = 16 }: { label?: string; size?: number }) {
  const { t } = useText();
  return (
    <span
      className="t-spinner"
      role="status"
      aria-label={label ?? t("primitives.spinner.loading")}
      style={{ width: size, height: size }}
    />
  );
}
