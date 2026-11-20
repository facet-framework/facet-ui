import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Icon, type IconName } from "../../primitives/Icon";
import { Badge, Button, Chip, IconButton, Kbd, SearchField } from "../../primitives/controls";
import { EmptyState } from "../../primitives/display";
import { Menu, Sheet } from "../../primitives/overlay";
import type { TextKey } from "../../i18n/en";
import { useText } from "../../i18n/TextProvider";
import { Inline, Markdown, noop } from "./shared";

export type ChatStepVM = {
  label: string;
  detail?: string;
  lines?: string;
  state: "done" | "running" | "failed";
  ms?: number;
};
export type ChatSourceVM = {
  kind: "record" | "file" | "adr";
  ref: string;
  line?: number;
  title?: string;
  excerpt?: string;
};
export type AnswerState = "streaming" | "done" | "stopped" | "failed" | "cut";

export type ChatAnswerVM = {
  markdown: string;
  state: AnswerState;
  steps: ChatStepVM[];
  sources: ChatSourceVM[];
  model?: string;
  seconds?: number;
  error?: string;
};

export type ChatTurnVM = {
  id: string;
  question: string;
  at: string;
  context?: string[];
  answer?: ChatAnswerVM;
};
export type ChatMode = "ask";
export type Continuation = "continued" | "restarted" | "open";

const SOURCE_ICON: Record<ChatSourceVM["kind"], IconName> = {
  record: "records",
  file: "code",
  adr: "book",
};

const SOURCE_KIND: Record<ChatSourceVM["kind"], TextKey | { fixed: string }> = {
  record: { fixed: "Record" },
  file: "d.chat.source.file",
  adr: "d.chat.source.adr",
};

function useSourceKind() {
  const { t } = useText();
  return (kind: ChatSourceVM["kind"]) => {
    const k = SOURCE_KIND[kind];
    return typeof k === "string" ? t(k) : k.fixed;
  };
}

const MODE_KEY: Record<ChatMode, TextKey> = {
  ask: "d.chat.mode.ask",
};
const CONT_KEY: Record<Continuation, TextKey> = {
  continued: "d.chat.cont.continued",
  restarted: "d.chat.cont.restarted",
  open: "d.chat.cont.open",
};

export type ReadingTrailProps = {
  steps: ChatStepVM[];
  open: boolean;
  live?: boolean;
  onToggle?: () => void;
};

export function ReadingTrail({ steps, open, live, onToggle = noop }: ReadingTrailProps) {
  const { t, plural } = useText();
  const done = steps.filter((s) => s.state === "done").length;
  const running = steps.find((s) => s.state === "running");
  return (
    <div className="t-d-trail" data-live={live || undefined}>
      <button type="button" className="t-d-trail__head" aria-expanded={open} onClick={onToggle}>
        <span className="t-d-trail__pulse" aria-hidden="true" />
        <span>{live && running ? `${running.label} …` : plural("d.chat.trailSteps", done)}</span>
        <span className="t-spacer" />
        <Icon name={open ? "chevronDown" : "chevronRight"} size={14} />
      </button>
      {open ? (
        <ol className="t-d-trail__list t-stagger" aria-label={t("d.chat.trail")}>
          {steps.map((s, i) => (
            <li key={i} data-state={s.state}>
              <span className="t-d-trail__mark" aria-hidden="true">
                <Icon
                  name={s.state === "done" ? "check" : s.state === "failed" ? "close" : "search"}
                  size={11}
                />
              </span>
              <span className="t-d-trail__label">{s.label}</span>
              {s.detail ? (
                <span className="t-mono t-d-trail__detail t-ellipsis">{s.detail}</span>
              ) : null}
              {s.lines ? <span className="t-mono t-meta">{s.lines}</span> : null}
              <span className="t-spacer" />
              {s.ms != null ? <span className="t-mono t-meta">{s.ms} ms</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export function SourceCards({
  sources,
  onOpen = noop,
}: {
  sources: ChatSourceVM[];
  onOpen?: (s: ChatSourceVM) => void;
}) {
  const { t } = useText();
  const sourceKind = useSourceKind();
  return (
    <div className="t-d-sources" aria-label={t("d.chat.sources")}>
      {sources.map((s, i) => (
        <button
          key={`${s.ref}${i}`}
          type="button"
          className="t-d-source"
          data-kind={s.kind}
          onClick={() => onOpen(s)}
        >
          <span className="t-d-source__n t-mono">{i + 1}</span>
          <Icon name={SOURCE_ICON[s.kind]} size={14} />
          <span className="t-stack" style={{ gap: 0, minWidth: 0 }}>
            <span className="t-mono t-wrap">
              {s.ref}
              {s.line ? <span className="t-muted">:{s.line}</span> : null}
            </span>
            <span className="t-meta t-wrap">{s.title ?? sourceKind(s.kind)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export type AnswerActionsProps = {
  copied?: "text" | "markdown" | "sources" | null;
  onCopy?: (what: "text" | "markdown" | "sources") => void;
  onRetry?: () => void;
};

function AnswerActions({ copied, onCopy = noop, onRetry = noop }: AnswerActionsProps) {
  const { t } = useText();
  const copy = (what: "text" | "markdown" | "sources", label: string) => (
    <Button
      size="small"
      variant="quiet"
      icon={copied === what ? "check" : "copy"}
      onClick={() => onCopy(what)}
    >
      {copied === what ? t("d.chat.copied") : label}
    </Button>
  );
  return (
    <div className="t-d-answer__actions" role="toolbar" aria-label={t("d.chat.answer")}>
      {copy("text", t("d.chat.copy"))}
      {copy("markdown", "Markdown")}
      {copy("sources", t("d.chat.sources"))}
      <Button size="small" variant="quiet" icon="refresh" onClick={onRetry}>
        {t("d.chat.askAgain")}
      </Button>
    </div>
  );
}

export type ChatTurnProps = {
  turn: ChatTurnVM;
  trailOpen?: boolean;
  copied?: AnswerActionsProps["copied"];
  copiedCode?: number | null;
  compact?: boolean;
  onToggleTrail?: () => void;
  onCopy?: AnswerActionsProps["onCopy"];
  onCopyCode?: (code: string) => void;
  onRetry?: () => void;
  onContinue?: () => void;
  onSource?: (s: ChatSourceVM) => void;
};

export function ChatTurn({
  turn,
  trailOpen,
  copied,
  copiedCode,
  compact,
  onToggleTrail = noop,
  onCopy,
  onCopyCode,
  onRetry = noop,
  onContinue = noop,
  onSource,
}: ChatTurnProps) {
  const { t, plural } = useText();
  const a = turn.answer;
  const live = a?.state === "streaming";
  const now = a?.steps.find((s) => s.state === "running");
  return (
    <article
      className="t-d-turn t-anim-rise"
      data-compact={compact || undefined}
      aria-label={turn.question}
    >
      <div className="t-d-question">
        <span className="t-d-question__text">{turn.question}</span>
        <span className="t-meta">{turn.at}</span>
        {turn.context?.length ? (
          <span className="t-row t-row--wrap" style={{ gap: 4 }}>
            {turn.context.map((c) => (
              <Badge key={c} plain>
                {c}
              </Badge>
            ))}
          </span>
        ) : null}
      </div>
      {a ? (
        <div className="t-d-answer" data-state={a.state}>
          <div className="t-d-answer__mark" aria-hidden="true">
            <Icon name="spark" size={14} />
          </div>
          <div className="t-stack" style={{ gap: 12, minWidth: 0 }}>
            {live ? (
              <div className="t-d-livebar" role="status" data-testid="answer-live">
                <span className="t-d-trail__pulse" aria-hidden="true" />
                <strong>{t("d.chat.answering")}</strong>
                <span className="t-mono t-meta">{a.seconds ?? 0} s</span>
                {now ? (
                  <span className="t-meta t-ellipsis">
                    · {now.label}
                    {now.detail ? <span className="t-mono"> {now.detail}</span> : null}
                  </span>
                ) : null}
              </div>
            ) : null}
            {a.steps.length ? (
              <ReadingTrail
                steps={a.steps}
                open={trailOpen ?? live}
                live={live}
                onToggle={onToggleTrail}
              />
            ) : null}
            {a.markdown ? (
              <div className="t-d-answer__body" data-live={live || undefined}>
                <Markdown source={a.markdown} onCopyCode={onCopyCode} copiedCode={copiedCode} />
              </div>
            ) : null}
            {a.state === "cut" ? (
              <div className="t-d-banner" data-tone="warn" role="status">
                <Icon name="pause" size={16} />
                <div className="t-stack" style={{ gap: 2 }}>
                  <strong>{t("d.chat.cut")}</strong>
                  <span className="t-meta">{t("d.chat.cutBody")}</span>
                </div>
                <span className="t-spacer" />
                <Button size="small" variant="primary" icon="play" onClick={onContinue}>
                  {t("d.chat.continue")}
                </Button>
              </div>
            ) : null}
            {a.state === "stopped" ? (
              <div className="t-d-banner" data-tone="neutral" role="status">
                <Icon name="stop" size={16} />
                <span>{t("d.chat.stopped", { seconds: a.seconds ?? "—" })}</span>
                <span className="t-spacer" />
                <Button size="small" icon="refresh" onClick={onRetry}>
                  {t("d.chat.askAgain")}
                </Button>
              </div>
            ) : null}
            {a.state === "failed" ? (
              <div className="t-d-banner" data-tone="bad" role="alert">
                <Icon name="error" size={16} />
                <div className="t-stack" style={{ gap: 2 }}>
                  <strong>{t("d.chat.noAnswer")}</strong>
                  <span className="t-meta">{a.error ?? t("d.chat.hostClosed")}</span>
                </div>
                <span className="t-spacer" />
                <Button size="small" icon="refresh" onClick={onRetry}>
                  {t("d.chat.retry")}
                </Button>
              </div>
            ) : null}
            {a.sources.length && !live ? (
              <SourceCards sources={a.sources} onOpen={onSource} />
            ) : null}
            {a.state === "done" ? (
              <>
                <AnswerActions copied={copied} onCopy={onCopy} onRetry={onRetry} />
                <span className="t-meta t-d-answer__foot">
                  {a.model ? <span className="t-mono">{a.model}</span> : null}
                  {[
                    a.model ? "" : null,
                    a.seconds != null ? `${a.seconds} s` : null,
                    plural("d.chat.footSources", a.sources.length),
                    plural("d.chat.steps", a.steps.length),
                  ]
                    .filter((part) => part !== null)
                    .join(" · ")}
                </span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export type SlashCommand = { cmd: string; label: string; hint: string };

export type ComposerProps = {
  value: string;
  mode: ChatMode;
  model: string;
  models?: string[];
  context: { key: string; label: string; icon: IconName }[];
  running?: boolean;
  disabled?: boolean;
  slash?: { items: SlashCommand[]; active: number } | null;
  compact?: boolean;

  enterSends?: boolean;

  modelsOpen?: boolean;
  onChange?: (v: string) => void;
  onSend?: () => void;
  onStop?: () => void;
  onMode?: (m: ChatMode) => void;

  onModel?: () => void;

  onPickModel?: (index: number) => void;
  onRemoveContext?: (key: string) => void;
  onSlash?: (cmd: string) => void;

  onSlashActive?: (index: number) => void;

  onSlashClose?: () => void;
};

export function Composer({
  value,
  mode,
  model,
  models,
  context,
  running,
  disabled,
  slash,
  compact,
  enterSends = true,
  modelsOpen,
  onChange = noop,
  onSend = noop,
  onStop = noop,
  onMode = noop,
  onModel = noop,
  onPickModel = noop,
  onRemoveContext = noop,
  onSlash = noop,
  onSlashActive = noop,
  onSlashClose = noop,
}: ComposerProps) {
  const { t } = useText();
  const slashOpen = !!slash && slash.items.length > 0;
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (slashOpen) {
      const n = slash.items.length;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        onSlashActive((slash.active + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onSlash(slash.items[Math.min(slash.active, n - 1)].cmd);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onSlashClose();
        return;
      }
    }
    if (e.key !== "Enter" || !enterSends || e.shiftKey) return;
    e.preventDefault();
    if (e.altKey) {
      const el = e.currentTarget;
      el.setRangeText("\n", el.selectionStart, el.selectionEnd, "end");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    if (!running && !disabled && value.trim()) onSend();
  };
  return (
    <div className="t-d-composer" data-compact={compact || undefined} data-mode={mode}>
      {slashOpen ? (
        <Menu
          label={t("d.chat.commands")}
          className="t-d-slash"
          header={<span className="t-menu-label">{t("d.chat.commands")}</span>}
          groups={[
            {
              items: slash.items.map((s, i) => ({
                key: s.cmd,
                label: <span className="t-mono">{s.cmd}</span>,
                sub: s.label,
                meta: s.hint,
                active: i === slash.active,
                current: i === slash.active,
                onSelect: () => onSlash(s.cmd),
              })),
            },
          ]}
        />
      ) : null}
      {context.length ? (
        <div className="t-row t-row--wrap" style={{ gap: 6 }} aria-label={t("d.chat.context")}>
          {context.map((c) => (
            <Chip key={c.key} icon={c.icon} mono onRemove={() => onRemoveContext(c.key)}>
              {c.label}
            </Chip>
          ))}
        </div>
      ) : null}
      <textarea
        className="t-d-composer__input"
        aria-label={t("d.chat.question")}
        rows={compact ? 2 : 3}
        placeholder={t("d.chat.placeholder")}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="t-d-composer__bar">
        <div className="t-d-modes" role="radiogroup" aria-label={t("d.chat.mode")}>
          {(["ask"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              className="t-d-mode"
              disabled={disabled}
              onClick={() => onMode(m)}
            >
              <Icon name={m === "ask" ? "chat" : "edit"} size={12} />
              {t(MODE_KEY[m])}
            </button>
          ))}
        </div>
        <span className="t-d-model__wrap">
          <button
            type="button"
            className="t-d-model"
            onClick={onModel}
            disabled={disabled}
            aria-label={t("d.chat.model", { model })}
            aria-haspopup="menu"
            aria-expanded={!!modelsOpen}
          >
            <span className="t-mono">{model}</span>
            <Icon name="chevronDown" size={12} />
          </button>
          {modelsOpen && models?.length ? (
            <Menu
              label={t("d.chat.models")}
              className="t-d-model__menu"
              groups={[
                {
                  items: models.map((m, i) => ({
                    key: `${i}-${m}`,
                    label: <span className="t-mono">{m}</span>,
                    current: m === model,
                    icon: m === model ? "check" : undefined,
                    onSelect: () => onPickModel(i),
                  })),
                },
              ]}
            />
          ) : null}
        </span>
        <span className="t-spacer" />
        {compact || !enterSends ? null : (
          <span className="t-meta t-hide-mobile">
            <Kbd>↵</Kbd> {t("d.chat.send")} · <Kbd>⇧↵</Kbd> {t("d.chat.newline")}
          </span>
        )}
        {running ? (
          <Button variant="danger" icon="stop" onClick={onStop} aria-label={t("d.chat.stop")} />
        ) : (
          <Button
            variant="primary"
            icon="send"
            disabled={disabled || !value.trim()}
            onClick={onSend}
            aria-label={t("d.chat.sendLabel")}
          />
        )}
      </div>
    </div>
  );
}

export function ChatSignIn({
  command = "claude login",
  onCheck = noop,
  onCopy = noop,
}: {
  command?: string;
  onCheck?: () => void;
  onCopy?: () => void;
}) {
  const { t } = useText();
  return (
    <div className="t-d-signin" role="status">
      <span className="t-d-signin__art" aria-hidden="true">
        <Icon name="lock" size={28} />
      </span>
      <strong className="t-h3">{t("d.chat.signin.title")}</strong>
      <p className="t-ink2">{t("d.chat.signin.body")}</p>
      <div className="t-d-cmd">
        <span className="t-mono">$ {command}</span>
        <span className="t-spacer" />
        <IconButton icon="copy" label={t("d.chat.signin.copy")} size="small" onClick={onCopy} />
      </div>
      <Button variant="primary" icon="refresh" onClick={onCheck}>
        {t("d.chat.signin.check")}
      </Button>
    </div>
  );
}

export function ChatPill({
  running,
  label,
  step,
  mobile,
  onOpen = noop,
}: {
  running?: boolean;
  label?: string;
  step?: string;
  mobile?: boolean;
  onOpen?: () => void;
}) {
  const { t } = useText();
  return (
    <button
      type="button"
      className="t-d-pill t-anim-pop"
      data-running={running || undefined}
      data-mobile={mobile || undefined}
      onClick={onOpen}
    >
      <span className="t-d-pill__orb" aria-hidden="true">
        <Icon name="spark" size={16} />
      </span>
      <span className="t-stack" style={{ gap: 0, minWidth: 0 }}>
        <span className="t-d-pill__label">
          {running ? t("d.chat.answering") : (label ?? t("d.chat.ask"))}
        </span>
        {running && step ? <span className="t-meta t-ellipsis">{step}</span> : null}
      </span>
      {running ? null : <Kbd>?</Kbd>}
    </button>
  );
}

export type ChatDockProps = {
  title: string;
  continuation?: Continuation;
  turns: ChatTurnVM[];
  composer: ComposerProps;
  suggestions?: string[];
  roleName?: string;
  signedIn?: boolean;
  hostError?: string | null;
  mobile?: boolean;
  trailOpen?: Record<string, boolean>;
  copied?: { turn: string; what: "text" | "markdown" | "sources" } | null;
  onClose?: () => void;
  onExpand?: () => void;
  onNew?: () => void;
  onSuggestion?: (q: string) => void;
  onToggleTrail?: (turn: string) => void;
  onCopy?: (turn: string, what: "text" | "markdown" | "sources") => void;
  onRetry?: (turn: string) => void;
  onContinue?: (turn: string) => void;
  onSource?: (s: ChatSourceVM) => void;
};

const CONT_TONE: Record<Continuation, "ok" | "plan" | "neutral"> = {
  continued: "ok",
  restarted: "plan",
  open: "neutral",
};

function Conversation({
  turns,
  suggestions,
  roleName,
  signedIn,
  hostError,
  trailOpen,
  copied,
  compact,
  onSuggestion = noop,
  onToggleTrail = noop,
  onCopy = noop,
  onRetry = noop,
  onContinue = noop,
  onSource,
}: Omit<ChatDockProps, "title" | "composer"> & { compact?: boolean }) {
  const { t } = useText();
  if (signedIn === false) return <ChatSignIn />;
  if (hostError) {
    return (
      <EmptyState
        tone="error"
        icon="error"
        title={t("d.chat.hostError")}
        body={<Inline text={hostError} />}
        action={
          <Button icon="refresh" onClick={() => onRetry("")}>
            {t("d.chat.reconnect")}
          </Button>
        }
      />
    );
  }
  if (!turns.length) {
    return (
      <div className="t-d-welcome t-stagger">
        <span className="t-d-welcome__orb" aria-hidden="true">
          <Icon name="spark" size={22} />
        </span>
        <strong className="t-h2">{t("d.chat.welcome")}</strong>
        <span className="t-meta">
          {roleName ? t("d.chat.suggestionsFor", { role: roleName }) : ""}
        </span>
        <div className="t-d-suggest">
          {(suggestions ?? []).map((q) => (
            <button
              key={q}
              type="button"
              className="t-d-suggest__item t-interactive"
              onClick={() => onSuggestion(q)}
            >
              <Icon name="chat" size={14} />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="t-d-turns">
      {turns.map((turn) => (
        <ChatTurn
          key={turn.id}
          turn={turn}
          compact={compact}
          trailOpen={trailOpen?.[turn.id]}
          copied={copied?.turn === turn.id ? copied.what : null}
          onToggleTrail={() => onToggleTrail(turn.id)}
          onCopy={(w) => onCopy(turn.id, w)}
          onRetry={() => onRetry(turn.id)}
          onContinue={() => onContinue(turn.id)}
          onSource={onSource}
        />
      ))}
    </div>
  );
}

export function ChatDock(props: ChatDockProps) {
  const {
    title,
    continuation,
    composer,
    mobile,
    signedIn,
    onClose = noop,
    onExpand = noop,
    onNew = noop,
  } = props;
  const { t } = useText();
  const body = useRef<HTMLDivElement>(null);
  const live = props.turns.some((turn) => turn.answer?.state === "streaming");

  useLayoutEffect(() => {
    const el = body.current;
    const last = el?.querySelector<HTMLElement>(".t-d-turn:last-child");
    if (el && last && live) el.scrollTop = last.offsetTop - 8;
  }, [live, props.turns.length]);
  return (
    <aside className="t-d-dock" data-mobile={mobile || undefined} aria-label={t("d.chat.ask")}>
      {mobile ? <div className="t-sheet__grip" aria-hidden="true" /> : null}
      <header className="t-d-dock__head">
        <span className="t-d-dock__orb" aria-hidden="true">
          <Icon name="spark" size={14} />
        </span>
        <div className="t-stack" style={{ gap: 0, minWidth: 0, flex: 1 }}>
          <span className="t-h3 t-wrap">{title}</span>
          {continuation ? (
            <span className="t-meta t-row" style={{ gap: 6 }}>
              <span className={`t-dot t-dot--${CONT_TONE[continuation]}`} />{" "}
              {t(CONT_KEY[continuation])}
            </span>
          ) : null}
        </div>
        <IconButton icon="plus" label={t("d.chat.new")} size="small" onClick={onNew} />
        <IconButton icon="expand" label={t("d.chat.fullscreen")} size="small" onClick={onExpand} />
        <IconButton icon="close" label={t("d.chat.close")} size="small" onClick={onClose} />
      </header>
      <div className="t-d-dock__body" ref={body} data-live={live || undefined}>
        <Conversation {...props} compact />
      </div>
      {signedIn === false || props.hostError ? null : (
        <div className="t-d-dock__foot">
          <Composer {...composer} compact />
        </div>
      )}
    </aside>
  );
}

export type ChatSessionVM = {
  id: string;
  title: string;

  when?: string;
  rounds: number;
  mode: ChatMode;
  pinned?: boolean;

  continuation?: Continuation;
  running?: boolean;
};

export type ChatFullProps = Omit<ChatDockProps, "onExpand"> & {
  sessions: ChatSessionVM[];
  currentId: string;
  query: string;
  renaming?: { id: string; value: string; error?: string } | null;
  menuFor?: string | null;
  sessionsOpen?: boolean;
  onQuery?: (q: string) => void;
  onPick?: (id: string) => void;
  onMenu?: (id: string | null) => void;
  onPin?: (id: string) => void;
  onRename?: (id: string) => void;
  onRenameValue?: (v: string) => void;
  onRenameSave?: () => void;
  onRenameCancel?: () => void;
  onDelete?: (id: string) => void;
  onSessions?: () => void;
  onShrink?: () => void;
};

function SessionList({
  sessions,
  currentId,
  query,
  renaming,
  menuFor,
  onQuery = noop,
  onPick = noop,
  onMenu = noop,
  onPin = noop,
  onRename = noop,
  onRenameValue = noop,
  onRenameSave = noop,
  onRenameCancel = noop,
  onDelete = noop,
  onNew = noop,
}: ChatFullProps) {
  const { t, plural } = useText();
  const pinned = sessions.filter((s) => s.pinned);
  const rest = sessions.filter((s) => !s.pinned);
  const group = (label: string, list: ChatSessionVM[]): ReactNode =>
    list.length ? (
      <section key={label} className="t-stack" style={{ gap: 2 }}>
        <span className="t-menu-label">
          {label} · {list.length}
        </span>
        {list.map((s) =>
          renaming?.id === s.id ? (
            <form
              key={s.id}
              className="t-d-rename"
              aria-label={t("d.chat.renameSession")}
              onSubmit={(e) => {
                e.preventDefault();
                onRenameSave();
              }}
            >
              <input
                className="t-input"
                aria-label={t("d.chat.newTitle")}
                aria-invalid={!!renaming.error}
                value={renaming.value}
                onChange={(e) => onRenameValue(e.target.value)}
              />
              {renaming.error ? <span className="t-field__error">{renaming.error}</span> : null}
              <div className="t-row" style={{ gap: 6 }}>
                <Button size="small" type="submit" variant="primary" disabled={!!renaming.error}>
                  {t("d.chat.save")}
                </Button>
                <Button size="small" variant="quiet" onClick={onRenameCancel}>
                  {t("d.chat.cancel")}
                </Button>
              </div>
            </form>
          ) : (
            <div
              key={s.id}
              className="t-d-session"
              aria-current={s.id === currentId ? "true" : undefined}
            >
              <button type="button" className="t-d-session__main" onClick={() => onPick(s.id)}>
                <span className="t-row" style={{ gap: 6, minWidth: 0 }}>
                  {s.running ? (
                    <span className="t-d-trail__pulse" aria-label={t("d.chat.running")} />
                  ) : null}
                  <span className="t-wrap">{s.title}</span>
                </span>
                <span className="t-meta">
                  {[
                    s.when,
                    plural("d.chat.rounds", s.rounds),
                    s.continuation ? t(CONT_KEY[s.continuation]) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
              <IconButton
                icon="more"
                label={t("d.chat.actionsFor", { title: s.title })}
                size="small"
                variant="quiet"
                onClick={() => onMenu(menuFor === s.id ? null : s.id)}
              />
              {menuFor === s.id ? (
                <Menu
                  label={t("d.chat.session")}
                  className="t-d-session__menu"
                  groups={[
                    {
                      items: [
                        {
                          key: "pin",
                          label: s.pinned ? t("d.chat.unpin") : t("d.chat.pin"),
                          icon: "pin",
                          onSelect: () => onPin(s.id),
                        },
                        {
                          key: "rename",
                          label: t("d.chat.rename"),
                          icon: "edit",
                          onSelect: () => onRename(s.id),
                        },
                        {
                          key: "delete",
                          label: t("d.chat.delete"),
                          icon: "trash",
                          onSelect: () => onDelete(s.id),
                        },
                      ],
                    },
                  ]}
                />
              ) : null}
            </div>
          ),
        )}
      </section>
    ) : null;
  return (
    <nav className="t-d-sessions" aria-label={t("d.chat.sessions")}>
      <Button variant="primary" icon="plus" onClick={onNew}>
        {t("d.chat.new")}
      </Button>
      <SearchField
        label={t("d.chat.searchSessions")}
        value={query}
        placeholder={t("d.chat.sessionsPlaceholder")}
        onChange={onQuery}
      />
      <div className="t-d-sessions__list">
        {group(t("d.chat.pinned"), pinned)}
        {group(t("d.chat.history"), rest)}
        {!sessions.length ? (
          <span className="t-meta">{t("d.chat.noSession", { query })}</span>
        ) : null}
      </div>
    </nav>
  );
}

export function ChatFull(props: ChatFullProps) {
  const {
    title,
    continuation,
    composer,
    turns,
    mobile,
    sessionsOpen,
    signedIn,
    onSessions = noop,
    onShrink = noop,
    onClose = noop,
    onSource = noop,
  } = props;
  const { t, plural } = useText();
  const sourceKind = useSourceKind();
  const allSources = turns
    .flatMap((turn) => turn.answer?.sources ?? [])
    .filter((s, i, all) => all.findIndex((o) => o.ref === s.ref && o.line === s.line) === i);
  const list = <SessionList {...props} />;
  return (
    <section className="t-d-full" data-mobile={mobile || undefined} aria-label={t("d.chat.ask")}>
      {mobile ? null : <aside className="t-d-full__left">{list}</aside>}
      <div className="t-d-full__main">
        <header className="t-d-full__head">
          {mobile ? (
            <IconButton icon="menu" label={t("d.chat.sessions")} onClick={onSessions} />
          ) : null}
          <span className="t-d-dock__orb" aria-hidden="true">
            <Icon name="spark" size={14} />
          </span>
          <div className="t-stack" style={{ gap: 0, minWidth: 0, flex: 1 }}>
            <span className="t-h3 t-wrap">{title}</span>
            {continuation ? (
              <span className="t-meta t-row" style={{ gap: 6 }}>
                <span className={`t-dot t-dot--${CONT_TONE[continuation]}`} />{" "}
                {t(CONT_KEY[continuation])} · {plural("d.chat.rounds", turns.length)}
              </span>
            ) : null}
          </div>
          <IconButton icon="collapse" label={t("d.chat.asDock")} onClick={onShrink} />
          <IconButton icon="close" label={t("d.chat.close")} onClick={onClose} />
        </header>
        <div className="t-d-full__scroll">
          <div className="t-d-full__col">
            <Conversation {...props} />
          </div>
        </div>
        {signedIn === false ? null : (
          <div className="t-d-full__foot">
            <div className="t-d-full__col">
              <Composer {...composer} />
            </div>
          </div>
        )}
      </div>
      {mobile ? null : (
        <aside className="t-d-full__right" aria-label={t("d.chat.sessionSources")}>
          <span className="t-label">{t("d.chat.sourcesCount", { count: allSources.length })}</span>
          {allSources.map((s, i) => (
            <button
              key={`${s.ref}${i}`}
              type="button"
              className="t-d-srccard"
              onClick={() => onSource(s)}
            >
              <span className="t-row" style={{ gap: 6 }}>
                <Icon name={SOURCE_ICON[s.kind]} size={14} />
                <span className="t-meta">{sourceKind(s.kind)}</span>
                <span className="t-spacer" />
                <span className="t-d-source__n t-mono">{i + 1}</span>
              </span>
              <span className="t-mono t-wrap">
                {s.ref}
                {s.line ? `:${s.line}` : ""}
              </span>
              {s.excerpt ? <code className="t-d-srccard__excerpt">{s.excerpt}</code> : null}
            </button>
          ))}
          {!allSources.length ? <span className="t-meta">{t("d.chat.noSource")}</span> : null}
        </aside>
      )}
      {mobile ? (
        <Sheet
          open={!!sessionsOpen}
          side="bottom"
          title={t("d.chat.sessions")}
          onClose={onSessions}
        >
          {list}
        </Sheet>
      ) : null}
    </section>
  );
}
