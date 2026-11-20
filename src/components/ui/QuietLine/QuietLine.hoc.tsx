import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { QuietLineProps } from "./QuietLine";

export type WithQuietLineProps = Omit<QuietLineProps, "computedStyle"> & {
  tone?: "quiet" | "ok";
  style?: CSSProperties;
};

export function withQuietLineLogic(Component: ComponentType<QuietLineProps>) {
  const Wrapped = ({ tone = "quiet", style, ...rest }: WithQuietLineProps) => {
    const computedStyle = useMemo<CSSProperties>(
      () => ({
        margin: 0,
        fontFamily: font.mono,
        fontSize: fontSize.meta,
        lineHeight: 1.6,
        color: tone === "ok" ? color.ok : color.dim,
        ...style,
      }),
      [tone, style],
    );

    return <Component computedStyle={computedStyle} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withQuietLineLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
