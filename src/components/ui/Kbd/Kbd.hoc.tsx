import { labelText } from "../../../i18n/legacy/labels";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { KbdProps } from "./Kbd";

export type WithKbdProps = Omit<KbdProps, "computedStyle" | "keys" | "label"> & {
  keys: string | string[];

  label?: string;
  style?: CSSProperties;
};

const SPOKEN: Record<string, string> = {
  "⌘": labelText.text327,
  "⇧": labelText.text328,
  "⌥": labelText.text329,
  "↑": labelText.extra23,
  "↓": "Pfeil runter",
  "→": "Pfeil rechts",
  "←": "Pfeil links",
  Esc: "Escape",
};

export function withKbdLogic(Component: ComponentType<KbdProps>) {
  const Wrapped = ({ keys, label, style, ...rest }: WithKbdProps) => {
    const printed = useMemo(() => (Array.isArray(keys) ? keys.join(" ") : keys), [keys]);

    const spoken = useMemo(() => {
      if (label) return label;
      const parts = Array.isArray(keys) ? keys : [...keys];
      return parts.map((part) => SPOKEN[part] ?? part).join(" ");
    }, [keys, label]);

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
