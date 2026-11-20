import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
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
  /** The error that occurred — an error may carry a zero-based line number. */
  error: unknown;
  /** File in which the error occurred. */
  path?: string;
  retryLabel?: string;
  style?: CSSProperties;
};

/** Extracts reason and origin from the error — including the line number for YAML. */
export function withErrorStateLogic(Component: ComponentType<ErrorStateProps>) {
  const Wrapped = ({
    error,
    path,
    retryLabel: retryLabelProp,
    style,
    ...rest
  }: WithErrorStateProps) => {
    const { t } = useText();
    const retryLabel = retryLabelProp ?? t("elements.errorState.retry");
    const headline = useMemo(() => {
      if (error instanceof Error) return error.message;
      return typeof error === "string" ? error : t("elements.errorState.unknown");
    }, [error, t]);

    const origin = useMemo(() => {
      const line =
        error instanceof Error && "line" in error && typeof error.line === "number"
          ? error.line + 1
          : null;
      if (path && line != null) return `${path}:${line}`;
      if (path) return path;
      return line != null ? t("elements.errorState.line", { line }) : undefined;
    }, [error, path, t]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gap: 6,
        justifyItems: "start",
        padding: "12px 14px",
        background: color.dueSoft,
        borderLeftStyle: "solid",
        borderLeftWidth: 2,
        borderLeftColor: color.due,
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
        color: color.due,
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
