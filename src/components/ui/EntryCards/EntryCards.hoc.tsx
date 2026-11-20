import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { memo, useMemo, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { EntryCard, EntryCardsProps } from "./EntryCards";

export type EntryInput = {
  key: string;
  tag: string;
  title: string;
  value: string;
  valueMeta: string;
  lead: string;

  action?: string;
  figure?: ReactNode;

  open?: boolean;
};

export type WithEntryCardsProps = Omit<
  EntryCardsProps,
  "containerStyle" | "gridStyle" | "cards" | "emptyText"
> & {
  entries: EntryInput[];
  onOpen?: (key: string) => void;
  emptyText?: string;

  cardWidth?: number;
  style?: CSSProperties;
};

export function withEntryCardsLogic(Component: ComponentType<EntryCardsProps>) {
  const Wrapped = ({
    entries,
    onOpen,
    emptyText = germanLabels.text153,
    cardWidth = 260,
    style,
    ...rest
  }: WithEntryCardsProps) => {
    const cards = useMemo<EntryCard[]>(() => {
      const sorted = entries
        .map((entry, index) => ({ entry, index }))
        .sort(
          (a, b) =>
            Number(Boolean(b.entry.open)) - Number(Boolean(a.entry.open)) || a.index - b.index,
        )
        .map(({ entry }) => entry);

      return sorted.map((entry) => ({
        key: entry.key,
        tag: entry.tag,
        title: entry.title,
        value: entry.value,
        valueMeta: entry.valueMeta,
        lead: entry.lead,
        action: entry.action ?? "",
        figure: entry.figure,
        open: Boolean(entry.open),
        onOpen: onOpen ? () => onOpen(entry.key) : undefined,
        cardStyle: cardStyle(Boolean(onOpen), Boolean(entry.open)),
        tagStyle: tagStyle(Boolean(entry.open)),
        titleStyle: TITLE_STYLE,
        valueStyle: VALUE_STYLE,
        valueMetaStyle: VALUE_META_STYLE,
        leadStyle: LEAD_STYLE,
        actionStyle: ACTION_STYLE,
        figureStyle: FIGURE_STYLE,
      }));
    }, [entries, onOpen]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 10, minWidth: 0, ...style }),
      [style],
    );

    const gridStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${cardWidth}px, 1fr))`,

        gap: 2,
        listStyle: "none",
        margin: 0,
        padding: 0,
      }),
      [cardWidth],
    );

    return (
      <Component
        containerStyle={containerStyle}
        gridStyle={gridStyle}
        cards={cards}
        emptyText={emptyText}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withEntryCardsLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}

function cardStyle(clickable: boolean, open: boolean): CSSProperties {
  return {
    appearance: "none",
    border: "none",
    borderRadius: 0,

    borderTop: open ? `2px solid ${color.signal}` : `2px solid transparent`,
    width: "100%",
    height: "100%",
    display: "grid",
    gap: 6,
    alignContent: "start",
    background: color.surface,
    padding: "18px 18px 20px",
    minHeight: 190,
    textAlign: "left",
    cursor: clickable ? "pointer" : undefined,
    minWidth: 0,
  };
}

function tagStyle(open: boolean): CSSProperties {
  return {
    fontFamily: font.mono,
    fontSize: fontSize.micro,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: open ? color.signal : color.faint,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

const TITLE_STYLE: CSSProperties = {
  fontFamily: font.sans,
  fontSize: fontSize.lead,
  fontWeight: 400,
  color: color.ink,
};

const VALUE_STYLE: CSSProperties = {
  fontFamily: font.sans,
  fontSize: fontSize.hero,
  fontWeight: 300,
  lineHeight: 1,
  fontVariantNumeric: "tabular-nums",
  color: color.ink,
  marginTop: 4,
};

const VALUE_META_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.caption,
  color: color.dim,
  fontVariantNumeric: "tabular-nums",
};

const FIGURE_STYLE: CSSProperties = { display: "block", marginTop: 2, minWidth: 0 };

const LEAD_STYLE: CSSProperties = {
  fontFamily: font.sans,
  fontSize: fontSize.meta,
  color: color.soft,
  lineHeight: 1.45,
  marginTop: 2,
};

const ACTION_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: color.dim,
};
