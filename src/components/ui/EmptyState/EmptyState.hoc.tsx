import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { EmptyStateProps } from "./EmptyState";

export type WithEmptyStateProps = Omit<
  EmptyStateProps,
  "containerStyle" | "headlineStyle" | "bodyStyle"
> & {
  tone?: "quiet" | "open";
  style?: CSSProperties;
};

export function withEmptyStateLogic(Component: ComponentType<EmptyStateProps>) {
  const Wrapped = ({ tone = "quiet", style, ...rest }: WithEmptyStateProps) => {
    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 6, padding: "14px 0", minWidth: 0, ...style }),
      [style],
    );

    const headlineStyle = useMemo<CSSProperties>(
      () => ({
        margin: 0,
        fontFamily: font.sans,
        fontSize: fontSize.base,
        color: tone === "open" ? color.ink : color.dim,
      }),
      [tone],
    );

    const bodyStyle = useMemo<CSSProperties>(
      () => ({
        margin: 0,
        fontFamily: font.mono,
        fontSize: fontSize.meta,
        lineHeight: 1.6,
        color: color.dim,
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        headlineStyle={headlineStyle}
        bodyStyle={bodyStyle}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withEmptyStateLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
