import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/Timeline/Timeline.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { formatNumber } from "../../../core";
import { color, font, fontSize, MEANING_COLOR } from "../../../design-system/tokens";
import type { TimelineBucket, TimelineProps } from "./Timeline";

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

  unit?: string;

  bucket?: "month" | "year" | "auto";

  height?: number;
  emptyText?: string;
  style?: CSSProperties;
};

const MONTHS = [
  labelText.text459,
  labelText.text460,
  localized.text1,
  "April",
  labelText.text208,
  labelText.text461,
  labelText.text462,
  "August",
  "September",
  labelText.text463,
  "November",
  labelText.text464,
];

const MAX_MONTHS = 60;

const MIN_BLOCK = 2;

const MAX_COLUMN = 28;

export function withTimelineLogic(Component: ComponentType<TimelineProps>) {
  const Wrapped = ({
    events,
    unit = "Records",
    bucket = "auto",
    height = 96,
    emptyText = localized.text2,
    style,
    ...rest
  }: WithTimelineProps) => {
    const counted = useMemo(() => count(events, bucket), [bucket, events]);

    const buckets = useMemo<TimelineBucket[]>(() => {
      const max = counted.rows.reduce((n, row) => Math.max(n, row.count), 0);
      return counted.rows.map((row, index) => ({
        key: row.key,
        label: `${nameOf(row.key, counted.mode)} · ${
          row.count ? `${formatNumber(row.count)} ${unit}` : "nichts angelegt"
        }`,
        height: row.count ? Math.max(MIN_BLOCK, Math.round((row.count / max) * height)) : 0,
        tick: tickOf(counted.rows, index, counted.mode),
        columnStyle: COLUMN_STYLE,
        blockStyle: BLOCK_STYLE,
        tickStyle: TICK_STYLE,
      }));
    }, [counted, height, unit]);

    const caption = useMemo(() => {
      if (!counted.rows.length) return emptyText;
      const total = counted.rows.reduce((n, row) => n + row.count, 0);
      const peak = counted.rows.reduce((best, row) => (row.count > best.count ? row : best));
      const first = nameOf(counted.rows[0].key, counted.mode);
      const last = nameOf(counted.rows[counted.rows.length - 1].key, counted.mode);
      const range = first === last ? first : `${first}${labelText.text465}${last}`;

      const peakText = `${labelText.text466}${nameOf(peak.key, counted.mode)}${localized.text3}${formatNumber(peak.count)}`;
      const skipped = counted.undated
        ? ` · ${formatNumber(counted.undated)}${localized.text4}`
        : "";
      return `${formatNumber(total)} ${unit} · ${range} · ${peakText}${skipped}`;
    }, [counted, emptyText, unit]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 6, minWidth: 0, ...style }),
      [style],
    );

    const plotStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gridTemplateColumns: `repeat(${Math.max(counted.rows.length, 1)}, minmax(0, 1fr))`,

        gap: 2,
        alignItems: "end",
        height,
        maxWidth: counted.rows.length * MAX_COLUMN,

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

function nameOf(key: string, mode: Mode): string {
  if (mode === "year") return key;
  return `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
}

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
