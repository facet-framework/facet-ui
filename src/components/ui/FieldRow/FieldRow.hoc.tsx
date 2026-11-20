import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { FieldRowProps } from "./FieldRow";

export type WithFieldRowProps = Omit<
  FieldRowProps,
  "containerStyle" | "labelStyle" | "valueStyle"
> & {
  emphasis?: boolean;

  meaning?: "neutral" | "signal" | "deadline";

  labelWidth?: number;

  preserveLines?: boolean;
  style?: CSSProperties;
};

const TONE: Record<string, string | undefined> = {
  neutral: undefined,
  signal: color.signal,
  frist: color.deadline,
};

export function withFieldRowLogic(Component: ComponentType<FieldRowProps>) {
  const Wrapped = ({
    emphasis,
    meaning = "neutral",
    labelWidth = 116,
    preserveLines,
    style,
    ...rest
  }: WithFieldRowProps) => {
    const containerStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)`,
        gap: 14,
        alignItems: "baseline",
        padding: "8px 0",
        borderTopStyle: "solid",
        borderTopWidth: 1,
        borderTopColor: color.line,
        ...style,
      }),
      [labelWidth, style],
    );

    const labelStyle = useMemo<CSSProperties>(
      () => ({
        margin: 0,
        fontFamily: font.mono,
        fontSize: fontSize.micro,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: emphasis ? color.signal : color.dim,
      }),
      [emphasis],
    );

    const valueStyle = useMemo<CSSProperties>(
      () => ({
        margin: 0,
        minWidth: 0,
        fontFamily: font.sans,
        fontSize: fontSize.body,
        lineHeight: 1.6,
        fontWeight: meaning === "neutral" ? undefined : 500,
        color: TONE[meaning] ?? (emphasis ? color.ink : color.soft),
        whiteSpace: preserveLines ? "pre-line" : undefined,
        overflowWrap: "anywhere",
      }),
      [emphasis, meaning, preserveLines],
    );

    return (
      <Component
        containerStyle={containerStyle}
        labelStyle={labelStyle}
        valueStyle={valueStyle}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withFieldRowLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
