import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { textStyle, type TextStyleOptions } from "../../../design-system/typography";
import type { TextProps } from "./Text";

export type WithTextProps = Omit<TextProps, "computedStyle"> &
  Partial<TextStyleOptions> & {
    /** Additions that override the computed style. */
    style?: CSSProperties;
  };

/**
 * Translates variant, tone and typeface into the concrete style.
 * The computation is memoised because `Text` occurs very often in long lists.
 */
export function withTextLogic(Component: ComponentType<TextProps>) {
  const Wrapped = ({
    variant = "body",
    tone = "ink",
    mono,
    truncate,
    clamp,
    align,
    weight,
    nowrap,
    tabular,
    style,
    ...rest
  }: WithTextProps) => {
    const computedStyle = useMemo<CSSProperties>(
      () => ({
        ...textStyle({ variant, tone, mono, truncate, clamp, align, weight, nowrap, tabular }),
        ...style,
      }),
      [variant, tone, mono, truncate, clamp, align, weight, nowrap, tabular, style],
    );

    return <Component computedStyle={computedStyle} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withTextLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
