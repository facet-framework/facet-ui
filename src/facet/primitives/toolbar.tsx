import { type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

const FOCUSABLE = "button:not([disabled]), [href], input, select, [tabindex]:not([tabindex='-1'])";

/** Moves focus between the controls of a group with the arrow keys, Home and End. */
export function rovingKey(
  e: KeyboardEvent<HTMLElement>,
  orientation: "horizontal" | "vertical",
): void {
  // A nested group (swatches inside a toolbar) has already moved the focus.
  if (e.defaultPrevented) return;
  const prev = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
  const next = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
  if (![prev, next, "Home", "End"].includes(e.key)) return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (!items.length) return;
  const at = items.indexOf(document.activeElement as HTMLElement);
  let to = at;
  if (e.key === "Home") to = 0;
  else if (e.key === "End") to = items.length - 1;
  else if (e.key === next) to = (at + 1) % items.length;
  else to = (at - 1 + items.length) % items.length;
  e.preventDefault();
  items[to].focus();
}

export type ToolbarProps = {
  label: string;
  children: ReactNode;
  orientation?: "horizontal" | "vertical";
  /** Raised above the page, for tools that hover over a canvas or an editor. */
  floating?: boolean;
  className?: string;
  /** For placing a floating toolbar, e.g. above a selection. */
  style?: CSSProperties;
};

/** A group of tools; the arrow keys move between them. */
export function Toolbar({
  label,
  children,
  orientation = "horizontal",
  floating,
  className,
  style,
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      style={style}
      className={cx(
        "t-tools",
        orientation === "vertical" && "t-tools--vertical",
        floating && "t-tools--floating t-float",
        className,
      )}
      onKeyDown={(e) => rovingKey(e, orientation)}
    >
      {children}
    </div>
  );
}

/** A thin divider between groups inside a `Toolbar`. */
export function ToolbarSeparator() {
  return <span className="t-tools__sep" role="separator" />;
}

export type Swatch<V extends string> = { value: V; label: string; color: string };

export type ColorSwatchesProps<V extends string> = {
  label: string;
  value: V;
  options: Swatch<V>[];
  onChange?: (value: V) => void;
};

/** A choice of colours, one round button per colour; the name of each is its label. */
export function ColorSwatches<V extends string>({
  label,
  value,
  options,
  onChange,
}: ColorSwatchesProps<V>) {
  return (
    <div
      className="t-swatches"
      role="radiogroup"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={(e) => rovingKey(e, "horizontal")}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          className="t-swatch"
          aria-checked={o.value === value}
          aria-label={o.label}
          title={o.label}
          tabIndex={o.value === value ? 0 : -1}
          style={{ background: o.color }}
          onClick={() => onChange?.(o.value)}
        />
      ))}
    </div>
  );
}
