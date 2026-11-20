import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";
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
};

/** Copies the attributes without any React event handler (`onClick`, `onKeyDown`, ...). */
function withoutEventHandlers<T extends object>(attrs: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !/^on[A-Z]/.test(key)),
  ) as Partial<T>;
}

// @facet: interface/controls/action-buttons
// @facet-role: primary
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
  ...rest
}: ButtonProps) {
  const reasonId = useId();
  const cls = cx(
    "t-btn",
    variant !== "default" && `t-btn--${variant}`,
    size === "small" && "t-btn--small",
    !children && icon && "t-btn--icon",
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
    return (
      <a className={cls} href={href} aria-label={rest["aria-label"]} title={rest.title}>
        {inner}
      </a>
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
// @facet: interface/controls/action-buttons
// @facet-role: primary
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

// @facet: interface/controls/switch
// @facet-role: primary
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

export type SegmentOption<V extends string> = { value: V; label: ReactNode; icon?: IconName };

export type SegmentProps<V extends string> = {
  label: string;
  value: V;
  options: SegmentOption<V>[];
  onChange?: (value: V) => void;
};

// @facet: interface/controls/selection
// @facet-role: primary
export function Segment<V extends string>({ label, value, options, onChange }: SegmentProps<V>) {
  return (
    <div className="t-segment" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          className="t-segment__opt"
          aria-checked={o.value === value}
          onClick={() => onChange?.(o.value)}
        >
          {o.icon ? <Icon name={o.icon} size={14} /> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export type TabItem<V extends string> = { value: V; label: ReactNode; count?: ReactNode };

export type TabsProps<V extends string> = {
  label: string;
  value: V;
  items: TabItem<V>[];
  onChange?: (value: V) => void;
};

// @facet: interface/controls/selection
// @facet-role: primary
export function Tabs<V extends string>({ label, value, items, onChange }: TabsProps<V>) {
  return (
    <div className="t-tabs" role="tablist" aria-label={label}>
      {items.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          className="t-tab"
          aria-selected={t.value === value}
          onClick={() => onChange?.(t.value)}
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
// @facet: interface/controls/chips
// @facet-role: primary
export function Chip({ children, count, pressed, icon, onClick, onRemove, mono }: ChipProps) {
  const { t } = useText();
  const inner = (
    <>
      {icon ? <Icon name={icon} size={12} /> : null}
      <span className={mono ? "t-mono" : undefined}>{children}</span>
      {count != null ? <span className="t-chip__count">{count}</span> : null}
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
// @facet: interface/controls/form-fields
// @facet-role: primary
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

// @facet: interface/controls/form-fields
// @facet-role: primary
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
