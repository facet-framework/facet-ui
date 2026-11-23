import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { useText } from "../i18n/TextProvider";
import { Icon, type IconName } from "./Icon";

/** A second press sooner than this after arming is a double click, not a confirmation. */
export const CONFIRM_LOCK_MS = 300;

export type ConfirmState = "idle" | "armed" | "busy" | "done";

export type ConfirmButtonProps = {
  /** Visible label at rest, an action verb ("Delete board"). */
  label: string;
  /** Label while armed; "Confirm: <label>" by default. */
  armedLabel?: string;
  /** Label once the action was carried out; "Done" by default. */
  doneLabel?: string;
  /** `danger` arms in the alarm colour, `primary` in the signal colour. */
  variant?: "danger" | "primary" | "default";
  size?: "default" | "small";
  icon?: IconName;
  /**
   * Runs on the confirming press; a promise holds the button busy. Only `true` shows the done
   * label: an action that was not carried out goes back to rest, and the caller says why.
   */
  onConfirm: () => Promise<boolean> | boolean;
  /** The clock; a test passes its own. */
  now?: () => number;
};

/** Whether a pointer left onto another control. */
export function isControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest(
      'button, a[href], input, select, textarea, [role="button"], [role="option"], [role="radio"], [role="menuitem"]',
    ) !== null
  );
}

/**
 * Two steps in the same place, for actions that need a confirmation. The first press arms the
 * button (new label, announced); the second press confirms. A press within 300 ms of arming is
 * ignored, so a double click never confirms in one go. Escape, leaving the button (blur) and a
 * mouse pointer moving onto another control disarm it. There is no time limit against the
 * person and nothing ever confirms by itself.
 */
export function ConfirmButton({
  label,
  armedLabel,
  doneLabel,
  variant = "danger",
  size = "default",
  icon,
  onConfirm,
  now = () => performance.now(),
}: ConfirmButtonProps) {
  const { t } = useText();
  const [state, setState] = useState<ConfirmState>("idle");
  const helpId = useId();
  const armedAt = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const press = async () => {
    if (state === "busy" || state === "done") return;
    if (state !== "armed") {
      armedAt.current = now();
      setState("armed");
      return;
    }
    if (now() - armedAt.current < CONFIRM_LOCK_MS) return;
    setState("busy");
    let carried = false;
    try {
      carried = (await onConfirm()) === true;
    } catch {
      carried = false;
    } finally {
      if (mounted.current) setState(carried ? "done" : "idle");
    }
  };
  const disarm = () => setState((current) => (current === "armed" ? "idle" : current));

  const text =
    state === "armed"
      ? (armedLabel ?? t("primitives.confirm.armed", { label }))
      : state === "done"
        ? (doneLabel ?? t("primitives.confirm.done"))
        : label;
  const cls = [
    "t-btn",
    "t-confirm",
    variant !== "default" && `t-btn--${variant}`,
    size === "small" && "t-btn--small",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className="t-confirm-place">
      <button
        type="button"
        className={cls}
        data-state={state}
        aria-busy={state === "busy" || undefined}
        aria-describedby={helpId}
        onClick={() => void press()}
        onBlur={disarm}
        onPointerLeave={(e: PointerEvent<HTMLButtonElement>) => {
          if (e.pointerType === "mouse" && isControl(e.relatedTarget)) disarm();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && state === "armed") {
            // The first Esc disarms; it does not also close a dialog around the button.
            e.stopPropagation();
            e.preventDefault();
            disarm();
          }
        }}
      >
        {icon ? <Icon name={icon} size={size === "small" ? 14 : 16} /> : null}
        {text}
      </button>
      <span id={helpId} className="t-sr-only">
        {t("primitives.confirm.help")}
      </span>
      <span className="t-sr-only" aria-live="assertive">
        {state === "armed"
          ? t("primitives.confirm.armedAnnouncement")
          : state === "done"
            ? t("primitives.confirm.confirmed")
            : ""}
      </span>
    </span>
  );
}
