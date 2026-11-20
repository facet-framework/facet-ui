import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize, MEANING_COLOR } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { TimelineBucket, TimelineProps } from "./Timeline";

/** A dated event. Anything before the day is enough: `2026-07` counts as July. */
export type TimelineEvent = { date: string };

export type WithTimelineProps = Omit<
  TimelineProps,
  | "containerStyle"
  | "plotStyle"
  | "axisStyle"
  | "captionStyle"
  | "buckets"
  | "caption"
  | "emptyText"
> & {
  events: TimelineEvent[];
  /** What is counted: "records", "evidence". */
  unit?: string;
  /** `auto` switches to years as soon as the months become unreadably narrow. */
  bucket?: "month" | "year" | "auto";
  /** Height of the drawing area in pixels. */
  height?: number;
  emptyText?: string;
  style?: CSSProperties;
};

/** From here on a month column becomes narrower than its label. */
const MAX_MONTHS = 60;
/** A section with exactly one event must stay visible. */
const MIN_BLOCK = 2;
/**
 * Widest column. Without a cap, an axis with three months draws three
 * hand-wide blocks across the page — that reads like a statement about the
 * amount, and that is already in the height.
 */
const MAX_COLUMN = 28;

/**
 * Counts dated events into months or years and builds a
 * gapless axis from them.
 *
 * Gapless means: between the first and the last event every
 * section gets a column, the empty ones too. A chart that only draws the months
 * with content claims an evenness that did not exist.
 */
export function withTimelineLogic(Component: ComponentType<TimelineProps>) {
  const Wrapped = ({
    events,
    unit: unitProp,
    bucket = "auto",
    height = 96,
    emptyText: emptyTextProp,
    style,
    ...rest
  }: WithTimelineProps) => {
    const { t, locale, number } = useText();
    const unit = unitProp ?? t("elements.timeline.unit");
    const emptyText = emptyTextProp ?? t("elements.timeline.empty");
    // Month names follow the active language; UTC keeps the month independent of the time zone.
    const monthName = useMemo(() => {
      const format = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
      return (month: number) => format.format(new Date(Date.UTC(2000, month - 1, 1)));
    }, [locale]);
    const counted = useMemo(() => count(events, bucket), [bucket, events]);

    const buckets = useMemo<TimelineBucket[]>(() => {
      const max = counted.rows.reduce((n, row) => Math.max(n, row.count), 0);
      return counted.rows.map((row, index) => ({
        key: row.key,
        label: `${nameOf(row.key, counted.mode, monthName)} · ${
          row.count ? `${number(row.count)} ${unit}` : t("elements.timeline.nothingCreated")
        }`,
        height: row.count ? Math.max(MIN_BLOCK, Math.round((row.count / max) * height)) : 0,
        tick: tickOf(counted.rows, index, counted.mode),
        columnStyle: COLUMN_STYLE,
        blockStyle: BLOCK_STYLE,
        tickStyle: TICK_STYLE,
      }));
    }, [counted, height, monthName, t, unit, number]);

    const caption = useMemo(() => {
      if (!counted.rows.length) return emptyText;
      const total = counted.rows.reduce((n, row) => n + row.count, 0);
      const peak = counted.rows.reduce((best, row) => (row.count > best.count ? row : best));
      const first = nameOf(counted.rows[0].key, counted.mode, monthName);
      const last = nameOf(counted.rows[counted.rows.length - 1].key, counted.mode, monthName);
      const range = first === last ? first : t("elements.timeline.range", { first, last });
      // The densest section is the only peak one is meant to read off the shape
      // — so it stands next to it as a number.
      const peakText = t("elements.timeline.peak", {
        name: nameOf(peak.key, counted.mode, monthName),
        count: number(peak.count),
      });
      const skipped = counted.undated
        ? ` · ${t("elements.timeline.undated", { count: number(counted.undated) })}`
        : "";
      return `${number(total)} ${unit} · ${range} · ${peakText}${skipped}`;
    }, [counted, emptyText, monthName, t, unit, number]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 6, minWidth: 0, ...style }),
      [style],
    );

    const plotStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gridTemplateColumns: `repeat(${Math.max(counted.rows.length, 1)}, minmax(0, 1fr))`,
        // Two pixels of paper between the columns, so that two full months do not
        // merge into one block.
        gap: 2,
        alignItems: "end",
        height,
        maxWidth: counted.rows.length * MAX_COLUMN,
        // The baseline is a hairline, not an axis with ticks.
        borderBottom: `1px solid ${color.line}`,
        listStyle: "none",
        margin: 0,
        padding: 0,
      }),
      [counted.rows.length, height],
    );

    const axisStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gridTemplateColumns: `repeat(${Math.max(counted.rows.length, 1)}, minmax(0, 1fr))`,
        gap: 2,
        maxWidth: counted.rows.length * MAX_COLUMN,
      }),
      [counted.rows.length],
    );

    return (
      <Component
        containerStyle={containerStyle}
        plotStyle={plotStyle}
        axisStyle={axisStyle}
        captionStyle={CAPTION_STYLE}
        buckets={buckets}
        caption={caption}
        emptyText={emptyText}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withTimelineLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}

type Mode = "month" | "year";
type Row = { key: string; count: number };

/** `2026-07-30` → `2026-07`. Anything that is not a date is counted and discarded. */
function count(events: TimelineEvent[], bucket: "month" | "year" | "auto") {
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
  if (!keys.length) return { rows: [] as Row[], mode: "month" as Mode, undated };

  const span = monthIndex(keys[keys.length - 1]) - monthIndex(keys[0]) + 1;
  const mode: Mode = bucket === "auto" ? (span > MAX_MONTHS ? "year" : "month") : bucket;

  if (mode === "year") {
    const years: Record<string, number> = {};
    keys.forEach((key) => (years[key.slice(0, 4)] = (years[key.slice(0, 4)] || 0) + months[key]));
    const first = Number(keys[0].slice(0, 4));
    const last = Number(keys[keys.length - 1].slice(0, 4));
    const rows: Row[] = [];
    for (let year = first; year <= last; year++) {
      rows.push({ key: String(year), count: years[String(year)] || 0 });
    }
    return { rows, mode, undated };
  }

  const start = monthIndex(keys[0]);
  const rows: Row[] = [];
  for (let i = 0; i < span; i++) {
    const key = monthKey(start + i);
    rows.push({ key, count: months[key] || 0 });
  }
  return { rows, mode, undated };
}

function monthIndex(key: string): number {
  return Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)) - 1;
}

function monthKey(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function nameOf(key: string, mode: Mode, monthName: (month: number) => string): string {
  if (mode === "year") return key;
  return `${monthName(Number(key.slice(5, 7)))} ${key.slice(0, 4)}`;
}

/**
 * The turn of the year is labelled — and the first section only when
 * there is room for both numbers before the next turn of the year.
 */
function tickOf(rows: Row[], index: number, mode: Mode): string | null {
  if (mode === "year") return rows[index].key;
  const key = rows[index].key;
  if (key.slice(5, 7) === "01") return key.slice(0, 4);
  if (index > 0) return null;
  const next = rows.findIndex((row) => row.key.slice(5, 7) === "01");
  return next === -1 || next >= 3 ? key.slice(0, 4) : null;
}

const COLUMN_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  height: "100%",
  minWidth: 0,
};

const BLOCK_STYLE: CSSProperties = {
  width: "100%",
  // A timeline measures amount, not state: one colour, no palette.
  background: MEANING_COLOR.signal,
};

const TICK_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  color: color.faint,
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  minWidth: 0,
};

const CAPTION_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: font.mono,
  fontSize: fontSize.meta,
  color: color.dim,
};
