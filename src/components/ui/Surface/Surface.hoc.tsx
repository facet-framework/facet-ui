import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, space } from "../../../design-system/tokens";
import type { SurfaceProps } from "./Surface";

export type SurfaceTone = "paper" | "surface" | "tint" | "tint2" | "transparent";

export type WithSurfaceProps = Omit<SurfaceProps, "computedStyle"> & {
  tone?: SurfaceTone;

  padding?: number | keyof typeof space;

  edge?: "top" | "bottom" | "left" | "right" | "none";

  rail?: string;

  scroll?: boolean;
  style?: CSSProperties;
};

const TONE_BACKGROUND: Record<SurfaceTone, string> = {
  paper: color.paper,
  surface: color.surface,
  tint: color.tint,
  tint2: color.tint2,
  transparent: "transparent",
};

export function withSurfaceLogic(Component: ComponentType<SurfaceProps>) {
  const Wrapped = ({
    tone = "surface",
    padding = 0,
    edge = "none",
    rail,
    scroll,
    style,
    ...rest
  }: WithSurfaceProps) => {
    const computedStyle = useMemo<CSSProperties>(() => {
      const resolvedPadding = typeof padding === "number" ? padding : space[padding];
      const border = `1px solid ${color.line}`;
      return {
        background: TONE_BACKGROUND[tone],
        padding: resolvedPadding,
        borderTop: edge === "top" ? border : undefined,
        borderBottom: edge === "bottom" ? border : undefined,
        borderLeft: rail ? `2px solid ${rail}` : edge === "left" ? border : undefined,
        borderRight: edge === "right" ? border : undefined,
        overflowY: scroll ? "auto" : undefined,
        minWidth: 0,
        minHeight: 0,
        ...style,
      };
    }, [tone, padding, edge, rail, scroll, style]);

    return <Component computedStyle={computedStyle} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withSurfaceLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
