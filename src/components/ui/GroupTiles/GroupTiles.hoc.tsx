import { labelText } from "../../../i18n/legacy/labels";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/GroupTiles/GroupTiles.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { formatNumber, pct } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { GroupTile, GroupTilesProps } from "./GroupTiles";

export type GroupInput = {
  key: string;
  label: string;

  count: number;

  meta?: string;

  proven?: number;
  total?: number;
};

export type WithGroupTilesProps = Omit<
  GroupTilesProps,
  "containerStyle" | "gridStyle" | "captionStyle" | "tiles" | "caption" | "emptyText"
> & {
  groups: GroupInput[];

  noun?: string;

  unit?: string;

  shareNoun?: string;
  onOpen?: (key: string) => void;
  emptyText?: string;

  tileWidth?: number;
  style?: CSSProperties;
};

export function withGroupTilesLogic(Component: ComponentType<GroupTilesProps>) {
  const Wrapped = ({
    groups,
    noun = labelText.text447,
    unit = "Records",
    shareNoun = localized.text1,
    onOpen,
    emptyText = germanLabels.text153,
    tileWidth = 190,
    style,
    ...rest
  }: WithGroupTilesProps) => {
    const sorted = useMemo(
      () => [...groups].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      [groups],
    );

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
            value: formatNumber(group.count),
            meta: group.meta ?? "",
            share: measurable
              ? {
                  value: proven,
                  total: group.total as number,
                  label: `${group.label}: ${proven}${germanLabels.text109}${group.total} ${shareNoun}`,
                }
              : null,

            shareText: measurable
              ? `${proven}/${group.total} ${shareNoun} · ${pct(proven, group.total as number)} %`
              : anyMeasured
                ? "nichts gemessen"
                : "",
            onOpen: onOpen ? () => onOpen(group.key) : undefined,
            tileStyle: tileStyle(Boolean(onOpen)),
            labelStyle: LABEL_STYLE,
            valueStyle: VALUE_STYLE,
            metaStyle: META_STYLE,
            shareStyle: SHARE_STYLE,
          };
        }),
      [anyMeasured, onOpen, shareNoun, sorted],
    );

    const caption = useMemo(() => {
      const total = groups.reduce((sum, group) => sum + group.count, 0);
      return `${formatNumber(total)} ${unit} in ${groups.length} ${noun}.`;
    }, [groups, noun, unit]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 10, minWidth: 0, ...style }),
      [style],
    );

    const gridStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${tileWidth}px, 1fr))`,

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
