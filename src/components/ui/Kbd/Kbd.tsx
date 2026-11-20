import type { CSSProperties } from "react";

export type KbdProps = {
  computedStyle: CSSProperties;

  keys: string;

  label: string;
  "data-testid"?: string;
};

export function Kbd({ computedStyle, keys, label, ...rest }: KbdProps) {
  return (
    <kbd style={computedStyle} aria-label={label} {...rest}>
      {keys}
    </kbd>
  );
}

export default Kbd;
