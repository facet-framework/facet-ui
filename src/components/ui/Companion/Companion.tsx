import type { CSSProperties } from "react";
import { useText } from "../../../facet/i18n";
import Mark from "../Mark";
import Markdown from "../Markdown";

/** A passage that was read, shown under an answer. */
export type CompanionSourceView = {
  key: string;
  text: string;
  /** Jump to the detail. Without it the row is only a statement. */
  onOpen?: () => void;
  openLabel: string;
};

export type CompanionMessage = {
  key: string;
  /** The question stands at a mark, the answer stands free. */
  fromUser: boolean;
  text: string;
  facts: { label: string; value: string; valueStyle: CSSProperties }[];
  sources: CompanionSourceView[];
  follow: { key: string; text: string; onAsk: () => void }[];
  onOpen?: () => void;
  onSection?: () => void;
  sectionLabel: string;
};

export type CompanionProps = {
  containerStyle: CSSProperties;
  headStyle: CSSProperties;
  headRowStyle: CSSProperties;
  markStyle: CSSProperties;
  titleStyle: CSSProperties;
  actionStyle: CSSProperties;
  scopeStyle: CSSProperties;
  scrollStyle: CSSProperties;
  introStyle: CSSProperties;
  messageStyle: CSSProperties;
  askStyle: CSSProperties;
  answerStyle: CSSProperties;
  factsStyle: CSSProperties;
  factLabelStyle: CSSProperties;
  readsHeadStyle: CSSProperties;
  sourceRowStyle: CSSProperties;
  sourceStyle: CSSProperties;
  sourceOpenStyle: CSSProperties;
  jumpRowStyle: CSSProperties;
  jumpStyle: CSSProperties;
  sectionJumpStyle: CSSProperties;
  followListStyle: CSSProperties;
  followStyle: CSSProperties;
  busyStyle: CSSProperties;
  stopStyle: CSSProperties;
  readStyle: (current: boolean) => CSSProperties;
  suggestListStyle: CSSProperties;
  suggestStyle: CSSProperties;
  composerStyle: CSSProperties;
  inputRowStyle: CSSProperties;
  inputStyle: CSSProperties;
  sendStyle: CSSProperties;
  footStyle: CSSProperties;

  title: string;
  /** What the companion sees — scope, role, open record. */
  scope: string;
  clearLabel: string;
  onClear: () => void;
  onClose: () => void;
  /** Shown instead of the conversation as long as nothing has been asked. */
  intro: string;
  showIntro: boolean;
  messages: CompanionMessage[];
  /** The files being read right now — the last one is the current one. */
  reads: string[];
  busy: boolean;
  /**
   * What the agent is thinking right now, while it writes it. Empty when it is
   * not thinking or the model does not reveal its thinking.
   */
  thinking?: string;
  /** Counted thinking tokens. Measured, not guessed. */
  thinkingTokens?: number;
  /** Expanded it shows the wording, collapsed only that thinking is going on. */
  thinkingOpen?: boolean;
  onThinkingToggle?: () => void;
  /** The tools that ran: what they are and on what. */
  activity?: { key: string; tool: string; target: string }[];
  /** Does the companion take up the whole screen? */
  fullscreen?: boolean;
  onFullscreen?: () => void;
  /** The models that can be chosen from. */
  models?: { id: string; label: string; note?: string }[];
  model?: string;
  onModel?: (id: string) => void;
  /**
   * A notice that is not an answer: nobody signed in, no agent present.
   * It carries the sentence that fixes it, because an error message without a
   * way out only leaves the reader at a loss.
   */
  notice?: { text: string; hint: string } | null;
  /**
   * Cancels the running answer. Without it there is nothing to cancel — a
   * button without effect would be worse than none.
   */
  onStop?: () => void;
  /**
   * A question asked during the running answer that is waiting. It does not
   * appear as a speech bubble right away, because nobody is answering it yet —
   * first as a notice, then, once the running answer is complete, as a real
   * question.
   */
  queued?: string | null;
  onCancelQueued?: () => void;
  suggestions: { key: string; text: string; onAsk: () => void }[];
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  sendLabel: string;
  /** What stands behind the companion. */
  foot: string;
  scrollRef?: (element: HTMLDivElement | null) => void;
  "data-testid"?: string;
};

/**
 * The companion — a column on the right that answers questions in prose.
 *
 * For every answer it says what it read, and while reading it says so line by
 * line. That is no decoration: information about a repository is only worth
 * as much as the statement of where it comes from.
 *
 * It changes nothing. That is why what lies behind it stands below the input
 * field, and not merely a send button.
 */
export function Companion({
  containerStyle,
  headStyle,
  headRowStyle,
  markStyle,
  titleStyle,
  actionStyle,
  scopeStyle,
  scrollStyle,
  introStyle,
  messageStyle,
  askStyle,
  answerStyle,
  factsStyle,
  factLabelStyle,
  readsHeadStyle,
  sourceRowStyle,
  sourceStyle,
  sourceOpenStyle,
  jumpRowStyle,
  jumpStyle,
  sectionJumpStyle,
  followListStyle,
  followStyle,
  busyStyle,
  stopStyle,
  readStyle,
  suggestListStyle,
  suggestStyle,
  composerStyle,
  inputRowStyle,
  inputStyle,
  sendStyle,
  footStyle,
  title,
  scope,
  clearLabel,
  onClear,
  onClose,
  intro,
  showIntro,
  messages,
  reads,
  busy,
  thinking,
  thinkingTokens,
  thinkingOpen,
  onThinkingToggle,
  activity,
  fullscreen,
  onFullscreen,
  models,
  model,
  onModel,
  notice,
  onStop,
  queued,
  onCancelQueued,
  suggestions,
  draft,
  onDraft,
  onSend,
  placeholder,
  sendLabel,
  foot,
  scrollRef,
  ...rest
}: CompanionProps) {
  const { t } = useText();
  return (
    <aside style={containerStyle} aria-label={title} {...rest}>
      <div style={headStyle}>
        <div style={headRowStyle}>
          <span style={markStyle} aria-hidden="true" />
          <span style={titleStyle}>{title}</span>
          <span style={{ flex: 1 }} />
          {models && models.length && onModel ? (
            <select
              style={actionStyle}
              value={model ?? ""}
              onChange={(event) => onModel(event.target.value)}
              aria-label={t("elements.companion.model")}
              title={
                models.find((entry) => entry.id === (model ?? ""))?.note ??
                t("elements.companion.model")
              }
            >
              {models.map((entry) => (
                <option key={entry.id || "default"} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          ) : null}
          {clearLabel ? (
            <button type="button" style={actionStyle} onClick={onClear}>
              {clearLabel}
            </button>
          ) : null}
          {onFullscreen ? (
            <button
              type="button"
              style={actionStyle}
              onClick={onFullscreen}
              aria-pressed={Boolean(fullscreen)}
            >
              {fullscreen ? t("elements.companion.shrink") : t("elements.companion.fullscreen")}
            </button>
          ) : null}
          <button type="button" style={actionStyle} onClick={onClose}>
            {t("elements.companion.close")}
          </button>
        </div>
        <p style={scopeStyle}>{scope}</p>
      </div>

      <div style={scrollStyle} ref={scrollRef} data-companion-log>
        {showIntro ? <p style={introStyle}>{intro}</p> : null}

        {messages.map((message) => (
          <div
            key={message.key}
            style={messageStyle}
            data-message={message.fromUser ? "question" : "answer"}
          >
            {message.fromUser ? (
              <p style={askStyle}>{message.text}</p>
            ) : (
              <>
                {/* Answers come from a model and are written in Markdown —
                    shown as a paragraph, the asterisks would stand on screen
                    too. */}
                <Markdown text={message.text} style={answerStyle} />

                <div style={factsStyle}>
                  {message.facts.map((entry) => (
                    <div key={entry.label}>
                      <div style={factLabelStyle}>{entry.label}</div>
                      <div style={entry.valueStyle}>{entry.value}</div>
                    </div>
                  ))}
                </div>

                {message.sources.length ? (
                  <>
                    <p style={readsHeadStyle}>{t("elements.companion.read")}</p>
                    {message.sources.map((source) => (
                      <div key={source.key} style={sourceRowStyle}>
                        <span style={sourceStyle}>{source.text}</span>
                        {source.onOpen ? (
                          <button type="button" style={sourceOpenStyle} onClick={source.onOpen}>
                            {source.openLabel}
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </>
                ) : null}

                {message.onOpen || message.onSection ? (
                  <div style={jumpRowStyle}>
                    {message.onOpen ? (
                      <button type="button" style={jumpStyle} onClick={message.onOpen}>
                        {t("elements.companion.openDetail")}
                      </button>
                    ) : null}
                    {message.onSection ? (
                      <button type="button" style={sectionJumpStyle} onClick={message.onSection}>
                        {message.sectionLabel}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {message.follow.length ? (
                  <div style={followListStyle}>
                    {message.follow.map((question) => (
                      <button
                        key={question.key}
                        type="button"
                        style={followStyle}
                        onClick={question.onAsk}
                      >
                        {question.text}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        ))}

        {notice ? (
          <div style={busyStyle} role="status" data-companion-notice>
            <p style={readsHeadStyle}>{t("elements.companion.notReady")}</p>
            <p style={answerStyle}>{notice.text}</p>
            {notice.hint ? <p style={introStyle}>{notice.hint}</p> : null}
          </div>
        ) : null}

        {busy ? (
          <div style={busyStyle} aria-live="polite">
            {/*
              The heartbeat is always there, from the first moment on — not
              only once the agent has something to show. Between the click on
              "Ask" and the first line there is a real pause (the process
              is still starting), and until now that pause showed only a
              heading with no lines below it: unchanged, so it looked stuck
              rather than working. `Mark` in the `loading` variant is built
              exactly for this — it runs without an end state as long as
              something is not there yet.
            */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: thinking || (activity && activity.length) || reads.length ? 10 : 0,
              }}
            >
              <Mark variant="loading" size={13} label={t("elements.companion.workingLabel")} />
              <span style={readsHeadStyle}>{t("elements.companion.working")}</span>
              <span style={{ flex: 1 }} />
              {onStop ? (
                <button type="button" style={stopStyle} onClick={onStop} data-companion-stop>
                  {t("elements.companion.stop")}
                </button>
              ) : null}
            </div>

            {thinking ? (
              <div data-companion-thinking>
                <button
                  type="button"
                  style={{ ...readsHeadStyle, background: "none", border: 0, cursor: "pointer" }}
                  onClick={onThinkingToggle}
                  aria-expanded={Boolean(thinkingOpen)}
                >
                  {`${t("elements.companion.thinking")}${thinkingTokens ? ` · ${thinkingTokens}` : ""}`}
                </button>
                {/* Collapsed, the last sentence stays: that thinking is going on
                    shows in the counter, what is being thought only in the wording. */}
                <div style={readStyle(true)}>{thinkingOpen ? thinking : thinking.slice(-160)}</div>
              </div>
            ) : null}

            {activity && activity.length ? (
              <>
                <p style={readsHeadStyle}>{t("elements.companion.tools")}</p>
                {activity.map((entry, index) => (
                  <div key={entry.key} style={readStyle(index === activity.length - 1)}>
                    {entry.tool}
                    {entry.target ? ` · ${entry.target}` : ""}
                  </div>
                ))}
              </>
            ) : reads.length ? (
              <>
                <p style={readsHeadStyle}>{t("elements.companion.reading")}</p>
                {reads.map((read, index) => (
                  <div key={`${read}-${index}`} style={readStyle(index === reads.length - 1)}>
                    {read}
                  </div>
                ))}
              </>
            ) : null}
          </div>
        ) : null}

        {queued ? (
          <div style={busyStyle} data-companion-queued>
            <p style={readsHeadStyle}>{t("elements.companion.waiting")}</p>
            <p style={{ ...readStyle(true), whiteSpace: "normal" }}>{queued}</p>
            {onCancelQueued ? (
              <button type="button" style={stopStyle} onClick={onCancelQueued}>
                {t("elements.companion.withdraw")}
              </button>
            ) : null}
          </div>
        ) : null}

        {suggestions.length && !busy ? (
          <div style={suggestListStyle}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.key}
                type="button"
                style={suggestStyle}
                onClick={suggestion.onAsk}
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <form
        style={composerStyle}
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <div style={inputRowStyle}>
          <input
            style={inputStyle}
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={(event) => {
              // Esc cancels when there is something to cancel — otherwise it
              // does nothing instead of clearing the field. The eyes stay on the
              // keyboard, not on a button somewhere in the history.
              if (event.key === "Escape" && onStop) onStop();
            }}
            placeholder={placeholder}
            aria-label={placeholder}
          />
          <button type="submit" style={sendStyle}>
            {sendLabel}
          </button>
        </div>
        <p style={footStyle}>{foot}</p>
      </form>
    </aside>
  );
}

export default Companion;
