import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { CompanionPlan } from "../../../core";
import { color, font, fontSize, MEANING_COLOR } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { CompanionMessage, CompanionProps } from "./Companion";

/** An exchange: either a question or a finished answer plan. */
export type CompanionEntry =
  { kind: "ask"; id: string; text: string } | { kind: "answer"; id: string; plan: CompanionPlan };

export type WithCompanionProps = Omit<
  CompanionProps,
  | keyof StyleKeys
  | "messages"
  | "showIntro"
  | "clearLabel"
  | "title"
  | "placeholder"
  | "sendLabel"
  | "reads"
> & {
  entries: CompanionEntry[];
  /** The files of the running answer, up to the current step. */
  reads?: string[];
  onAsk: (question: string) => void;
  onOpenRecord: (id: string) => void;
  onOpenSection: (key: string) => void;
  style?: CSSProperties;
};

type StyleKeys = {
  containerStyle: unknown;
  headStyle: unknown;
  headRowStyle: unknown;
  markStyle: unknown;
  titleStyle: unknown;
  actionStyle: unknown;
  scopeStyle: unknown;
  scrollStyle: unknown;
  introStyle: unknown;
  messageStyle: unknown;
  askStyle: unknown;
  answerStyle: unknown;
  factsStyle: unknown;
  factLabelStyle: unknown;
  readsHeadStyle: unknown;
  sourceRowStyle: unknown;
  sourceStyle: unknown;
  sourceOpenStyle: unknown;
  jumpRowStyle: unknown;
  jumpStyle: unknown;
  sectionJumpStyle: unknown;
  followListStyle: unknown;
  followStyle: unknown;
  busyStyle: unknown;
  stopStyle: unknown;
  readStyle: unknown;
  suggestListStyle: unknown;
  suggestStyle: unknown;
  composerStyle: unknown;
  inputRowStyle: unknown;
  inputStyle: unknown;
  sendStyle: unknown;
  footStyle: unknown;
};

/** Puts the exchange into rows and the send button into its state. */
export function withCompanionLogic(Component: ComponentType<CompanionProps>) {
  const Wrapped = ({
    entries,
    reads = [],
    onAsk,
    onOpenRecord,
    onOpenSection,
    draft,
    busy,
    style,
    ...rest
  }: WithCompanionProps) => {
    const { t } = useText();
    const messages = useMemo<CompanionMessage[]>(
      () =>
        entries.map((entry) =>
          entry.kind === "ask"
            ? {
                key: entry.id,
                fromUser: true,
                text: entry.text,
                facts: [],
                sources: [],
                follow: [],
                sectionLabel: "",
              }
            : {
                key: entry.id,
                fromUser: false,
                text: entry.plan.text,
                facts: entry.plan.facts.map((item) => ({
                  label: item.label,
                  value: item.value,
                  valueStyle: factValueStyle(item.meaning),
                })),
                sources: entry.plan.sources.slice(0, 6).map((source, index) => ({
                  key: `${entry.id}-${index}`,
                  text: source.text,
                  openLabel: source.recordId ? "Record" : "",
                  onOpen: source.recordId
                    ? () => onOpenRecord(source.recordId as string)
                    : undefined,
                })),
                follow: entry.plan.follow.map((question, index) => ({
                  key: `${entry.id}-f${index}`,
                  text: question,
                  onAsk: () => onAsk(question),
                })),
                onOpen: entry.plan.openId
                  ? () => onOpenRecord(entry.plan.openId as string)
                  : undefined,
                onSection: entry.plan.section
                  ? () => onOpenSection(entry.plan.section as string)
                  : undefined,
                sectionLabel: t("elements.companion.inRegister"),
              },
        ),
      [entries, onAsk, onOpenRecord, onOpenSection, t],
    );

    // Not tied to '!busy': sending during a running answer is a valid move that
    // appends the question. A button that stayed grey for it would look as if
    // it did nothing.
    const ready = Boolean(draft.trim());

    const containerStyle = useMemo<CSSProperties>(
      () => ({ ...CONTAINER_STYLE, ...style }),
      [style],
    );

    return (
      <Component
        containerStyle={containerStyle}
        headStyle={HEAD_STYLE}
        headRowStyle={HEAD_ROW_STYLE}
        markStyle={MARK_STYLE}
        titleStyle={TITLE_STYLE}
        actionStyle={ACTION_STYLE}
        scopeStyle={SCOPE_STYLE}
        scrollStyle={SCROLL_STYLE}
        introStyle={INTRO_STYLE}
        messageStyle={MESSAGE_STYLE}
        askStyle={ASK_STYLE}
        answerStyle={ANSWER_STYLE}
        factsStyle={FACTS_STYLE}
        factLabelStyle={FACT_LABEL_STYLE}
        readsHeadStyle={READS_HEAD_STYLE}
        sourceRowStyle={SOURCE_ROW_STYLE}
        sourceStyle={SOURCE_STYLE}
        sourceOpenStyle={SOURCE_OPEN_STYLE}
        jumpRowStyle={JUMP_ROW_STYLE}
        jumpStyle={JUMP_STYLE}
        sectionJumpStyle={SECTION_JUMP_STYLE}
        followListStyle={FOLLOW_LIST_STYLE}
        followStyle={FOLLOW_STYLE}
        busyStyle={BUSY_STYLE}
        stopStyle={STOP_STYLE}
        readStyle={readStyle}
        suggestListStyle={SUGGEST_LIST_STYLE}
        suggestStyle={SUGGEST_STYLE}
        composerStyle={COMPOSER_STYLE}
        inputRowStyle={INPUT_ROW_STYLE}
        inputStyle={INPUT_STYLE}
        sendStyle={sendStyle(ready)}
        footStyle={FOOT_STYLE}
        title="Companion"
        clearLabel={entries.length ? t("elements.companion.clear") : ""}
        showIntro={!entries.length}
        messages={messages}
        reads={reads}
        busy={busy}
        draft={draft}
        placeholder={t("elements.companion.placeholder")}
        sendLabel={t("elements.companion.send")}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withCompanionLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}

function factValueStyle(meaning: "neutral" | "signal" | "due"): CSSProperties {
  return {
    fontFamily: font.sans,
    fontSize: fontSize.base,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
    color: meaning === "neutral" ? color.ink : MEANING_COLOR[meaning],
  };
}

/** The most recently read line carries colour, the previous ones are done. */
function readStyle(current: boolean): CSSProperties {
  return {
    fontFamily: font.mono,
    fontSize: fontSize.caption,
    lineHeight: 1.9,
    color: current ? color.signal : color.faint,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

const CONTAINER_STYLE: CSSProperties = {
  width: 428,
  minWidth: 352,
  flexShrink: 1,
  borderLeft: `1px solid ${color.line2}`,
  background: color.surface,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

const HEAD_STYLE: CSSProperties = {
  flexShrink: 0,
  padding: "14px 20px 12px",
  borderBottom: `1px solid ${color.line2}`,
  background: color.tint,
};

const HEAD_ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 12,
  marginBottom: 8,
};

const MARK_STYLE: CSSProperties = {
  width: 6,
  height: 6,
  background: color.signal,
  display: "block",
  flexShrink: 0,
};

const TITLE_STYLE: CSSProperties = {
  fontFamily: font.sans,
  fontSize: fontSize.base,
  color: color.ink,
  whiteSpace: "nowrap",
};

const ACTION_STYLE: CSSProperties = {
  appearance: "none",
  background: "none",
  border: "none",
  padding: 0,
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  color: color.dim,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const SCOPE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  color: color.dim,
  lineHeight: 1.7,
  whiteSpace: "pre-line",
};

const SCROLL_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "16px 20px 20px",
};

const INTRO_STYLE: CSSProperties = {
  margin: "0 0 20px",
  fontFamily: font.sans,
  fontSize: fontSize.base,
  lineHeight: 1.62,
  color: color.soft,
};

const MESSAGE_STYLE: CSSProperties = { marginBottom: 22 };

const ASK_STYLE: CSSProperties = {
  margin: 0,
  borderLeft: `2px solid ${color.signal}`,
  padding: "2px 0 2px 14px",
  fontFamily: font.sans,
  fontSize: fontSize.base,
  lineHeight: 1.55,
  color: color.ink,
};

const ANSWER_STYLE: CSSProperties = {
  margin: "0 0 14px",
  fontFamily: font.sans,
  fontSize: fontSize.base,
  lineHeight: 1.66,
  color: color.soft,
  whiteSpace: "pre-line",
};

const FACTS_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0 26px",
  marginBottom: 12,
};

const FACT_LABEL_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  letterSpacing: "0.13em",
  color: color.dim,
  marginBottom: 3,
  whiteSpace: "nowrap",
};

const READS_HEAD_STYLE: CSSProperties = {
  margin: "0 0 6px",
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  letterSpacing: "0.14em",
  color: color.faint,
};

const SOURCE_ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 10,
  padding: "3px 0",
  minWidth: 0,
};

const SOURCE_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.caption,
  color: color.soft,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  minWidth: 0,
};

const SOURCE_OPEN_STYLE: CSSProperties = {
  appearance: "none",
  background: "none",
  border: "none",
  padding: 0,
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  color: color.signal,
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const JUMP_ROW_STYLE: CSSProperties = {
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
  marginTop: 14,
};

const JUMP_STYLE: CSSProperties = {
  appearance: "none",
  background: "none",
  border: "none",
  padding: 0,
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  letterSpacing: "0.12em",
  color: color.signal,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const SECTION_JUMP_STYLE: CSSProperties = { ...JUMP_STYLE, color: color.dim };

const FOLLOW_LIST_STYLE: CSSProperties = {
  marginTop: 14,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "flex-start",
};

const FOLLOW_STYLE: CSSProperties = {
  appearance: "none",
  background: "none",
  border: "none",
  borderBottom: `1px solid ${color.signalMid}`,
  padding: 0,
  fontFamily: font.sans,
  fontSize: fontSize.meta,
  color: color.signal,
  cursor: "pointer",
  textAlign: "left",
};

const BUSY_STYLE: CSSProperties = { marginBottom: 20 };

const STOP_STYLE: CSSProperties = {
  appearance: "none",
  border: `1px solid ${color.line2}`,
  borderRadius: 0,
  background: color.paper,
  padding: "3px 10px",
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  letterSpacing: "0.08em",
  color: color.dim,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const SUGGEST_LIST_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-start",
};

const SUGGEST_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 30,
  padding: "5px 11px",
  border: `1px solid ${color.line2}`,
  borderRadius: 0,
  background: color.paper,
  fontFamily: font.sans,
  fontSize: fontSize.meta,
  color: color.soft,
  cursor: "pointer",
  textAlign: "left",
};

const COMPOSER_STYLE: CSSProperties = {
  flexShrink: 0,
  borderTop: `1px solid ${color.line2}`,
  background: color.tint,
  padding: "12px 20px",
};

const INPUT_ROW_STYLE: CSSProperties = { display: "flex", gap: 0 };

const INPUT_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 38,
  background: color.surface,
  border: `1px solid ${color.line2}`,
  borderRight: 0,
  borderRadius: 0,
  color: color.ink,
  fontFamily: font.sans,
  fontSize: fontSize.body,
  padding: "0 12px",
  outline: "none",
};

function sendStyle(ready: boolean): CSSProperties {
  return {
    height: 38,
    padding: "0 16px",
    border: `1px solid ${ready ? color.signal : color.line2}`,
    borderRadius: 0,
    background: ready ? color.signal : color.paper,
    color: ready ? "#ffffff" : color.faint,
    fontFamily: font.sans,
    fontSize: fontSize.body,
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
  };
}

const FOOT_STYLE: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  color: color.faint,
};
