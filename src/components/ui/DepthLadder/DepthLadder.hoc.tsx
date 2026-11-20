import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { localized } from "../../../i18n/legacy/components/ui/DepthLadder/DepthLadder.hoc";
import {
  memo,
  useCallback,
  useMemo,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { DepthLadderProps, DepthStepView } from "./DepthLadder";

export const DEPTH_STEPS = [remainingText.text83, localized.text1, remainingText.text84] as const;

export type WithDepthLadderProps = Omit<
  DepthLadderProps,
  "containerStyle" | "hintStyle" | "steps" | "label" | "hint" | "onKeyDown"
> & {
  depth: number;
  onDepthChange?: (depth: number) => void;

  steps?: readonly string[];
  label?: string;
  style?: CSSProperties;
};

export function withDepthLadderLogic(Component: ComponentType<DepthLadderProps>) {
  const Wrapped = ({
    depth,
    onDepthChange,
    steps = DEPTH_STEPS,
    label = labelText.text277,
    style,
    ...rest
  }: WithDepthLadderProps) => {
    const clamp = useCallback(
      (next: number) => Math.min(steps.length, Math.max(1, next)),
      [steps.length],
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onDepthChange?.(clamp(depth + 1));
          return;
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onDepthChange?.(clamp(depth - 1));
        }
      },
      [clamp, depth, onDepthChange],
    );

    const views = useMemo<DepthStepView[]>(
      () =>
        steps.map((name, index) => {
          const level = index + 1;
          const current = level === depth;
          return {
            key: name,
            label: name,
            current,
            onSelect: () => onDepthChange?.(level),
            style: {
              appearance: "none",
              background: "none",
              border: "none",
              padding: "4px 0",
              minHeight: 32,
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: current ? color.ink : color.dim,
              borderBottomStyle: "solid",
              borderBottomWidth: 2,
              borderBottomColor: current ? color.signal : "transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
            },
          };
        }),
      [depth, onDepthChange, steps],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "flex", alignItems: "center", gap: 18, minWidth: 0, ...style }),
      [style],
    );

    const hintStyle = useMemo<CSSProperties>(
      () => ({
        marginLeft: "auto",
        fontFamily: font.mono,
        fontSize: fontSize.micro,
        letterSpacing: "0.12em",
        color: color.faint,
        whiteSpace: "nowrap",
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        hintStyle={hintStyle}
        steps={views}
        label={label}
        hint={localized.text2}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withDepthLadderLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
