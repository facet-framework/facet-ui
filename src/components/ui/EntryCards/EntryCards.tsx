import type { CSSProperties, ReactNode } from "react";

/** An entry point — a large area that answers a question and leads on. */
export type EntryCard = {
  key: string;
  /** Subject term above the title, e.g. `PROMISES`. */
  tag: string;
  title: string;
  /** The number that matters, already formatted. */
  value: string;
  /** What it consists of — the number alone is not a statement. */
  valueMeta: string;
  /** One sentence: what there is to do here, or that there is nothing to do. */
  lead: string;
  /** Where the area leads. Empty means: it leads nowhere. */
  action: string;
  /** Custom drawing below the number — a bar, a band, a ring. */
  figure?: ReactNode;
  /** Open means: something is outstanding here. Carries rank, not only colour. */
  open: boolean;
  onOpen?: () => void;
  cardStyle: CSSProperties;
  tagStyle: CSSProperties;
  titleStyle: CSSProperties;
  valueStyle: CSSProperties;
  valueMetaStyle: CSSProperties;
  leadStyle: CSSProperties;
  actionStyle: CSSProperties;
  figureStyle: CSSProperties;
};

export type EntryCardsProps = {
  containerStyle: CSSProperties;
  gridStyle: CSSProperties;
  cards: EntryCard[];
  emptyText: string;
  "data-testid"?: string;
};

/**
 * Entry points as large areas.
 *
 * "Card" here means area, not a little card: paper instead of shadow, hairline
 * instead of frame, no rounding. What makes an area stand out is its size and
 * the mark before the title — not its colour, because a colour alone tells
 * nobody that something is outstanding.
 */
export function EntryCards({
  containerStyle,
  gridStyle,
  cards,
  emptyText,
  ...rest
}: EntryCardsProps) {
  if (!cards.length) {
    return (
      <div style={containerStyle} {...rest}>
        <p style={{ margin: 0 }}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div style={containerStyle} {...rest}>
      <ul style={gridStyle}>
        {cards.map((card) => (
          <li key={card.key}>
            <Card card={card} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Card({ card }: { card: EntryCard }) {
  const body = (
    <>
      <span style={card.tagStyle}>
        {card.open ? "▸ " : ""}
        {card.tag}
      </span>
      <span style={card.titleStyle}>{card.title}</span>
      <span style={card.valueStyle}>{card.value}</span>
      <span style={card.valueMetaStyle}>{card.valueMeta}</span>
      {card.figure ? <span style={card.figureStyle}>{card.figure}</span> : null}
      <span style={card.leadStyle}>{card.lead}</span>
      {card.action ? <span style={card.actionStyle}>{card.action}</span> : null}
    </>
  );

  return card.onOpen ? (
    <button type="button" style={card.cardStyle} onClick={card.onOpen} data-entry={card.key}>
      {body}
    </button>
  ) : (
    <div style={card.cardStyle} data-entry={card.key}>
      {body}
    </div>
  );
}

export default EntryCards;
