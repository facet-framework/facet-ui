import { localized } from "../../../i18n/legacy/components/ui/KnowledgeSlots/KnowledgeSlots.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { KnowledgeSlot } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { KnowledgeSlotsProps, KnowledgeSlotView } from "./KnowledgeSlots";

export type WithKnowledgeSlotsProps = Omit<
  KnowledgeSlotsProps,
  "containerStyle" | "captionStyle" | "slots" | "caption"
> & {
  slots: KnowledgeSlot[];

  onlyOpen?: boolean;
  style?: CSSProperties;
};

export function withKnowledgeSlotsLogic(Component: ComponentType<KnowledgeSlotsProps>) {
  const Wrapped = ({ slots, onlyOpen, style, ...rest }: WithKnowledgeSlotsProps) => {
    const visible = useMemo(
      () => (onlyOpen ? slots.filter((slot) => !slot.answer) : slots),
      [onlyOpen, slots],
    );

    const views = useMemo<KnowledgeSlotView[]>(
      () =>
        visible.map((slot) => {
          const filled = Boolean(slot.answer);
          const derive = slot.derive ?? [];
          return {
            key: slot.key,
            slot: slot.key,
            question: slot.question ? String(slot.question) : localized.text1,
            answer: filled ? String(slot.answer) : localized.text2,
            derivation: derive.length ? derive.join(", ") : localized.text3,
            filled,
            rowStyle: {
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: 4,
              padding: "10px 0",
              borderTopStyle: "solid",
              borderTopWidth: 1,
              borderTopColor: color.line,
              minWidth: 0,
            },
            slotStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.micro,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: color.dim,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            derivationStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.micro,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: derive.length ? color.soft : color.faint,
              whiteSpace: "nowrap",
            },
            questionStyle: {
              gridColumn: "1 / -1",
              fontFamily: font.sans,
              fontSize: fontSize.body,
              color: color.ink,
            },
            answerStyle: {
              gridColumn: "1 / -1",
              fontFamily: font.sans,
              fontSize: fontSize.meta,
              lineHeight: 1.6,
              color: filled ? color.soft : color.signal,
            },
          };
        }),
      [visible],
    );

    const caption = useMemo(() => {
      if (!slots.length) return localized.text4;
      const open = slots.filter((slot) => !slot.answer).length;
      if (!open) return `${slots.length}${localized.text5}`;
      return `${slots.length}${localized.text6}${open} ${open === 1 ? localized.text7 : localized.text8}.`;
    }, [slots]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 2, minWidth: 0, ...style }),
      [style],
    );

    const captionStyle = useMemo<CSSProperties>(
      () => ({
        margin: "0 0 4px",
        fontFamily: font.sans,
        fontSize: fontSize.base,
        color: color.ink,
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        captionStyle={captionStyle}
        slots={views}
        caption={caption}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withKnowledgeSlotsLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
