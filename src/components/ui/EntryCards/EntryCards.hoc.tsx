import { memo, useMemo, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { EntryCard, EntryCardsProps } from "./EntryCards";

/** An entry point, as the caller knows it. */
export type EntryInput = {
  key: string;
  tag: string;
  title: string;
  value: string;
  valueMeta: string;
  lead: string;
  /** Where it leads. If not given, the tile stays a piece of information. */
  action?: string;
  figure?: ReactNode;
  /** Something is outstanding here. Open entry points come first. */
  open?: boolean;
};

export type WithEntryCardsProps = Omit<
  EntryCardsProps,
  "containerStyle" | "gridStyle" | "cards" | "emptyText"
> & {
  entries: EntryInput[];
  onOpen?: (key: string) => void;
  emptyText?: string;
  /** Minimum width of a tile; the grid fills the rest itself. */
  cardWidth?: number;
  style?: CSSProperties;
};

/**
 * Passes the entry points through and puts the open ones first.
 *
 * The sort is stable: whatever was already at the top stays there as long as
 * its state does not change. A tile field that reshuffles with every data
 * update forces the reader to read it again.
 */
// @facet: interface/collections/entry-cards
// @facet-role: primary
export function withEntryCardsLogic(Component: ComponentType<EntryCardsProps>) {
  const Wrapped = ({
    entries,
    onOpen,
    emptyText: emptyTextProp,
    cardWidth = 260,
    style,
    ...rest
  }: WithEntryCardsProps) => {
    const { t } = useText();
    const emptyText = emptyTextProp ?? t("elements.entryCards.empty");
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
        // Two pixels of paper between the tiles: the separation comes from the
        // background, not from a border around every tile.
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
    // The open tile carries a hairline at the top — rank that can be seen
    // even without colour.
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
