import type { CSSProperties } from "react";

export type KbdProps = {
  computedStyle: CSSProperties;
  /** Shortcut to display, e.g. `⌘K`. */
  keys: string;
  /** Plain text for screen readers, e.g. "Command K". */
  label: string;
  "data-testid"?: string;
};

/** Keyboard shortcut. Every mouse action has a keyboard equivalent. */
export function Kbd({ computedStyle, keys, label, ...rest }: KbdProps) {
  return (
    <kbd style={computedStyle} aria-label={label} {...rest}>
      {keys}
    </kbd>
  );
}

export default Kbd;
