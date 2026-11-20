import { memo, useCallback, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font } from "../../../design-system/tokens";
import type { ProbeNumberProps } from "./ProbeNumber";

export type WithProbeNumberProps = Omit<
  ProbeNumberProps,
  "computedStyle" | "expanded" | "label" | "onClick"
> & {
  probeKey: string;

  activeProbe?: string | null;

  label: string;

  onToggle?: (probeKey: string | null) => void;
  style?: CSSProperties;
};

export function withProbeNumberLogic(Component: ComponentType<ProbeNumberProps>) {
  const Wrapped = ({
    probeKey,
    activeProbe = null,
    label,
    onToggle,
    style,
    ...rest
  }: WithProbeNumberProps) => {
    const expanded = activeProbe === probeKey;

    const handleClick = useCallback(() => {
      onToggle?.(expanded ? null : probeKey);
    }, [expanded, onToggle, probeKey]);

    const computedStyle = useMemo<CSSProperties>(
      () => ({
        appearance: "none",
        background: "none",
        border: "none",
        padding: 0,
        margin: 0,
        font: "inherit",
        fontFamily: font.mono,
        fontVariantNumeric: "tabular-nums",
        color: color.signal,
        cursor: "pointer",
        borderBottomStyle: "solid",
        borderBottomWidth: expanded ? 2 : 1,
        borderBottomColor: expanded ? color.signal : color.signalMid,
        lineHeight: "inherit",
        ...style,
      }),
      [expanded, style],
    );

    return (
      <Component
        computedStyle={computedStyle}
        expanded={expanded}
        label={label}
        onClick={handleClick}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withProbeNumberLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
