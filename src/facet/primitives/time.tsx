import { useMemo } from "react";
import { useText } from "../i18n/TextProvider";
import { chartColor, type ChartTone } from "./charts";

/**
 * Charts over calendar time: a day heatmap and a histogram of dated events.
 * Both run without gaps: a day or month without events gets its empty cell,
 * never an omitted one, because skipping the empty stretches draws an even
 * progression that did not happen. Dates are read as UTC so that a day never
 * moves with the viewer's time zone.
 */

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* Calendar heatmap ---------------------------------------------------------- */

export type CalendarDay = {
  /** `YYYY-MM-DD`. */
  date: string;
  /** `null` is not measured: the cell is outlined, never filled as zero. */
  count: number | null;
};

export type CalendarHeatmapProps = {
  label: string;
  /** Days with a count. A day of the range that is not listed counts as zero. */
  days: CalendarDay[];
  /** First and last day of the range, `YYYY-MM-DD`. */
  from: string;
  to: string;
  cell?: number;
  tone?: ChartTone;
  selected?: string | null;
  /** With it, the busiest days are offered as toggle buttons under the grid. */
  onPick?: (date: string) => void;
  /** How many of the busiest days `onPick` offers. */
  pickable?: number;
};

/** The calendar rows that carry a weekday label: Monday, Wednesday, Friday. */
const LABELLED_ROWS = [0, 2, 4];

const shade = (color: string, share: number) =>
  `color-mix(in srgb, ${color} ${20 + Math.round(share * 80)}%, var(--t-sunken))`;

/** Weeks as columns and Monday to Sunday as rows, from the Monday before `from` to `to`. */
export function CalendarHeatmap({
  label,
  days,
  from,
  to,
  cell = 14,
  tone = "signal",
  selected,
  onPick,
  pickable = 6,
}: CalendarHeatmapProps) {
  const { t, locale, number } = useText();
  const color = chartColor(tone);
  const names = useMemo(() => {
    const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    return {
      month: (m: number) => month.format(new Date(Date.UTC(2000, m, 1))),
      // 2024-01-01 was a Monday.
      weekday: (d: number) => weekday.format(new Date(Date.UTC(2024, 0, 1 + d))),
    };
  }, [locale]);
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const start = new Date(`${from}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const end = new Date(`${to}T00:00:00Z`);
  const cells: { date: string; week: number; dow: number; count: number | null }[] = [];
  for (let d = new Date(start), i = 0; d <= end; d.setUTCDate(d.getUTCDate() + 1), i++) {
    const date = d.toISOString().slice(0, 10);
    const count = byDate.has(date) ? (byDate.get(date) as number | null) : 0;
    cells.push({ date, week: Math.floor(i / 7), dow: i % 7, count });
  }
  const max = Math.max(1, ...cells.map((c) => c.count ?? 0));
  const weeks = (cells.at(-1)?.week ?? 0) + 1;
  const gap = 3;
  const left = 28;
  const top = 18;
  const width = left + weeks * (cell + gap);
  const height = top + 7 * (cell + gap);
  // Month labels at month starts; the range's first partial month only when it
  // leaves room before the next label, so two labels never collide.
  const firsts = cells.filter((c) => c.date.endsWith("-01"));
  const monthStarts =
    cells.length > 0 && !cells[0].date.endsWith("-01") && (firsts[0]?.week ?? weeks) >= 3
      ? [cells[0], ...firsts]
      : firsts;
  const total = cells.reduce((a, c) => a + (c.count ?? 0), 0);
  const active = cells.filter((c) => (c.count ?? 0) > 0).length;
  const unmeasured = cells.filter((c) => c.count == null).length;
  const summary = [
    t("primitives.calendar.summary", { total: number(total), days: number(active) }),
    unmeasured ? t("primitives.calendar.unmeasured", { count: number(unmeasured) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const busiest = days
    .filter((d): d is { date: string; count: number } => (d.count ?? 0) > 0)
    .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))
    .slice(0, pickable);
  return (
    <div className="t-cal">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label}: ${summary}`}
      >
        {monthStarts.map((c) => (
          <text key={c.date} x={left + c.week * (cell + gap)} y={11} className="t-chart-text">
            {names.month(Number(c.date.slice(5, 7)) - 1)}
          </text>
        ))}
        {LABELLED_ROWS.map((row) => (
          <text key={row} x={0} y={top + row * (cell + gap) + cell - 3} className="t-chart-text">
            {names.weekday(row)}
          </text>
        ))}
        {cells.map((c) => (
          <rect
            key={c.date}
            className={cx("t-cal__day", c.count == null && "t-cal__day--unmeasured")}
            data-date={c.date}
            x={left + c.week * (cell + gap)}
            y={top + c.dow * (cell + gap)}
            width={cell}
            height={cell}
            rx={3}
            style={{
              fill: c.count ? shade(color, c.count / max) : undefined,
              stroke: selected === c.date ? "var(--t-ink)" : undefined,
              strokeWidth: selected === c.date ? 1.5 : undefined,
            }}
          >
            <title>{`${c.date}: ${c.count == null ? t("primitives.meter.unmeasured") : number(c.count)}`}</title>
          </rect>
        ))}
      </svg>
      {onPick && busiest.length ? (
        <div className="t-cal__days" role="group" aria-label={t("primitives.calendar.busiest")}>
          {busiest.map((d) => (
            <button
              key={d.date}
              type="button"
              className="t-chip"
              aria-pressed={selected === d.date}
              onClick={() => onPick(d.date)}
            >
              <span className="t-mono">{d.date}</span>
              <span className="t-chip__count">{number(d.count)}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="t-chart-legend" aria-hidden="true">
        <span>{t("primitives.calendar.less")}</span>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <span
            key={p}
            className="t-chart-legend__swatch"
            style={{ background: p ? shade(color, p) : "var(--t-sunken)" }}
          />
        ))}
        <span>{t("primitives.calendar.more")}</span>
        {unmeasured ? (
          <>
            <span className="t-chart-legend__swatch t-chart-legend__swatch--unmeasured" />
            <span>{t("primitives.meter.unmeasured")}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* Date histogram ------------------------------------------------------------ */

/** A dated event. Anything up to the month is enough: `2026-07` counts as July. */
export type DatedEvent = { date: string };

type Mode = "month" | "year";
type Bucket = { key: string; count: number };

/** From this span on a month column gets narrower than its label, and years are counted. */
const MAX_MONTHS = 60;
/** A bucket with a single event must stay visible. */
const MIN_BLOCK = 2;
/** The widest column: three months must not read as three hand-wide blocks. */
const MAX_COLUMN = 28;

const monthIndex = (key: string) => Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)) - 1;
const monthKey = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;

/** Counts events into a gapless run of months or years; what carries no date is counted apart. */
export function bucketEvents(events: readonly DatedEvent[], bucket: Mode | "auto" = "auto") {
  const months: Record<string, number> = {};
  let undated = 0;
  events.forEach((event) => {
    const match = /^(\d{4})-(\d{2})/.exec(String(event.date ?? ""));
    if (!match) {
      undated++;
      return;
    }
    const key = `${match[1]}-${match[2]}`;
    months[key] = (months[key] || 0) + 1;
  });
  const keys = Object.keys(months).sort();
  if (!keys.length) return { buckets: [] as Bucket[], mode: "month" as Mode, undated };
  const span = monthIndex(keys[keys.length - 1]) - monthIndex(keys[0]) + 1;
  const mode: Mode = bucket === "auto" ? (span > MAX_MONTHS ? "year" : "month") : bucket;
  const buckets: Bucket[] = [];
  if (mode === "year") {
    const years: Record<string, number> = {};
    keys.forEach((k) => (years[k.slice(0, 4)] = (years[k.slice(0, 4)] || 0) + months[k]));
    for (let y = Number(keys[0].slice(0, 4)); y <= Number(keys[keys.length - 1].slice(0, 4)); y++) {
      buckets.push({ key: String(y), count: years[String(y)] || 0 });
    }
  } else {
    const first = monthIndex(keys[0]);
    for (let i = 0; i < span; i++) {
      const key = monthKey(first + i);
      buckets.push({ key, count: months[key] || 0 });
    }
  }
  return { buckets, mode, undated };
}

/** Year turns carry a tick, and the first bucket when it leaves room before the next one. */
function tickOf(buckets: Bucket[], index: number, mode: Mode): string | null {
  const key = buckets[index].key;
  if (mode === "year") return key;
  if (key.slice(5, 7) === "01") return key.slice(0, 4);
  if (index > 0) return null;
  const next = buckets.findIndex((b) => b.key.slice(5, 7) === "01");
  return next === -1 || next >= 3 ? key.slice(0, 4) : null;
}

export type DateHistogramProps = {
  /** The accessible name of the columns. */
  label: string;
  events: readonly DatedEvent[];
  /** What is counted, e.g. "records". */
  unit?: string;
  /** `auto` switches to years once months would get unreadably narrow. */
  bucket?: Mode | "auto";
  /** The height of the tallest column in pixels. */
  height?: number;
  tone?: ChartTone;
  /** Shown instead of the chart when no event carries a date. */
  empty?: string;
  "data-testid"?: string;
};

/**
 * Columns of counted events per month or year on a gapless axis. Only the
 * year turns are labelled; each column's count is part of its own text, so it
 * reaches screen readers and the pointer alike, and a caption names the total,
 * the range and the peak.
 */
export function DateHistogram({
  label,
  events,
  unit,
  bucket = "auto",
  height = 96,
  tone = "signal",
  empty,
  "data-testid": testId,
}: DateHistogramProps) {
  const { t, locale, number } = useText();
  const what = unit ?? t("primitives.histogram.unit");
  const monthName = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
    return (m: number) => format.format(new Date(Date.UTC(2000, m - 1, 1)));
  }, [locale]);
  const { buckets, mode, undated } = useMemo(() => bucketEvents(events, bucket), [events, bucket]);
  const nameOf = (key: string) =>
    mode === "year" ? key : `${monthName(Number(key.slice(5, 7)))} ${key.slice(0, 4)}`;
  if (!buckets.length) {
    return (
      <div className="t-hist" data-testid={testId}>
        <p className="t-hist__caption">{empty ?? t("primitives.histogram.empty")}</p>
      </div>
    );
  }
  const max = buckets.reduce((n, b) => Math.max(n, b.count), 0);
  const total = buckets.reduce((n, b) => n + b.count, 0);
  const peak = buckets.reduce((best, b) => (b.count > best.count ? b : best));
  const first = nameOf(buckets[0].key);
  const last = nameOf(buckets[buckets.length - 1].key);
  const caption = [
    `${number(total)} ${what}`,
    first === last ? first : t("primitives.histogram.range", { first, last }),
    t("primitives.histogram.peak", { name: nameOf(peak.key), count: number(peak.count) }),
    undated ? t("primitives.histogram.undated", { count: number(undated) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const columns = {
    gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))`,
    maxWidth: buckets.length * MAX_COLUMN,
  };
  const color = chartColor(tone);
  return (
    <div className="t-hist" data-testid={testId}>
      <ol className="t-hist__plot" aria-label={label} style={{ ...columns, height }}>
        {buckets.map((b) => {
          const text = `${nameOf(b.key)} · ${
            b.count ? `${number(b.count)} ${what}` : t("primitives.histogram.nothing")
          }`;
          return (
            <li key={b.key} className="t-hist__column" title={text} data-bucket={b.key}>
              <span className="t-sr">{text}</span>
              <span
                className="t-hist__block"
                aria-hidden="true"
                style={{
                  height: b.count ? Math.max(MIN_BLOCK, Math.round((b.count / max) * height)) : 0,
                  background: color,
                }}
              />
            </li>
          );
        })}
      </ol>
      <div className="t-hist__axis" aria-hidden="true" style={columns}>
        {buckets.map((b, i) => (
          <span key={b.key} data-tick={b.key}>
            {tickOf(buckets, i, mode) ?? ""}
          </span>
        ))}
      </div>
      <p className="t-hist__caption">{caption}</p>
    </div>
  );
}
