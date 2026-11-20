import type { CSSProperties } from "react";
import Bar from "../Bar";

export type GroupTile = {
  key: string;

  label: string;

  value: string;

  meta: string;

  share: { value: number; total: number; label: string } | null;

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

  caption: string;
  emptyText: string;
  "data-testid"?: string;
};

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
