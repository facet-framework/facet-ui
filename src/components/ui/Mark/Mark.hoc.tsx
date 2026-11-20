import { memo, useState, type ComponentType, type CSSProperties } from "react";
import { color } from "../../../design-system/tokens";
import type { MarkBar, MarkProps } from "./Mark";

export type MarkVariant =
  /** The resting mark, without motion. */
  | "static"
  /** The loading animation runs as long as something is not there yet. */
  | "loading"
  /** The brand animation runs once and then rests; a click plays it again. */
  | "brand";

export type WithMarkProps = Omit<
  MarkProps,
  | "size"
  | "viewBoxWidth"
  | "viewBoxHeight"
  | "bars"
  | "label"
  | "interactive"
  | "wrapperStyle"
  | "onClick"
> & {
  variant?: MarkVariant;
  /** Width in pixels. */
  size?: number;
  label?: string;
  style?: CSSProperties;
};

const STATIC_BARS: MarkBar[] = [
  { key: "a", x: 0, y: 0, width: 44, height: 78, fill: color.ink },
  { key: "b", x: 56, y: 22, width: 44, height: 78, fill: color.signal },
];

const FIVE_BAR_X = [0, 34, 68, 102, 136];
const FIVE_BAR_FILL = [color.ink, color.signal, color.line2, color.line2, color.line2];

function fiveBars(prefix: "open" | "load"): MarkBar[] {
  return FIVE_BAR_X.map((x, index) => ({
    key: `${prefix}-${index}`,
    x,
    y: 11,
    width: 22,
    height: 78,
    fill: FIVE_BAR_FILL[index],
    animationKey: `${prefix}-${index + 1}`,
  }));
}

/**
 * Translates a variant into bars and field size - the keyframes themselves live
 * centrally in `tokens.css`, as `[data-up]`/`[data-right]` already do, so that
 * `prefers-reduced-motion` applies to all of them in one place.
 *
 * `brand` additionally gets a click replayer: a new `key` on the plain version
 * forces a fresh instance, and a fresh instance starts every CSS animation at
 * 0&nbsp;% again - no resetting by hand.
 */
export function withMarkLogic(Component: ComponentType<MarkProps>) {
  const Wrapped = ({
    variant = "static",
    size = 20,
    label = "Facet Atlas",
    style,
    ...rest
  }: WithMarkProps) => {
    const [playCount, setPlayCount] = useState(0);

    // The same check as in Counter.hoc.tsx and AtlasPage.hoc.tsx: `window` is
    // missing during server rendering, matchMedia in older test environments.
    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const effectiveVariant: MarkVariant = reduced && variant !== "static" ? "static" : variant;
    const isBrand = effectiveVariant === "brand";

    const bars =
      effectiveVariant === "static"
        ? STATIC_BARS
        : fiveBars(effectiveVariant === "loading" ? "load" : "open");
    const viewBoxWidth = effectiveVariant === "static" ? 100 : 158;

    return (
      <Component
        key={isBrand ? playCount : undefined}
        size={size}
        viewBoxWidth={viewBoxWidth}
        viewBoxHeight={100}
        bars={bars}
        label={label}
        interactive={isBrand}
        wrapperStyle={{ display: "inline-flex", lineHeight: 0, flex: "0 0 auto", ...style }}
        onClick={isBrand ? () => setPlayCount((count) => count + 1) : undefined}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withMarkLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
