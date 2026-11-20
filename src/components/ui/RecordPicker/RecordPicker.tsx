import { localized } from "../../../i18n/legacy/components/ui/RecordPicker/RecordPicker";
import {
  useId,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type PickerResult = {
  key: string;

  label: string;

  kind: string;

  hint: string;
  active: boolean;

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

  emptyText: string;
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: (element: HTMLInputElement | null) => void;
  footer?: ReactNode;
  "data-testid"?: string;
};

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
        aria-label={localized.text1}
        style={inputStyle}
        value={query}
        placeholder={placeholder}
        onChange={onQueryChange}
      />
      {results.length ? (
        <div id={listId} style={listStyle} role="listbox">
          {}
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
