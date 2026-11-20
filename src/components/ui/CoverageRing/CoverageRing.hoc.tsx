import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { CoverageRingProps } from "./CoverageRing";

export type WithCoverageRingProps = Omit<
  CoverageRingProps,
  | "circumference"
  | "dash"
  | "trackColor"
  | "fillColor"
  | "display"
  | "label"
  | "labelStyle"
  | "containerStyle"
  | "size"
  | "strokeWidth"
> & {
  /** Promises with a test mapping. */
  value: number;
  /** Promises made, in total. */
  total: number;
  size?: number;
  strokeWidth?: number;
  /** Custom plain text; otherwise "x of y promises with a mapped test". */
  label?: string;
  style?: CSSProperties;
};

/** Computes share, arc length and colour from value and reference total. */
export function withCoverageRingLogic(Component: ComponentType<CoverageRingProps>) {
  const Wrapped = ({
    value,
    total,
    size = 96,
    strokeWidth = 8,
    label,
    style,
    ...rest
  }: WithCoverageRingProps) => {
    const { t } = useText();
    const percent = total > 0 ? Math.round((Math.min(value, total) / total) * 100) : 0;
    const circumference = useMemo(() => Math.PI * (size - strokeWidth), [size, strokeWidth]);
    const dash = useMemo(
      () => Math.round(((circumference * 2 * percent) / 100) * 100) / 100,
      [circumference, percent],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        position: "relative",
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        ...style,
      }),
      [size, style],
    );

    const labelStyle = useMemo<CSSProperties>(
      () => ({
        position: "absolute",
        fontFamily: font.mono,
        fontVariantNumeric: "tabular-nums",
        fontSize: fontSize.title,
        color: color.ink,
      }),
      [],
    );

    return (
      <Component
        size={size}
        strokeWidth={strokeWidth}
        circumference={circumference * 2}
        dash={dash}
        trackColor={color.line}
        fillColor={total > 0 && value >= total ? color.ok : color.signal}
        display={total > 0 ? `${percent} %` : "—"}
        label={label ?? t("elements.coverageRing.label", { value, total })}
        labelStyle={labelStyle}
        containerStyle={containerStyle}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withCoverageRingLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
