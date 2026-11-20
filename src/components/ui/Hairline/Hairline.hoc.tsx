import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color } from "../../../design-system/tokens";
import type { HairlineProps } from "./Hairline";

export type HairlineOrientation = "horizontal" | "vertical";

export type WithHairlineProps = Omit<
  HairlineProps,
  "computedStyle" | "role" | "aria-orientation"
> & {
  orientation?: HairlineOrientation;

  strength?: "line" | "line2";

  inset?: number;
  style?: CSSProperties;
};

export function withHairlineLogic(Component: ComponentType<HairlineProps>) {
  const Wrapped = ({
    orientation = "horizontal",
    strength = "line",
    inset = 0,
    style,
    ...rest
  }: WithHairlineProps) => {
    const isVertical = orientation === "vertical";

    const computedStyle = useMemo<CSSProperties>(
      () => ({
        background: strength === "line" ? color.line : color.line2,
        width: isVertical ? 1 : "auto",
        height: isVertical ? "auto" : 1,
        alignSelf: isVertical ? "stretch" : undefined,
        flex: "0 0 auto",
        margin: isVertical ? `${inset}px 0` : `0 ${inset}px`,
        ...style,
      }),
      [isVertical, strength, inset, style],
    );

    return (
      <Component
        computedStyle={computedStyle}
        role="separator"
        aria-orientation={orientation}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withHairlineLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
