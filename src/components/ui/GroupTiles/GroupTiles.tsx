import type { CSSProperties } from "react";
import Bar from "../Bar";

/** A group — a domain, a team — as a tile. */
export type GroupTile = {
  key: string;
  /** Name of the group. It carries the identity, not the colour. */
  label: string;
  /** The number that matters, already formatted. */
  value: string;
  /** What it is made of, in one line. */
  meta: string;
  /** Share of the tile, e.g. promises with a test mapping. `null` means: nothing to measure. */
  share: { value: number; total: number; label: string } | null;
  /** Sentence below the bar — the share as a number, because a bar is not a statement. */
  shareText: string;
  onOpen?: () => void;
  tileStyle: CSSProperties;
  labelStyle: CSSProperties;
  valueStyle: CSSProperties;
  metaStyle: CSSProperties;
  shareStyle: CSSProperties;
};

export type GroupTilesProps = {
  containerStyle: CSSProperties;
  gridStyle: CSSProperties;
  captionStyle: CSSProperties;
  tiles: GroupTile[];
  /** Counts across all tiles. */
  caption: string;
  emptyText: string;
  "data-testid"?: string;
};

/**
 * Domains or teams as a field of tiles.
 *
 * Every tile carries its name, its number and the share it makes up. The
 * identity stands there as a word and not as a colour: the four semantic
 * colours of this system are a status palette, and measured, deadline red and
 * planned ochre lie below the distinguishability threshold even with full
 * colour vision. A field of tiles that colours its groups would not be
 * readable, just colourful.
 *
 * Separation uses hairlines instead of shadows — a tile here is a bounded
 * area, not a floating card.
 */
export function GroupTiles({
  containerStyle,
  gridStyle,
  captionStyle,
  tiles,
  caption,
  emptyText,
  ...rest
}: GroupTilesProps) {
  if (!tiles.length) {
    return (
      <div style={containerStyle} {...rest}>
        <p style={captionStyle}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div style={containerStyle} {...rest}>
      <ul style={gridStyle}>
        {tiles.map((tile) => (
          <li key={tile.key}>
            <Tile tile={tile} />
          </li>
        ))}
      </ul>
      <p style={captionStyle}>{caption}</p>
    </div>
  );
}

function Tile({ tile }: { tile: GroupTile }) {
  const body = (
    <>
      <span style={tile.labelStyle}>{tile.label}</span>
      <span style={tile.valueStyle}>{tile.value}</span>
      <span style={tile.metaStyle}>{tile.meta}</span>
      {tile.share ? (
        <>
          <Bar
            value={tile.share.value}
            total={tile.share.total}
            label={tile.share.label}
            height={2}
          />
          <span style={tile.shareStyle}>{tile.shareText}</span>
        </>
      ) : tile.shareText ? (
        <span style={tile.shareStyle}>{tile.shareText}</span>
      ) : null}
    </>
  );

  return tile.onOpen ? (
    <button type="button" style={tile.tileStyle} onClick={tile.onOpen} data-tile={tile.key}>
      {body}
    </button>
  ) : (
    <div style={tile.tileStyle} data-tile={tile.key}>
      {body}
    </div>
  );
}

export default GroupTiles;
