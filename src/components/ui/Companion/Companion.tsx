import { labelText } from "../../../i18n/legacy/labels";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/Companion/Companion";
import type { CSSProperties } from "react";
import Mark from "../Mark";
import Markdown from "../Markdown";

export type CompanionSourceView = {
  key: string;
  text: string;

  onOpen?: () => void;
  openLabel: string;
};

export type CompanionMessage = {
  key: string;

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

  scope: string;
  clearLabel: string;
  onClear: () => void;
  onClose: () => void;

  intro: string;
  showIntro: boolean;
  messages: CompanionMessage[];

  reads: string[];
  busy: boolean;

  thinking?: string;

  thinkingTokens?: number;

  thinkingOpen?: boolean;
  onThinkingToggle?: () => void;

  activity?: { key: string; tool: string; target: string }[];

  fullscreen?: boolean;
  onFullscreen?: () => void;

  models?: { id: string; label: string; note?: string }[];
  model?: string;
  onModel?: (id: string) => void;

  notice?: { text: string; hint: string } | null;

  onStop?: () => void;

  queued?: string | null;
  onCancelQueued?: () => void;
  suggestions: { key: string; text: string; onAsk: () => void }[];
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  sendLabel: string;

  foot: string;
  scrollRef?: (element: HTMLDivElement | null) => void;
  "data-testid"?: string;
};

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
              aria-label={germanLabels.text36}
              title={
                models.find((entry) => entry.id === (model ?? ""))?.note ?? germanLabels.text36
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
              {fullscreen ? labelText.text317 : labelText.text318}
            </button>
          ) : null}
          <button type="button" style={actionStyle} onClick={onClose}>
            {localized.text1}
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
                {}
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
                    <p style={readsHeadStyle}>GELESEN</p>
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
                        {localized.text2}
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
            <p style={readsHeadStyle}>{localized.text3}</p>
            <p style={answerStyle}>{notice.text}</p>
            {notice.hint ? <p style={introStyle}>{notice.hint}</p> : null}
          </div>
        ) : null}

        {busy ? (
          <div style={busyStyle} aria-live="polite">
            {}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: thinking || (activity && activity.length) || reads.length ? 10 : 0,
              }}
            >
              <Mark variant="loading" size={13} label={labelText.text319} />
              <span style={readsHeadStyle}>{labelText.text320}</span>
              <span style={{ flex: 1 }} />
              {onStop ? (
                <button type="button" style={stopStyle} onClick={onStop} data-companion-stop>
                  {germanLabels.text168}
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
                  {`DENKT${thinkingTokens ? ` · ${thinkingTokens}` : ""}`}
                </button>
                {}
                <div style={readStyle(true)}>{thinkingOpen ? thinking : thinking.slice(-160)}</div>
              </div>
            ) : null}

            {activity && activity.length ? (
              <>
                <p style={readsHeadStyle}>{labelText.text321}</p>
                {activity.map((entry, index) => (
                  <div key={entry.key} style={readStyle(index === activity.length - 1)}>
                    {entry.tool}
                    {entry.target ? ` · ${entry.target}` : ""}
                  </div>
                ))}
              </>
            ) : reads.length ? (
              <>
                <p style={readsHeadStyle}>{localized.text4}</p>
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
            <p style={readsHeadStyle}>WARTET</p>
            <p style={{ ...readStyle(true), whiteSpace: "normal" }}>{queued}</p>
            {onCancelQueued ? (
              <button type="button" style={stopStyle} onClick={onCancelQueued}>
                {localized.text5}
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
