import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import { font } from "../../../design-system/tokens";
import type { CounterProps } from "./Counter";

export type WithCounterProps = Omit<CounterProps, "display" | "computedStyle" | "finalLabel"> & {
  /** Final value. */
  value: number;
  /** Unit after the number, e.g. `%`. */
  unit?: string;
  /** Duration of the count-up in milliseconds. */
  duration?: number;
  /** Turn the count-up off — for values that change often. */
  animate?: boolean;
  style?: CSSProperties;
};

const STEP_MS = 40;

/**
 * Owns the counting timer and cleans it up. The count-up runs only on first
 * appearance; later changes jump straight to the new value, so that the
 * counter does not fake freshness. `prefers-reduced-motion` turns it off.
 */
export function withCounterLogic(Component: ComponentType<CounterProps>) {
  const Wrapped = ({
    value,
    unit = "",
    duration = 320,
    animate = true,
    style,
    ...rest
  }: WithCounterProps) => {
    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const shouldAnimate = animate && !reduced;
    const [current, setCurrent] = useState(shouldAnimate ? 0 : value);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const landedRef = useRef(!shouldAnimate);

    useEffect(() => {
      if (landedRef.current) {
        setCurrent(value);
        return;
      }

      landedRef.current = true;
      const steps = Math.max(1, Math.round(duration / STEP_MS));
      let step = 0;

      intervalRef.current = setInterval(() => {
        step += 1;
        setCurrent(step >= steps ? value : Math.round((value * step) / steps));
        if (step >= steps && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, STEP_MS);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [value, duration]);

    const computedStyle = useMemo<CSSProperties>(
      () => ({
        position: "relative",
        fontFamily: font.mono,
        fontVariantNumeric: "tabular-nums",
        ...style,
      }),
      [style],
    );

    return (
      <Component
        display={`${current}${unit}`}
        finalLabel={`${value}${unit}`}
        computedStyle={computedStyle}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withCounterLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
