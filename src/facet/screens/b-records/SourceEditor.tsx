import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { Button } from "../../primitives/controls";
import { Icon } from "../../primitives/Icon";
import { useText } from "../../i18n/TextProvider";
import { cx } from "./parts";
import { isTagLine, languageOf, tokenize } from "./syntax";

export const CODE_ZOOM_LEVELS = [80, 90, 100, 110, 125, 150, 175, 200] as const;
export const CODE_ZOOM_DEFAULT = 100;

export function codeZoomLevel(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return CODE_ZOOM_DEFAULT;
  return CODE_ZOOM_LEVELS.reduce((best, z) =>
    Math.abs(z - value) < Math.abs(best - value) ? z : best,
  );
}

export function codeFontSize(zoom: number | undefined): string {
  const z = codeZoomLevel(zoom ?? CODE_ZOOM_DEFAULT);
  return `calc(var(--t-fs-12) * ${z / 100})`;
}

export function CodeZoom({ value, onChange }: { value?: number; onChange?: (z: number) => void }) {
  const { t } = useText();
  const z = codeZoomLevel(value ?? CODE_ZOOM_DEFAULT);
  const at = CODE_ZOOM_LEVELS.indexOf(z as (typeof CODE_ZOOM_LEVELS)[number]);
  const step = (d: number) => {
    const next = CODE_ZOOM_LEVELS[at + d];
    if (next != null) onChange?.(next);
  };
  return (
    <div className="t-b-zoom" role="group" aria-label={t("b.code.zoom")}>
      <Button
        size="small"
        variant="quiet"
        icon="zoomOut"
        aria-label={t("b.code.zoomOut")}
        disabled={at <= 0}
        onClick={() => step(-1)}
      />
      <Button
        size="small"
        variant="quiet"
        className="t-b-zoom__level"
        aria-label={t("b.code.zoomReset", { percent: z })}
        disabled={z === CODE_ZOOM_DEFAULT}
        onClick={() => onChange?.(CODE_ZOOM_DEFAULT)}
      >
        {t("b.common.percent", { value: z })}
      </Button>
      <Button
        size="small"
        variant="quiet"
        icon="zoomIn"
        aria-label={t("b.code.zoomIn")}
        disabled={at >= CODE_ZOOM_LEVELS.length - 1}
        onClick={() => step(1)}
      />
    </div>
  );
}

export type SourceFileAnchor = { line: number; id: string; role?: string };

export type SourceFile = {
  path: string;

  line: number;
  state: "loading" | "ready" | "error";
  text?: string;

  anchors?: SourceFileAnchor[];

  reason?: string;
};

const REASONS = ["invalid", "missing", "outside", "too-large", "not-anchored", "network"] as const;

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    return false;
  }
}

export function SourceEditor({
  file,
  recordId,
  zoom,
  onZoom,
  onClose,
}: {
  file: SourceFile;

  recordId?: string;
  zoom?: number;
  onZoom?: (z: number) => void;
  onClose?: () => void;
}) {
  const { t, plural } = useText();
  const lang = languageOf(file.path);
  const lines = useMemo(
    () => (file.state === "ready" && file.text != null ? tokenize(file.text, lang) : []),
    [file.state, file.text, lang],
  );
  const anchorAt = useMemo(() => {
    const m = new Map<number, SourceFileAnchor>();
    for (const a of file.anchors ?? []) m.set(a.line, a);
    return m;
  }, [file.anchors]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (file.state !== "ready") return;
    const body = bodyRef.current;
    const target = body?.querySelector<HTMLElement>(`[data-line="${file.line}"]`);
    if (body && target) body.scrollTop = Math.max(0, target.offsetTop - body.clientHeight / 3);
    rootRef.current?.scrollIntoView?.({
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    body?.focus({ preventScroll: true });
  }, [file.state, file.path, file.line]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose?.();
    }
  };
  const name = file.path.slice(file.path.lastIndexOf("/") + 1);
  const dir = file.path.slice(0, file.path.lastIndexOf("/") + 1);
  const reason = REASONS.includes(file.reason as (typeof REASONS)[number])
    ? (file.reason as (typeof REASONS)[number])
    : "network";

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      ref={rootRef}
      className="t-b-editor"
      aria-label={t("b.code.editorLabel", { path: file.path })}
      data-testid="source-editor"
      onKeyDown={onKeyDown}
    >
      <div className="t-b-editor__bar">
        <div className="t-b-editor__tab">
          <Icon name="code" size={14} />
          <span className="t-mono t-wrap" title={file.path}>
            <span className="t-muted">{dir}</span>
            {name}
          </span>
        </div>
        <span className="t-spacer" />
        <CodeZoom value={zoom} onChange={onZoom} />
        <Button
          size="small"
          variant="quiet"
          icon="close"
          aria-label={t("b.code.close")}
          onClick={onClose}
        />
      </div>
      {file.state === "loading" ? (
        <p className="t-b-editor__state t-muted" role="status">
          {t("b.code.loading")}
        </p>
      ) : file.state === "error" ? (
        <p className="t-b-editor__state" role="alert" data-testid="source-editor-error">
          <Icon name="warning" size={14} /> {t(`b.code.reason.${reason}`)}
        </p>
      ) : (
        <div
          ref={bodyRef}
          className="t-b-editor__body"
          role="region"
          aria-label={t("b.code.contents", { path: file.path })}

          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          style={{ fontSize: codeFontSize(zoom) }}
          data-testid="source-editor-body"
        >
          <pre>
            <code>
              {lines.map((tokens, i) => {
                const n = i + 1;
                const anchor = anchorAt.get(n);
                const tagged = !!anchor || isTagLine(tokens);
                const current = n === file.line;
                return (
                  <span
                    key={i}
                    className={cx(
                      "t-b-editor__line",
                      tagged && "t-b-editor__line--anchor",
                      anchor && recordId && anchor.id === recordId && "t-b-editor__line--own",
                      current && "t-b-editor__line--current",
                    )}
                    data-line={n}
                    data-anchor={tagged ? "true" : undefined}
                    aria-current={current ? "true" : undefined}
                  >
                    <span className="t-b-editor__n" aria-hidden="true">
                      {n}
                    </span>
                    <span className="t-b-editor__text">
                      {tokens.length === 0
                        ? "​"
                        : tokens.map((tok, j) =>
                            tok.kind === "plain" ? (
                              tok.text
                            ) : (
                              <span key={j} className={`t-syn-${tok.kind}`} data-token={tok.kind}>
                                {tok.text}
                              </span>
                            ),
                          )}
                    </span>
                  </span>
                );
              })}
            </code>
          </pre>
        </div>
      )}
      <div className="t-b-editor__status t-meta">
        <span>
          <Icon name="lock" size={12} /> {t("b.code.readOnly")}
        </span>
        <span>{lang.name}</span>
        {file.state === "ready" ? (
          <>
            <span>{t("b.code.lineOf", { line: file.line, total: lines.length })}</span>
            <span>{plural("b.common.anchorCount", (file.anchors ?? []).length)}</span>
          </>
        ) : null}
      </div>
    </section>
  );
}
