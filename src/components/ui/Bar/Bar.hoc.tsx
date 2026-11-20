import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, MEANING_COLOR, type Meaning } from "../../../design-system/tokens";
import type { BarProps } from "./Bar";

export type WithBarProps = Omit<BarProps, "trackStyle" | "fillStyle" | "percent"> & {
  /** Reached value. */
  value: number;
  /** Reference size. `0` yields an empty bar instead of a division by zero. */
  total: number;
  meaning?: Meaning;
  height?: number;
  /** Full coverage is coloured green automatically. */
  autoComplete?: boolean;
  style?: CSSProperties;
};

/** Converts value and reference size into share, colour and geometry. */
export function withBarLogic(Component: ComponentType<BarProps>) {
  const Wrapped = ({
    value,
    total,
    meaning = "signal",
    height = 3,
    autoComplete = true,
    style,
    ...rest
  }: WithBarProps) => {
    const percent = useMemo(
      () => (total > 0 ? Math.round((Math.min(value, total) / total) * 100) : 0),
      [value, total],
    );

    const tone = useMemo<Meaning>(
      () => (autoComplete && total > 0 && value >= total ? "ok" : meaning),
      [autoComplete, meaning, total, value],
    );

    const trackStyle = useMemo<CSSProperties>(
      () => ({
        position: "relative",
        width: "100%",
        height,
        background: color.line,
        minWidth: 0,
        ...style,
      }),
      [height, style],
    );

    const fillStyle = useMemo<CSSProperties>(
      () => ({
        width: `${percent}%`,
        height: "100%",
        background: MEANING_COLOR[tone],
      }),
      [percent, tone],
    );

    return <Component trackStyle={trackStyle} fillStyle={fillStyle} percent={percent} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withBarLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
