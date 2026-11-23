import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

type ValueHandler = {
  /** Called with the new text; the native `onChange` still receives the event. */
  onValueChange?: (value: string) => void;
  /** Marks the control as invalid (`aria-invalid`); pair it with `Field`'s `error`. */
  invalid?: boolean;
};

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> &
  ValueHandler & {
    type?: "text" | "email" | "url" | "tel" | "password" | "number" | "date" | "time";
    mono?: boolean;
  };

/**
 * A single-line text control in the design system's look.
 * Use it inside `Field`, which supplies the id that connects the label:
 * `<Field label="Name">{(id) => <TextInput id={id} … />}</Field>`.
 */
export function TextInput({
  type = "text",
  invalid,
  mono,
  onValueChange,
  onChange,
  className,
  ...rest
}: TextInputProps) {
  return (
    <input
      type={type}
      className={cx("t-input", mono && "t-mono", className)}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
      }}
      {...rest}
    />
  );
}

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  ValueHandler & {
    /** Monospaced, for code and structured text. */
    code?: boolean;
  };

/** A multi-line text control. */
export function TextArea({
  invalid,
  code,
  onValueChange,
  onChange,
  className,
  ...rest
}: TextAreaProps) {
  return (
    <textarea
      className={cx("t-textarea", code && "t-textarea--code", className)}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
      }}
      {...rest}
    />
  );
}

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> &
  ValueHandler & {
    options: SelectOption[];
  };

/** A native select: the platform's own picker, keyboard and screen-reader support. */
export function Select({
  options,
  invalid,
  onValueChange,
  onChange,
  className,
  ...rest
}: SelectProps) {
  return (
    <select
      className={cx("t-select", className)}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
      }}
      {...rest}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
