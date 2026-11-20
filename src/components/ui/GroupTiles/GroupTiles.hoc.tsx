import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { pct } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { GroupTile, GroupTilesProps } from "./GroupTiles";

/** A group as the caller knows it. */
export type GroupInput = {
  key: string;
  label: string;
  /** The tile's number — records, promises, whatever was counted. */
  count: number;
  /** Second line: what the number is made of. Without a value it stays empty. */
  meta?: string;
  /** Reached out of … for the share bar. Without `total` there is no bar. */
  proven?: number;
  total?: number;
};

export type WithGroupTilesProps = Omit<
  GroupTilesProps,
  "containerStyle" | "gridStyle" | "captionStyle" | "tiles" | "caption" | "emptyText"
> & {
  groups: GroupInput[];
  /** What the tiles are about, for the answer line: "areas", "teams". */
  noun?: string;
  /** What the number counts: "records". */
  unit?: string;
  /** What the share stands for: "promises with a mapped test". */
  shareNoun?: string;
  onOpen?: (key: string) => void;
  emptyText?: string;
  /** Minimum width of a tile; the grid fills the rest by itself. */
  tileWidth?: number;
  style?: CSSProperties;
};

/**
 * Turns groups into tiles: number, subtitle, share.
 *
 * Sorted by number, descending — whoever skims a field of tiles reads the top
 * left first, and that is where the largest belongs. With equal numbers the
 * name decides, so the order stays put between two runs.
 */
export function withGroupTilesLogic(Component: ComponentType<GroupTilesProps>) {
  const Wrapped = ({
    groups,
    noun: nounProp,
    unit: unitProp,
    shareNoun: shareNounProp,
    onOpen,
    emptyText: emptyTextProp,
    tileWidth = 190,
    style,
    ...rest
  }: WithGroupTilesProps) => {
    const { t, number } = useText();
    const noun = nounProp ?? t("elements.groupTiles.noun");
    const unit = unitProp ?? t("elements.groupTiles.unit");
    const shareNoun = shareNounProp ?? t("elements.groupTiles.shareNoun");
    const emptyText = emptyTextProp ?? t("elements.groupTiles.empty");
    const sorted = useMemo(
      () => [...groups].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      [groups],
    );

    // If no group has anything to measure, the share line is dropped entirely.
    // A field of nothing but "nothing measured" answers a
    // question nobody asked and makes every tile one line taller.
    const anyMeasured = useMemo(
      () => groups.some((group) => typeof group.total === "number" && group.total > 0),
      [groups],
    );

    const tiles = useMemo<GroupTile[]>(
      () =>
        sorted.map((group) => {
          const measurable = typeof group.total === "number" && group.total > 0;
          const proven = group.proven ?? 0;
          return {
            key: group.key,
            label: group.label,
            value: number(group.count),
            meta: group.meta ?? "",
            share: measurable
              ? {
                  value: proven,
                  total: group.total as number,
                  label: t("elements.groupTiles.shareLabel", {
                    label: group.label,
                    proven,
                    total: group.total as number,
                    shareNoun,
                  }),
                }
              : null,
            // The bar is the shape, the number is the statement.
            shareText: measurable
              ? `${proven}/${group.total} ${shareNoun} · ${pct(proven, group.total as number)} %`
              : anyMeasured
                ? t("elements.groupTiles.nothingMeasured")
                : "",
            onOpen: onOpen ? () => onOpen(group.key) : undefined,
            tileStyle: tileStyle(Boolean(onOpen)),
            labelStyle: LABEL_STYLE,
            valueStyle: VALUE_STYLE,
            metaStyle: META_STYLE,
            shareStyle: SHARE_STYLE,
          };
        }),
      [anyMeasured, onOpen, shareNoun, sorted, t, number],
    );

    const caption = useMemo(() => {
      const total = groups.reduce((sum, group) => sum + group.count, 0);
      return t("elements.groupTiles.caption", {
        total: number(total),
        unit,
        groups: groups.length,
        noun,
      });
    }, [groups, noun, t, unit, number]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 10, minWidth: 0, ...style }),
      [style],
    );

    const gridStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${tileWidth}px, 1fr))`,
        // Two pixels of paper between the surfaces: the separation comes from
        // the background, not from a frame around every tile.
        gap: 2,
        listStyle: "none",
        margin: 0,
        padding: 0,
      }),
      [tileWidth],
    );

    return (
      <Component
        containerStyle={containerStyle}
        gridStyle={gridStyle}
        captionStyle={CAPTION_STYLE}
        tiles={tiles}
        caption={caption}
        emptyText={emptyText}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withGroupTilesLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}

function tileStyle(clickable: boolean): CSSProperties {
  return {
    appearance: "none",
    border: "none",
    borderRadius: 0,
    width: "100%",
    display: "grid",
    gap: 4,
    alignContent: "start",
    background: color.surface,
    padding: "14px 14px 16px",
    minHeight: 118,
    textAlign: "left",
    cursor: clickable ? "pointer" : undefined,
    minWidth: 0,
  };
}

const LABEL_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: color.dim,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const VALUE_STYLE: CSSProperties = {
  fontFamily: font.sans,
  fontSize: fontSize.display,
  fontWeight: 300,
  lineHeight: 1.1,
  fontVariantNumeric: "tabular-nums",
  color: color.ink,
};

const META_STYLE: CSSProperties = {
  fontFamily: font.sans,
  fontSize: fontSize.meta,
  color: color.soft,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const SHARE_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.caption,
  fontVariantNumeric: "tabular-nums",
  color: color.dim,
};

const CAPTION_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: font.mono,
  fontSize: fontSize.meta,
  color: color.dim,
};
