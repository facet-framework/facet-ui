import type { CSSProperties } from "react";
import Markdown from "../Markdown";

export type KnowledgeSlotView = {
  key: string;

  slot: string;
  question: string;
  answer: string;

  derivation: string;
  filled: boolean;
  rowStyle: CSSProperties;
  slotStyle: CSSProperties;
  questionStyle: CSSProperties;
  answerStyle: CSSProperties;
  derivationStyle: CSSProperties;
};

export type KnowledgeSlotsProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  slots: KnowledgeSlotView[];
  caption: string;
  "data-testid"?: string;
};

export function KnowledgeSlots({
  containerStyle,
  captionStyle,
  slots,
  caption,
  ...rest
}: KnowledgeSlotsProps) {
  return (
    <div style={containerStyle} {...rest}>
      <p style={captionStyle}>{caption}</p>
      {slots.map((slot) => (
        <div key={slot.key} style={slot.rowStyle} data-slot={slot.slot}>
          <span style={slot.slotStyle}>{slot.slot}</span>
          <span style={slot.derivationStyle}>{slot.derivation}</span>
          <span style={slot.questionStyle}>{slot.question}</span>
          {}
          <Markdown text={slot.answer} style={slot.answerStyle} />
        </div>
      ))}
    </div>
  );
}

export default KnowledgeSlots;
