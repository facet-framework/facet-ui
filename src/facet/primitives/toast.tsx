import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useText } from "../i18n/TextProvider";
import { Icon } from "./Icon";
import { OverlayLayer, useOverlay } from "./overlayHost";

/** What a toast shows right now. */
export type ToastPhase = "running" | "leaving" | "undone" | "gone";

/** How long the exit plays before a toast is gone. */
export const TOAST_EXIT_MS = 240;
/** How long "Undone" stays before that toast leaves. */
export const TOAST_UNDONE_MS = 3000;
const TICK_MS = 250;

export type ToastProps = {
  /** The confirmation or notice. */
  children: ReactNode;
  tone?: "neutral" | "ok" | "bad";
  /**
   * Restores the data for real. Only with it does the toast offer "Undo"; a toast never offers
   * an undo the app cannot carry out.
   */
  onUndo?: () => void;
  /** The action cannot be undone: the toast says so instead of offering "Undo". */
  irreversible?: boolean;
  /**
   * Seconds the toast stays; 8 by default. Hover or focus hold the window. `null` keeps the
   * toast until the app removes it.
   */
  duration?: number | null;
  /** Called once when the window ends without an undo. Never after `onUndo`. */
  onExpire?: () => void;
  /** Called once when the toast has left, after an expiry or an undo. */
  onDismissed?: () => void;
  /** Text after undoing; "Undone" by default. */
  undoneText?: ReactNode;
  /** A further action, e.g. a link to what was changed. */
  action?: ReactNode;
};

/**
 * A short confirmation. The toast is the one live region (`role="status"`); its region adds
 * none. The undo window is enforced, not only drawn: when it ends the toast plays its exit,
 * calls `onExpire` and is gone, and "Undo" with it. The remaining time shows as a draining bar
 * and as whole seconds, so it stays visible when motion is reduced.
 */
export function Toast({
  children,
  tone = "neutral",
  onUndo,
  irreversible,
  duration = 8,
  onExpire,
  onDismissed,
  undoneText,
  action,
}: ToastProps) {
  const { t } = useText();
  const restId = useId();
  const timed = duration != null;
  const seconds = timed && Number.isFinite(duration) && duration > 0 ? duration : 8;
  const [phase, setPhase] = useState<ToastPhase>("running");
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const [undone, setUndone] = useState(false);
  const pausedRef = useRef(false);
  const expireRef = useRef(onExpire);
  const dismissedRef = useRef(onDismissed);
  useEffect(() => {
    expireRef.current = onExpire;
    dismissedRef.current = onDismissed;
  }, [onExpire, onDismissed]);

  // The window runs while the phase is "running" and stops with it: an undo ends the window,
  // so `onExpire` can never follow an undo. Pausing does not restart it (pausedRef).
  const running = phase === "running";
  useEffect(() => {
    if (!running || !timed) return undefined;
    let left = seconds * 1000;
    let since = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (!pausedRef.current) left -= now - since;
      since = now;
      if (left <= 0) {
        window.clearInterval(timer);
        setSecondsLeft(0);
        setPhase("leaving");
        expireRef.current?.();
      } else {
        setSecondsLeft(Math.ceil(left / 1000));
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
    // A new duration does not restart a running window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timed]);

  useEffect(() => {
    if (phase === "leaving") {
      const exit = window.setTimeout(() => setPhase("gone"), TOAST_EXIT_MS);
      return () => window.clearTimeout(exit);
    }
    if (phase === "undone" && timed) {
      const exit = window.setTimeout(() => setPhase("leaving"), TOAST_UNDONE_MS);
      return () => window.clearTimeout(exit);
    }
    if (phase === "gone") dismissedRef.current?.();
    return undefined;
  }, [phase, timed]);

  const hold = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
  }, []);
  const release = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
  }, []);
  const undo = () => {
    setUndone(true);
    setPhase("undone");
    onUndo?.();
  };

  if (phase === "gone") return null;
  const icon = tone === "ok" ? "check" : tone === "bad" ? "error" : "info";
  if (undone) {
    return (
      <div
        className="t-toast"
        role="status"
        data-tone={tone}
        data-leaving={phase === "leaving" ? "true" : undefined}
      >
        <Icon name="rotateLeft" size={16} />
        <span>{undoneText ?? t("primitives.toast.undone")}</span>
      </div>
    );
  }
  const withUndo = !!onUndo && !irreversible && running;
  return (
    <div
      className="t-toast"
      role="status"
      data-tone={tone}
      data-leaving={phase === "leaving" ? "true" : undefined}
      data-paused={paused ? "true" : undefined}
      style={timed ? ({ "--t-toast-duration": `${seconds}s` } as CSSProperties) : undefined}
      onPointerEnter={hold}
      onPointerLeave={release}
      onFocus={hold}
      onBlur={release}
    >
      <Icon name={icon} size={16} className={tone === "neutral" ? undefined : `t-${tone}`} />
      <span className="t-toast__text">{children}</span>
      {irreversible ? (
        <span className="t-toast__note">{t("primitives.toast.irreversible")}</span>
      ) : null}
      {action}
      {withUndo ? (
        <button
          type="button"
          className="t-btn t-btn--small t-btn--quiet t-toast__undo"
          aria-describedby={timed ? restId : undefined}
          onClick={undo}
        >
          {t("primitives.toast.undo")}
        </button>
      ) : null}
      {withUndo && timed ? (
        <>
          {/* Read once, as the description of "Undo"; hidden so the live region does not
              announce every second. */}
          <span id={restId} className="t-toast__seconds t-mono" aria-hidden="true">
            {t("primitives.toast.seconds", { seconds: secondsLeft })}
          </span>
          <span className="t-toast__track" aria-hidden="true">
            <span className="t-toast__rest" />
          </span>
        </>
      ) : null}
    </div>
  );
}

export type ToastRegionProps = {
  /** The toasts, newest last. */
  children?: ReactNode;
  /** In the page flow instead of fixed at the bottom of the viewport (stories, patterns). */
  inline?: boolean;
};

/**
 * Where toasts appear: bottom centre, above the page, rendered into the overlay host so a toast
 * raised inside a panel or sheet still sits at the bottom of the viewport. It adds no live
 * region (each toast is one) and is only as large as its toasts, so it covers nothing else.
 */
export function ToastRegion({ children, inline }: ToastRegionProps) {
  const { markerRef, host, shown } = useOverlay(true, undefined, {
    modal: false,
    portal: !inline,
  });
  return (
    <OverlayLayer markerRef={markerRef} host={host} portal={!inline}>
      {shown ? (
        <div
          className={inline ? "t-toast-region t-toast-region--inline" : "t-toast-region"}
          data-testid="toast-region"
        >
          {children}
        </div>
      ) : null}
    </OverlayLayer>
  );
}
