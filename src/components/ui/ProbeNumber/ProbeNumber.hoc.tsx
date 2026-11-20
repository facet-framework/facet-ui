import { memo, useCallback, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font } from "../../../design-system/tokens";
import type { ProbeNumberProps } from "./ProbeNumber";

export type WithProbeNumberProps = Omit<
  ProbeNumberProps,
  "computedStyle" | "expanded" | "label" | "onClick"
> & {
  /** Key of the probe, e.g. `"open"`. */
  probeKey: string;
  /** Which probe is open right now? */
  activeProbe?: string | null;
  /** Plain text for screen readers — what does the probe show? */
  label: string;
  /** Called with the key; clicking again closes it (`null`). */
  onToggle?: (probeKey: string | null) => void;
  style?: CSSProperties;
};

/** Manages the open/close toggle and the emphasis of the active probe. */
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
