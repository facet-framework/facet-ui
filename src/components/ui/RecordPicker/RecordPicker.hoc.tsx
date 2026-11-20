import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { PickerResult, RecordPickerProps } from "./RecordPicker";

export type PickerItem = {
  id: string;
  label: string;
  /** Kind of entry in plain text, e.g. "Record" or "Promise". */
  kind: string;
  hint?: string;
  /** Additional search terms that are not displayed. */
  terms?: string[];
  /**
   * No record stands behind it — e.g. a code path from
   * `model.corpusErrors` whose YAML could not be read. Such an entry matches the search like
   * any other but opens nothing: click and Enter call `onSelectInert`
   * instead of `onSelect`.
   */
  inert?: boolean;
};

export type WithRecordPickerProps = Omit<
  RecordPickerProps,
  | "containerStyle"
  | "inputStyle"
  | "listStyle"
  | "emptyStyle"
  | "query"
  | "results"
  | "emptyText"
  | "onQueryChange"
  | "onKeyDown"
  | "inputRef"
  | "placeholder"
> & {
  items: PickerItem[];
  /** Called with the id of the selected entry. */
  onSelect?: (id: string) => void;
  /** Called instead of onSelect for inert results; without it click/Enter has no effect. */
  onSelectInert?: (item: PickerItem) => void;
  /** Maximum number of results shown. */
  limit?: number;
  placeholder?: string;
  /** Take focus on opening. */
  autoFocus?: boolean;
  style?: CSSProperties;
};

/**
 * Height of a result row in pixels (two lines: label+kind, below it
 * the placement `hint`) and how many full rows the result list shows
 * before it continues with scrolling.
 *
 * Previously this only had `rowStyle.minHeight: 32` — a mere minimum that
 * did not fix the actual (two-line, content-dependent) height — next to
 * `listStyle.maxHeight: 360`, a number with no relation to that height. As soon
 * as more results appeared than whole rows fit exactly into 360px, the
 * scroll edge (`overflowY: "auto"`) cut through the last visible row —
 * reported bug: "in search, rows are clipped at the bottom". With a
 * fixed row height (enforced via `lineHeight` on the text lines, since
 * `label`/`kind`/`hint` stay single-line anyway — `whiteSpace: nowrap`) AND
 * a list height that is an exact multiple of it, the
 * scroll edge always lies on a row boundary, never in the middle of a row.
 */
const ROW_LABEL_LINE_HEIGHT = 18;
const ROW_HINT_LINE_HEIGHT = 14;
const ROW_VERTICAL_PADDING = 16; // 8px top + 8px bottom (padding: "8px 12px")
// `rowStyle.gap` is the grid shorthand — it sets not only the gap
// between the label and kind columns but also the row gap between this
// line and the hint line below (which via `gridColumn: "1 / -1"` falls
// onto its own grid row). When this value was missing here, `ROW_HEIGHT` was
// computed too low by exactly this row gap — the row stayed too tight, and
// the hint line ran out at the bottom instead of sitting cleanly within the row
// height. That is why the same value feeds both `ROW_HEIGHT` and
// `rowStyle.gap` below, so the two can never drift apart again.
const ROW_GAP = 10;
const ROW_HEIGHT = ROW_LABEL_LINE_HEIGHT + ROW_GAP + ROW_HINT_LINE_HEIGHT + ROW_VERTICAL_PADDING;
const VISIBLE_ROWS = 7;

/** Substring search across label, id and additional terms. */
function matches(item: PickerItem, needle: string): boolean {
  if (!needle) return true;
  const haystack = [item.label, item.id, item.hint ?? "", ...(item.terms ?? [])]
    .join(" ")
    .toLowerCase();
  return needle
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => haystack.includes(part));
}

/**
 * Owns search text, selection and keyboard: ↑/↓ select, Enter opens.
 * The selection jumps back to the first result on every input.
 */
export function withRecordPickerLogic(Component: ComponentType<RecordPickerProps>) {
  const Wrapped = ({
    items,
    onSelect,
    onSelectInert,
    limit = 12,
    placeholder: placeholderProp,
    autoFocus,
    style,
    ...rest
  }: WithRecordPickerProps) => {
    const { t } = useText();
    const placeholder = placeholderProp ?? t("elements.recordPicker.placeholder");
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

    const found = useMemo(
      () => items.filter((item) => matches(item, query)).slice(0, limit),
      [items, limit, query],
    );

    const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setActive(0);
    }, []);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActive((current) => Math.min(found.length - 1, current + 1));
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setActive((current) => Math.max(0, current - 1));
          return;
        }
        if (event.key === "Enter" && found[active]) {
          event.preventDefault();
          const item = found[active];
          if (item.inert) {
            onSelectInert?.(item);
          } else {
            onSelect?.(item.id);
          }
        }
      },
      [active, found, onSelect, onSelectInert],
    );

    const results = useMemo<PickerResult[]>(
      () =>
        found.map((item, index) => {
          const isActive = index === active;
          const inert = item.inert === true;
          return {
            // The id is the jump target, not the key: a record and
            // one of its promises carry the same id.
            key: `${item.kind}:${item.label}:${item.id}`,
            label: item.label,
            kind: item.kind,
            hint: item.hint ?? item.id,
            active: isActive,
            inert,
            // An inert result has no record it could open:
            // `onSelectInert` decides what happens instead (e.g. jump to the
            // register). Without it the click does nothing —
            // better than accidentally opening a detail that does not exist.
            onSelect: inert ? () => onSelectInert?.(item) : () => onSelect?.(item.id),
            rowStyle: {
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: ROW_GAP,
              padding: "8px 12px",
              background: isActive ? (inert ? color.dueSoft : color.tint2) : "transparent",
              borderLeftStyle: "solid",
              borderLeftWidth: 2,
              borderLeftColor: isActive ? (inert ? color.due : color.signal) : "transparent",
              cursor: inert ? (onSelectInert ? "pointer" : "default") : "pointer",
              // Fixed height instead of `minHeight` — see the comment at `ROW_HEIGHT`.
              height: ROW_HEIGHT,
              // `box-sizing: border-box` holds globally only because `tokens.css`
              // sets it — a consumer that includes the standalone bundle without
              // that stylesheet would otherwise fall back to `content-box`,
              // and `height` would no longer include the padding.
              // That is why all other measures of this row are already
              // inline styles; this one gets the same safeguard.
              boxSizing: "border-box",
            },
            labelStyle: {
              fontFamily: font.sans,
              fontSize: fontSize.body,
              lineHeight: `${ROW_LABEL_LINE_HEIGHT}px`,
              color: inert ? color.dim : color.ink,
              fontStyle: inert ? "italic" : "normal",
              fontWeight: isActive && !inert ? 500 : 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            kindStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.micro,
              lineHeight: `${ROW_LABEL_LINE_HEIGHT}px`,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: inert ? color.due : color.dim,
              whiteSpace: "nowrap",
            },
            hintStyle: {
              gridColumn: "1 / -1",
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              lineHeight: `${ROW_HINT_LINE_HEIGHT}px`,
              color: color.faint,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          };
        }),
      [active, found, onSelect, onSelectInert],
    );

    const emptyText = useMemo(
      () =>
        query
          ? t("elements.recordPicker.noMatchFor", { query })
          : t("elements.recordPicker.typeToSearch"),
      [query, t],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 0, minWidth: 0, background: color.surface, ...style }),
      [style],
    );

    const inputStyle = useMemo<CSSProperties>(
      () => ({
        appearance: "none",
        width: "100%",
        padding: "14px 12px",
        border: "none",
        borderBottomStyle: "solid",
        borderBottomWidth: 1,
        borderBottomColor: color.line,
        background: "transparent",
        fontFamily: font.mono,
        fontSize: fontSize.lead,
        color: color.ink,
        outline: "none",
      }),
      [],
    );

    const listStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gap: 0,
        // Exact multiple of `ROW_HEIGHT` — see the comment there.
        maxHeight: ROW_HEIGHT * VISIBLE_ROWS,
        overflowY: "auto",
      }),
      [],
    );

    const emptyStyle = useMemo<CSSProperties>(
      () => ({
        margin: 0,
        padding: "16px 12px",
        fontFamily: font.mono,
        fontSize: fontSize.meta,
        color: color.dim,
      }),
      [],
    );

    const setInputRef = useCallback((element: HTMLInputElement | null) => {
      inputRef.current = element;
    }, []);

    return (
      <Component
        containerStyle={containerStyle}
        inputStyle={inputStyle}
        listStyle={listStyle}
        emptyStyle={emptyStyle}
        query={query}
        placeholder={placeholder}
        results={results}
        emptyText={emptyText}
        onQueryChange={handleQueryChange}
        onKeyDown={handleKeyDown}
        inputRef={setInputRef}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withRecordPickerLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
