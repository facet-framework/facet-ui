import {
  memo,
  useCallback,
  useMemo,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { FocusRowProps } from "./FocusRow";

export type WithFocusRowProps = Omit<
  FocusRowProps,
  | "containerStyle"
  | "headerStyle"
  | "rankStyle"
  | "titleStyle"
  | "whyStyle"
  | "metaStyle"
  | "bodyStyle"
  | "onToggle"
  | "onKeyDown"
  | "open"
  | "rank"
> & {
  /** Position in the ranking, counted from 1. */
  rank: number;
  /** Id of the row — it decides whether this row is the open one. */
  id: string;
  openId?: string | null;
  /** Coupling shadow: uninvolved rows lose contrast. */
  dimmed?: boolean;
  /** Red only for deadlines. */
  overdue?: boolean;
  onOpenChange?: (id: string | null) => void;
  /** Arrow right goes one level deeper instead of only opening. */
  onDeeper?: (id: string) => void;
  style?: CSSProperties;
};

/**
 * Manages opening, closing and keyboard handling:
 * Enter/Space opens, arrow right goes deeper, arrow left and Esc go back.
 */
export function withFocusRowLogic(Component: ComponentType<FocusRowProps>) {
  const Wrapped = ({
    rank,
    id,
    openId = null,
    dimmed,
    overdue,
    onOpenChange,
    onDeeper,
    style,
    ...rest
  }: WithFocusRowProps) => {
    const open = openId === id;

    const handleToggle = useCallback(() => {
      onOpenChange?.(open ? null : id);
    }, [id, onOpenChange, open]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleToggle();
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          if (!open) onOpenChange?.(id);
          else onDeeper?.(id);
          return;
        }
        if ((event.key === "ArrowLeft" || event.key === "Escape") && open) {
          event.preventDefault();
          onOpenChange?.(null);
        }
      },
      [handleToggle, id, onDeeper, onOpenChange, open],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        borderTopStyle: "solid",
        borderTopWidth: 1,
        borderTopColor: color.line,
        background: open ? color.surface : "transparent",
        opacity: dimmed && !open ? 0.42 : 1,
        transition: "opacity var(--motion-hit) ease",
        minWidth: 0,
        ...style,
      }),
      [dimmed, open, style],
    );

    const headerStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gridTemplateColumns: "26px minmax(0, 1fr) auto",
        gridTemplateAreas: '"rank title meta" "rank why meta"',
        columnGap: 12,
        alignItems: "baseline",
        padding: "10px 12px 12px 0",
        cursor: "pointer",
        minHeight: 32,
      }),
      [],
    );

    const rankStyle = useMemo<CSSProperties>(
      () => ({
        gridArea: "rank",
        alignSelf: "start",
        fontFamily: font.mono,
        fontVariantNumeric: "tabular-nums",
        fontSize: fontSize.caption,
        color: color.faint,
        paddingTop: 3,
      }),
      [],
    );

    const titleStyle = useMemo<CSSProperties>(
      () => ({
        gridArea: "title",
        fontFamily: font.sans,
        fontSize: fontSize.base,
        color: color.ink,
        fontWeight: open ? 500 : 400,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }),
      [open],
    );

    const whyStyle = useMemo<CSSProperties>(
      () => ({
        gridArea: "why",
        fontFamily: font.sans,
        fontSize: fontSize.meta,
        color: overdue ? color.due : color.dim,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }),
      [overdue],
    );

    const metaStyle = useMemo<CSSProperties>(
      () => ({
        gridArea: "meta",
        alignSelf: "center",
        fontFamily: font.mono,
        fontSize: fontSize.caption,
        color: color.faint,
        whiteSpace: "nowrap",
      }),
      [],
    );

    const bodyStyle = useMemo<CSSProperties>(
      () => ({ padding: "0 12px 16px 38px", minWidth: 0 }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        headerStyle={headerStyle}
        rankStyle={rankStyle}
        titleStyle={titleStyle}
        whyStyle={whyStyle}
        metaStyle={metaStyle}
        bodyStyle={bodyStyle}
        rank={String(rank).padStart(2, "0")}
        open={open}
        onToggle={handleToggle}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withFocusRowLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
