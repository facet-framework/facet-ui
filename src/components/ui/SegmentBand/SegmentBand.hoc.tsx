import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { SegmentBandProps, SegmentView } from "./SegmentBand";

export type Segment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type WithSegmentBandProps = Omit<
  SegmentBandProps,
  "segments" | "containerStyle" | "label"
> & {
  segments: Segment[];
  height?: number;
  /** Own plain words; otherwise they are built from the segments. */
  label?: string;
  style?: CSSProperties;
};

/** Turns absolute values into shares and phrases the plain words. */
export function withSegmentBandLogic(Component: ComponentType<SegmentBandProps>) {
  const Wrapped = ({ segments, height = 4, label, style, ...rest }: WithSegmentBandProps) => {
    const { t } = useText();
    const total = useMemo(
      () => segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0),
      [segments],
    );

    const views = useMemo<SegmentView[]>(
      () =>
        segments
          .filter((segment) => segment.value > 0)
          .map((segment) => ({
            key: segment.key,
            width: total > 0 ? `${Math.round((segment.value / total) * 10000) / 100}%` : "0%",
            background: segment.color,
            title: `${segment.label} · ${segment.value}`,
          })),
      [segments, total],
    );

    const resolvedLabel = useMemo(
      () =>
        label ??
        (total > 0
          ? segments
              .filter((segment) => segment.value > 0)
              .map((segment) => `${segment.label} ${segment.value}`)
              .join(" · ")
          : t("elements.segmentBand.empty")),
      [label, segments, t, total],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        display: "flex",
        width: "100%",
        height,
        background: color.line,
        minWidth: 0,
        ...style,
      }),
      [height, style],
    );

    return (
      <Component segments={views} containerStyle={containerStyle} label={resolvedLabel} {...rest} />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withSegmentBandLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
