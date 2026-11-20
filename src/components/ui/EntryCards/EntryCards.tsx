import type { CSSProperties, ReactNode } from "react";

export type EntryCard = {
  key: string;

  tag: string;
  title: string;

  value: string;

  valueMeta: string;

  lead: string;

  action: string;

  figure?: ReactNode;

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
