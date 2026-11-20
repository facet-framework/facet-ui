import type { CSSProperties } from "react";
import Markdown from "../Markdown";

export type KnowledgeSlotView = {
  key: string;
  /** Slot name from `knowledge.*`, e.g. "edge_cases". */
  slot: string;
  question: string;
  answer: string;
  /** Derivation of the answer from `knowledge.*.derive` — or "without derivation". */
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

/**
 * Knowledge as question and answer. Empty slots stay in place — the open question
 * is the statement, not its absence.
 */
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
          {/* The answer often comes with Markdown markup (inline code,
              bold) — shown as plain text, backticks and
              asterisks would stand unchanged on the screen. */}
          <Markdown text={slot.answer} style={slot.answerStyle} />
        </div>
      ))}
    </div>
  );
}

export default KnowledgeSlots;
