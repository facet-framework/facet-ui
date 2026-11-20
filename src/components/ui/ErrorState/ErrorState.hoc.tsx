import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/ErrorState/ErrorState.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { YamlError } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { ErrorStateProps } from "./ErrorState";

export type WithErrorStateProps = Omit<
  ErrorStateProps,
  | "containerStyle"
  | "headlineStyle"
  | "originStyle"
  | "retryStyle"
  | "headline"
  | "origin"
  | "retryLabel"
> & {
  error: unknown;

  path?: string;
  retryLabel?: string;
  style?: CSSProperties;
};

export function withErrorStateLogic(Component: ComponentType<ErrorStateProps>) {
  const Wrapped = ({
    error,
    path,
    retryLabel = labelText.text467,
    style,
    ...rest
  }: WithErrorStateProps) => {
    const headline = useMemo(() => {
      if (error instanceof Error) return error.message;
      return typeof error === "string" ? error : localized.text1;
    }, [error]);

    const origin = useMemo(() => {
      const line = error instanceof YamlError && error.line != null ? error.line + 1 : null;
      if (path && line != null) return `${path}:${line}`;
      if (path) return path;
      return line != null ? `${labelText.text468}${line}` : undefined;
    }, [error, path]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gap: 6,
        justifyItems: "start",
        padding: "12px 14px",
        background: color.deadlineSoft,
        borderLeftStyle: "solid",
        borderLeftWidth: 2,
        borderLeftColor: color.deadline,
        minWidth: 0,
        ...style,
      }),
      [style],
    );

    const headlineStyle = useMemo<CSSProperties>(
      () => ({
        margin: 0,
        fontFamily: font.sans,
        fontSize: fontSize.base,
        color: color.deadline,
        overflowWrap: "anywhere",
      }),
      [],
    );

    const originStyle = useMemo<CSSProperties>(
      () => ({
        margin: 0,
        fontFamily: font.mono,
        fontSize: fontSize.meta,
        color: color.dim,
        overflowWrap: "anywhere",
      }),
      [],
    );

    const retryStyle = useMemo<CSSProperties>(
      () => ({
        appearance: "none",
        background: "none",
        border: "none",
        padding: "6px 0",
        minHeight: 32,
        fontFamily: font.mono,
        fontSize: fontSize.caption,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: color.signal,
        cursor: "pointer",
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        headlineStyle={headlineStyle}
        originStyle={originStyle}
        retryStyle={retryStyle}
        headline={headline}
        origin={origin}
        retryLabel={retryLabel}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withErrorStateLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
