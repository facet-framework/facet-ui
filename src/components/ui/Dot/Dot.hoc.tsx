import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { MEANING_COLOR, type Meaning } from "../../../design-system/tokens";
import type { DotProps } from "./Dot";

export type WithDotProps = Omit<DotProps, "computedStyle"> & {
  meaning?: Meaning;
  size?: number;
  /** Hollow instead of filled — for "planned" or "not backed". */
  hollow?: boolean;
  style?: CSSProperties;
};

/** Translates meaning, size and fill into a dot. */
export function withDotLogic(Component: ComponentType<DotProps>) {
  const Wrapped = ({ meaning = "neutral", size = 5, hollow, style, ...rest }: WithDotProps) => {
    const computedStyle = useMemo<CSSProperties>(() => {
      const tone = MEANING_COLOR[meaning];
      return {
        display: "inline-block",
        width: size,
        height: size,
        flex: "0 0 auto",
        background: hollow ? "transparent" : tone,
        boxShadow: hollow ? `inset 0 0 0 1px ${tone}` : undefined,
        ...style,
      };
    }, [meaning, size, hollow, style]);

    return <Component computedStyle={computedStyle} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withDotLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
