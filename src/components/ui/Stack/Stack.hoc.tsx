import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { space } from "../../../design-system/tokens";
import type { StackProps } from "./Stack";

export type StackDirection = "row" | "column";

export type WithStackProps = Omit<StackProps, "computedStyle"> & {
  direction?: StackDirection;

  gap?: number | keyof typeof space;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: boolean;

  grow?: boolean;
  style?: CSSProperties;
};

export function withStackLogic(Component: ComponentType<StackProps>) {
  const Wrapped = ({
    direction = "column",
    gap = 0,
    align,
    justify,
    wrap,
    grow,
    style,
    ...rest
  }: WithStackProps) => {
    const computedStyle = useMemo<CSSProperties>(() => {
      const resolvedGap = typeof gap === "number" ? gap : space[gap];
      return {
        display: "flex",
        flexDirection: direction,
        gap: resolvedGap,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? "wrap" : undefined,
        flex: grow ? "1 1 auto" : undefined,
        minWidth: 0,
        minHeight: 0,
        ...style,
      };
    }, [direction, gap, align, justify, wrap, grow, style]);

    return <Component computedStyle={computedStyle} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withStackLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
