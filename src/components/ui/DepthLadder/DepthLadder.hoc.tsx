import {
  memo,
  useCallback,
  useMemo,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { DepthLadderProps, DepthStepView } from "./DepthLadder";

/** The default levels (see `DEPTH_STEPS`; the shown names come from the catalog) match three job profiles: reading, checking, recalculating. */
export const DEPTH_STEPS = ["Answer", "Evidence", "Raw source"] as const;

export type WithDepthLadderProps = Omit<
  DepthLadderProps,
  "containerStyle" | "hintStyle" | "steps" | "label" | "hint" | "onKeyDown"
> & {
  /** Current level, 1-based. */
  depth: number;
  onDepthChange?: (depth: number) => void;
  /** Own level names. */
  steps?: readonly string[];
  label?: string;
  style?: CSSProperties;
};

/** Manages the level and the keyboard control (arrow right/left). */
export function withDepthLadderLogic(Component: ComponentType<DepthLadderProps>) {
  const Wrapped = ({
    depth,
    onDepthChange,
    steps: stepsProp,
    label,
    style,
    ...rest
  }: WithDepthLadderProps) => {
    const { t } = useText();
    const steps = useMemo<readonly string[]>(
      () =>
        stepsProp ?? [
          t("elements.depthLadder.answer"),
          t("elements.depthLadder.evidence"),
          t("elements.depthLadder.rawSource"),
        ],
      [stepsProp, t],
    );
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
        label={label ?? t("elements.depthLadder.label")}
        hint={t("elements.depthLadder.hint")}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withDepthLadderLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
