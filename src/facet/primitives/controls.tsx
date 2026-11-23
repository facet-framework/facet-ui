import {
  useId,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useText } from "../i18n/TextProvider";
import { Icon, type IconName } from "./Icon";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: "default" | "primary" | "quiet" | "danger";
  size?: "default" | "small";
  icon?: IconName;
  iconAfter?: IconName;
  pressed?: boolean;
  /** Renders a link that looks like a button. */
  href?: string;
  type?: "button" | "submit" | "reset";
  /**
   * Why the action is unavailable. The button stays visible and focusable but is marked
   * `aria-disabled` and ignores clicks; the reason is shown next to it and is its accessible
   * description, so it never lives in a tooltip only.
   */
  disabledReason?: string;
  /**
   * The action is running: the button is marked `aria-busy`, keeps its place and focus, and
   * ignores activation until it is done, so a second press never sends twice.
   */
  busy?: boolean;
  /** Takes the full width of its container. */
  block?: boolean;
};

/** Copies the attributes without any React event handler (`onClick`, `onKeyDown`, ...). */
function withoutEventHandlers<T extends object>(attrs: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !/^on[A-Z]/.test(key)),
  ) as Partial<T>;
}

export function Button({
  variant = "default",
  size = "default",
  icon,
  iconAfter,
  pressed,
  href,
  className,
  children,
  type = "button",
  disabledReason,
  busy,
  block,
  ...rest
}: ButtonProps) {
  const reasonId = useId();
  const cls = cx(
    "t-btn",
    variant !== "default" && `t-btn--${variant}`,
    size === "small" && "t-btn--small",
    !children && icon && "t-btn--icon",
    block && "t-btn--block",
    className,
  );
  const inner = (
    <>
      {icon ? <Icon name={icon} size={size === "small" ? 14 : 16} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={14} /> : null}
    </>
  );
  if (disabledReason) {
    // A disabled action must not act. Dropping onClick alone is not enough: a submit or reset
    // button still submits or resets its form, and onKeyDown/onPointerDown/onMouseDown still
    // fire. So every type becomes "button" and every on* handler is dropped, not styled away.
    const attrs = withoutEventHandlers(rest);
    const describedBy = attrs["aria-describedby"];
    return (
      <span className="t-btn-reason">
        <button
          type="button"
          className={cls}
          aria-pressed={pressed}
          {...attrs}
          aria-disabled="true"
          aria-describedby={cx(describedBy, reasonId)}
        >
          {inner}
        </button>
        <span id={reasonId} className="t-btn-reason__text">
          {disabledReason}
        </span>
      </span>
    );
  }
  if (href) {
    // A link keeps every attribute and handler it was given; `disabled` has no meaning on it.
    const { disabled: _disabled, ...linkAttrs } = rest;
    return (
      <a className={cls} href={href} {...(linkAttrs as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    );
  }
  if (busy) {
    const { onClick: _onClick, ...attrs } = rest;
    return (
      <button
        type={type}
        className={cls}
        aria-pressed={pressed}
        {...attrs}
        aria-busy="true"
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          // A submit button would still submit its form: the press is swallowed, not styled away.
          e.preventDefault();
        }}
      >
        {inner}
      </button>
    );
  }
  return (
    <button type={type} className={cls} aria-pressed={pressed} {...rest}>
      {inner}
    </button>
  );
}

export type IconButtonProps = Omit<ButtonProps, "children" | "icon"> & {
  icon: IconName;
  label: string;
};

/** A square button with only an icon; the label is required and becomes its name. */
export function IconButton({ icon, label, ...rest }: IconButtonProps) {
  return <Button icon={icon} aria-label={label} title={label} variant="quiet" {...rest} />;
}

export type SwitchProps = {
  checked: boolean;
  label: string;
  disabled?: boolean;
  /**
   * What the setting does. It stands beside the switch, outside the button,
   * and is its accessible description — inside, it would become part of the
   * name and a screen reader would announce the explanation as what the
   * switch is called.
   */
  hint?: ReactNode;
  /**
   * Why the switch cannot be moved. The switch is locked (`aria-disabled`,
   * presses change nothing) and the reason stands beside it as its
   * description: a control that is simply dead reads as a broken surface.
   */
  disabledReason?: string;
  onChange?: (next: boolean) => void;
};

export function Switch({ checked, label, disabled, hint, disabledReason, onChange }: SwitchProps) {
  const hintId = useId();
  const reasonId = useId();
  const locked = disabled || !!disabledReason;
  const describedBy = cx(hint != null && hintId, disabledReason && reasonId) || undefined;
  const button = (
    <button
      type="button"
      role="switch"
      className="t-switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={locked || undefined}
      aria-describedby={describedBy}
      onClick={() => !locked && onChange?.(!checked)}
    >
      <span className="t-switch__track">
        <span className="t-switch__thumb" />
      </span>
    </button>
  );
  if (hint == null && !disabledReason) return button;
  return (
    <span className="t-switch-field">
      {button}
      {hint != null ? (
        <span id={hintId} className="t-switch-field__hint">
          {hint}
        </span>
      ) : null}
      {disabledReason ? (
        <span id={reasonId} className="t-switch-field__reason">
          {disabledReason}
        </span>
      ) : null}
    </span>
  );
}

export type SegmentOption<V extends string> = {
  value: V;
  label: ReactNode;
  icon?: IconName;
  /** Not selectable: stays visible with `aria-disabled` and is skipped by the arrow keys. */
  disabled?: boolean;
  /** Why the option is not selectable; its accessible description and its title. */
  reason?: string;
};

export type SegmentProps<V extends string> = {
  label: string;
  value: V;
  options: SegmentOption<V>[];
  onChange?: (value: V) => void;
  /** The options share the full width of the container. */
  full?: boolean;
};

/**
 * A choice among few options: a radio group with one tab stop. The arrows move and choose,
 * Home and End jump to the ends, and disabled options are skipped and never chosen.
 */
export function Segment<V extends string>({
  label,
  value,
  options,
  onChange,
  full,
}: SegmentProps<V>) {
  const group = useRef<HTMLDivElement>(null);
  const reasonBase = useId();
  const enabled = options.filter((o) => !o.disabled);
  const stop = enabled.some((o) => o.value === value) ? value : enabled[0]?.value;
  const choose = (next: V) => {
    const option = options.find((o) => o.value === next);
    if (!option || option.disabled || next === value) return;
    onChange?.(next);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!enabled.length) return;
    const at = enabled.findIndex((o) => o.value === value);
    let to: number;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") to = (at + 1) % enabled.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      to = (Math.max(at, 0) - 1 + enabled.length) % enabled.length;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = enabled.length - 1;
    else return;
    e.preventDefault();
    const next = enabled[to].value;
    choose(next);
    group.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(next)}"]`)?.focus();
  };
  return (
    <div
      ref={group}
      className={cx("t-segment", full && "t-segment--full")}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          className="t-segment__opt"
          aria-checked={o.value === value}
          aria-disabled={o.disabled || undefined}
          aria-describedby={o.disabled && o.reason ? `${reasonBase}-${i}` : undefined}
          title={o.disabled ? o.reason : undefined}
          tabIndex={o.value === stop ? 0 : -1}
          data-value={o.value}
          onClick={() => choose(o.value)}
          onKeyDown={onKeyDown}
        >
          {o.icon ? <Icon name={o.icon} size={14} /> : null}
          {o.label}
        </button>
      ))}
      {/* Outside the options, so a reason describes its option and never becomes its name. */}
      {options.map((o, i) =>
        o.disabled && o.reason ? (
          <span key={o.value} id={`${reasonBase}-${i}`} className="t-sr-only">
            {o.reason}
          </span>
        ) : null,
      )}
    </div>
  );
}

export type TabItem<V extends string> = { value: V; label: ReactNode; count?: ReactNode };

export type TabsProps<V extends string> = {
  label: string;
  value: V;
  items: TabItem<V>[];
  onChange?: (value: V) => void;
  /** Id of the panel the tabs control (`TabPanel` with the same id). */
  panelId?: string;
  /** Prefix of the tab ids; a panel is labelled by `tabId(idPrefix, value)`. */
  idPrefix?: string;
};

/** Id of one tab of `Tabs` or `AreaBar`, for the panel's `aria-labelledby`. */
export function tabId(idPrefix: string, value: string): string {
  return `${idPrefix}-tab-${value}`;
}

/**
 * Tabs inside a page: one tab stop, the arrows move to the next tab and select it, Home and End
 * jump to the ends. `value` is the only truth; a press only reports `onChange`.
 */
export function Tabs<V extends string>({
  label,
  value,
  items,
  onChange,
  panelId,
  idPrefix,
}: TabsProps<V>) {
  const generated = useId();
  const prefix = idPrefix ?? generated;
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const n = items.length;
    const at = items.findIndex((t) => t.value === value);
    const to =
      e.key === "ArrowRight"
        ? (at + 1) % n
        : e.key === "ArrowLeft"
          ? (at - 1 + n) % n
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : -1;
    if (to < 0 || !n) return;
    e.preventDefault();
    const next = items[to].value;
    if (next !== value) onChange?.(next);
    document.getElementById(tabId(prefix, next))?.focus();
  };
  return (
    <div className="t-tabs" role="tablist" aria-label={label}>
      {items.map((t) => (
        <button
          key={t.value}
          id={tabId(prefix, t.value)}
          type="button"
          role="tab"
          className="t-tab"
          aria-selected={t.value === value}
          aria-controls={panelId}
          tabIndex={t.value === value ? 0 : -1}
          onClick={() => t.value !== value && onChange?.(t.value)}
          onKeyDown={onKeyDown}
        >
          {t.label}
          {t.count != null ? <span className="t-chip__count"> {t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export type ChipProps = {
  children: ReactNode;
  count?: ReactNode;
  pressed?: boolean;
  icon?: IconName;
  onClick?: () => void;
  onRemove?: () => void;
  mono?: boolean;
};

/** A chip is a button when it does something, otherwise a plain label. */
export function Chip({ children, count, pressed, icon, onClick, onRemove, mono }: ChipProps) {
  const { t } = useText();
  const inner = (
    <>
      {icon ? <Icon name={icon} size={12} /> : null}
      <span className={mono ? "t-mono" : undefined}>{children}</span>
      {/* The space keeps name and count apart for assistive technology ("Open 4", not "Open4"). */}
      {count != null ? <span className="t-chip__count"> {count}</span> : null}
    </>
  );
  if (onRemove) {
    return (
      <span className="t-chip">
        {inner}
        <button
          type="button"
          className="t-btn t-btn--quiet t-btn--small t-btn--icon"
          style={{ width: 18, minHeight: 18, marginRight: -6 }}
          aria-label={t("primitives.chip.remove")}
          onClick={onRemove}
        >
          <Icon name="close" size={12} />
        </button>
      </span>
    );
  }
  if (onClick || pressed != null) {
    return (
      <button type="button" className="t-chip" aria-pressed={pressed} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <span className="t-chip">{inner}</span>;
}

export type Tone = "neutral" | "ok" | "warn" | "plan" | "bad" | "signal";

export function Badge({
  tone = "neutral",
  plain,
  children,
}: {
  tone?: Tone;
  plain?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cx("t-badge", tone !== "neutral" && `t-badge--${tone}`, plain && "t-badge--plain")}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral", open }: { tone?: Tone; open?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx("t-dot", open ? "t-dot--open" : tone !== "neutral" && `t-dot--${tone}`)}
    />
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="t-kbd">{children}</kbd>;
}

export type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: (id: string) => ReactNode;
  /** Defaults to a generated id. */
  id?: string;
};

/** A labelled form field. The children render the control with the given id. */
export function Field({ label, hint, error, children, id: given }: FieldProps) {
  const auto = useId();
  const id = given ?? auto;
  return (
    <div className="t-field">
      <label className="t-field__label" htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {error ? <span className="t-field__error">{error}</span> : null}
      {!error && hint ? <span className="t-field__hint">{hint}</span> : null}
    </div>
  );
}

export type SearchFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  hero?: boolean;
  trailing?: ReactNode;
  onChange?: (value: string) => void;
};

export function SearchField({
  label,
  value,
  placeholder,
  hero,
  trailing,
  onChange,
}: SearchFieldProps) {
  return (
    <label className={cx("t-search", hero && "t-search--hero")}>
      <Icon name="search" size={hero ? 24 : 16} />
      <input
        type="search"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {trailing}
    </label>
  );
}
