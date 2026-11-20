import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { KnowledgeSlot } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { KnowledgeSlotsProps, KnowledgeSlotView } from "./KnowledgeSlots";

export type WithKnowledgeSlotsProps = Omit<
  KnowledgeSlotsProps,
  "containerStyle" | "captionStyle" | "slots" | "caption"
> & {
  /** Slots from `knowledge.*`. */
  slots: KnowledgeSlot[];
  /** Show only the open questions. */
  onlyOpen?: boolean;
  style?: CSSProperties;
};

/** Marks open questions, names the derivation and counts both. */
export function withKnowledgeSlotsLogic(Component: ComponentType<KnowledgeSlotsProps>) {
  const Wrapped = ({ slots, onlyOpen, style, ...rest }: WithKnowledgeSlotsProps) => {
    const { t, plural } = useText();
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
            question: slot.question
              ? String(slot.question)
              : t("elements.knowledgeSlots.noQuestion"),
            answer: filled ? String(slot.answer) : t("elements.knowledgeSlots.open"),
            derivation: derive.length
              ? derive.join(", ")
              : t("elements.knowledgeSlots.noDerivation"),
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
      [visible, t],
    );

    const caption = useMemo(() => {
      if (!slots.length) return t("elements.knowledgeSlots.empty");
      const open = slots.filter((slot) => !slot.answer).length;
      if (!open) return plural("elements.knowledgeSlots.allAnswered", slots.length);
      return plural("elements.knowledgeSlots.someOpen", slots.length, { open });
    }, [plural, slots, t]);

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
