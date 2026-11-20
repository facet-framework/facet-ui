import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { KbdProps } from "./Kbd";

export type WithKbdProps = Omit<KbdProps, "computedStyle" | "keys" | "label"> & {
  /** Shortcut as a string (`"⌘K"`) or a sequence (`["Esc"]`). */
  keys: string | string[];
  /** Own plain words; otherwise they are built from the keys. */
  label?: string;
  style?: CSSProperties;
};

const SPOKEN = {
  "⌘": "elements.kbd.command",
  "⇧": "elements.kbd.shift",
  "⌥": "elements.kbd.option",
  "↑": "elements.kbd.up",
  "↓": "elements.kbd.down",
  "→": "elements.kbd.right",
  "←": "elements.kbd.left",
} as const;

const isSpoken = (part: string): part is keyof typeof SPOKEN =>
  Object.prototype.hasOwnProperty.call(SPOKEN, part);

/** Formats the shortcut and translates special keys into spoken names. */
export function withKbdLogic(Component: ComponentType<KbdProps>) {
  const Wrapped = ({ keys, label, style, ...rest }: WithKbdProps) => {
    const { t } = useText();
    const printed = useMemo(() => (Array.isArray(keys) ? keys.join(" ") : keys), [keys]);

    const spoken = useMemo(() => {
      if (label) return label;
      const parts = Array.isArray(keys) ? keys : [...keys];
      return parts
        .map((part) => (isSpoken(part) ? t(SPOKEN[part]) : part === "Esc" ? "Escape" : part))
        .join(" ");
    }, [keys, label, t]);

    const computedStyle = useMemo<CSSProperties>(
      () => ({
        fontFamily: font.mono,
        fontSize: fontSize.caption,
        letterSpacing: "0.08em",
        color: color.dim,
        background: color.tint,
        padding: "2px 5px",
        whiteSpace: "nowrap",
        ...style,
      }),
      [style],
    );

    return <Component computedStyle={computedStyle} keys={printed} label={spoken} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withKbdLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
