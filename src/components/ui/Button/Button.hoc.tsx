import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { ButtonProps } from "./Button";

/** `signal` leads on, `quiet` accompanies, `ghost` is pure type. */
export type ButtonVariant = "signal" | "quiet" | "ghost";

export type WithButtonProps = Omit<ButtonProps, "computedStyle"> & {
  variant?: ButtonVariant;
  /** Full width in narrow columns. */
  block?: boolean;
  style?: CSSProperties;
};

/** Translates the variant into surface, type and edge. */
export function withButtonLogic(Component: ComponentType<ButtonProps>) {
  const Wrapped = ({ variant = "quiet", block, disabled, style, ...rest }: WithButtonProps) => {
    const computedStyle = useMemo<CSSProperties>(() => {
      const base: CSSProperties = {
        appearance: "none",
        minHeight: 32,
        padding: "6px 12px",
        fontFamily: font.sans,
        fontSize: fontSize.meta,
        lineHeight: 1.4,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: block ? "100%" : undefined,
        whiteSpace: "nowrap",
        borderRadius: 0,
        borderStyle: "solid",
        borderWidth: 1,
      };

      if (variant === "signal") {
        return {
          ...base,
          background: color.signal,
          borderColor: color.signal,
          color: color.surface,
          ...style,
        };
      }

      if (variant === "ghost") {
        return {
          ...base,
          background: "none",
          borderColor: "transparent",
          color: color.dim,
          padding: "6px 0",
          ...style,
        };
      }

      return {
        ...base,
        background: color.surface,
        borderColor: color.line,
        color: color.ink,
        ...style,
      };
    }, [variant, block, disabled, style]);

    return <Component computedStyle={computedStyle} disabled={disabled} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withButtonLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
