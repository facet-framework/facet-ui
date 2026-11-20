import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize, MEANING_COLOR, type Meaning } from "../../../design-system/tokens";
import type { StatValueProps } from "./StatValue";

export type StatSize = "compact" | "regular" | "stage";

export type WithStatValueProps = Omit<
  StatValueProps,
  "containerStyle" | "labelStyle" | "valueStyle" | "hintStyle"
> & {
  meaning?: Meaning;
  size?: StatSize;
  style?: CSSProperties;
};

const VALUE_SIZE: Record<StatSize, string> = {
  compact: fontSize.lead,
  regular: fontSize.display,
  stage: fontSize.hero,
};

/** Sets size and meaning colour of the key figure. */
export function withStatValueLogic(Component: ComponentType<StatValueProps>) {
  const Wrapped = ({
    meaning = "neutral",
    size = "regular",
    style,
    ...rest
  }: WithStatValueProps) => {
    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 4, minWidth: 0, ...style }),
      [style],
    );

    const labelStyle = useMemo<CSSProperties>(
      () => ({
        fontFamily: font.mono,
        fontSize: fontSize.micro,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: color.dim,
        whiteSpace: "nowrap",
      }),
      [],
    );

    const valueStyle = useMemo<CSSProperties>(
      () => ({
        fontFamily: font.mono,
        fontVariantNumeric: "tabular-nums",
        fontSize: VALUE_SIZE[size],
        lineHeight: 1.15,
        fontWeight: 400,
        color: MEANING_COLOR[meaning],
        whiteSpace: "nowrap",
      }),
      [meaning, size],
    );

    const hintStyle = useMemo<CSSProperties>(
      () => ({ fontFamily: font.sans, fontSize: fontSize.meta, color: color.dim }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        labelStyle={labelStyle}
        valueStyle={valueStyle}
        hintStyle={hintStyle}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withStatValueLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
