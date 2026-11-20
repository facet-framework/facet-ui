import { useText } from "../../../facet/i18n";
import {
  useId,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type PickerResult = {
  key: string;
  /** Found entry: record, promise, test or code path. */
  label: string;
  /** Kind of the hit, as a word. */
  kind: string;
  /** Context, e.g. the record a promise belongs to. */
  hint: string;
  active: boolean;
  /**
   * A finding with no record behind it — e.g. a record whose YAML could not
   * be read. It opens
   * no detail, but click and Enter still do something (jump into the
   * "Validation" register) — so the row is operable, just differently from a
   * real one. `aria-disabled` would be wrong here: it says "not operable", and
   * a screen reader user who hears that no longer presses Enter — exactly the
   * finding this row is meant to show would then be unreachable. The
   * distinction lives in the text itself instead: `kind` ("Error") and
   * `hint` ("could not be read").
   */
  inert?: boolean;
  onSelect: () => void;
  rowStyle: CSSProperties;
  labelStyle: CSSProperties;
  kindStyle: CSSProperties;
  hintStyle: CSSProperties;
};

export type RecordPickerProps = {
  containerStyle: CSSProperties;
  inputStyle: CSSProperties;
  listStyle: CSSProperties;
  emptyStyle: CSSProperties;
  query: string;
  placeholder: string;
  results: PickerResult[];
  /** Sentence shown when nothing was found. */
  emptyText: string;
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: (element: HTMLInputElement | null) => void;
  footer?: ReactNode;
  "data-testid"?: string;
};

/**
 * Search entry (⌘K): one line for everything — records, promises, tests, code
 * paths. Arrow keys select, Enter opens.
 */
export function RecordPicker({
  containerStyle,
  inputStyle,
  listStyle,
  emptyStyle,
  query,
  placeholder,
  results,
  emptyText,
  onQueryChange,
  onKeyDown,
  inputRef,
  footer,
  ...rest
}: RecordPickerProps) {
  // The combobox must be able to name its list, and the list its selected
  // row: without 'aria-controls' and 'aria-activedescendant' a screen reader
  // says nothing while typing about the hit one is currently on.
  // A hit's id contains spaces and colons; as an HTML id it would be invalid
  // and 'aria-activedescendant' would point nowhere. The position in the list
  // is enough — it does nothing more than name a row.
  const { t } = useText();
  const listId = useId();
  const optionId = (index: number) => `${listId}-${index}`;
  const activeIndex = results.findIndex((result) => result.active);

  return (
    <div style={containerStyle} {...rest}>
      <input
        ref={inputRef}
        type="search"
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-label={t("elements.recordPicker.searchLabel")}
        style={inputStyle}
        value={query}
        placeholder={placeholder}
        onChange={onQueryChange}
      />
      {results.length ? (
        <div id={listId} style={listStyle} role="listbox">
          {/*
            The rows are not in the tab order — focus stays in the field, and
            'aria-activedescendant' points at the selected one. That is why
            keyboard handling sits on the field and not on the row.
          */}
          {results.map((result, index) => (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <div
              key={result.key}
              id={optionId(index)}
              role="option"
              aria-selected={result.active}
              tabIndex={-1}
              style={result.rowStyle}
              data-result={result.key}
              onClick={result.onSelect}
            >
              <span style={result.labelStyle}>{result.label}</span>
              <span style={result.kindStyle}>{result.kind}</span>
              <span style={result.hintStyle}>{result.hint}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={emptyStyle}>{emptyText}</p>
      )}
      {footer}
    </div>
  );
}

export default RecordPicker;
