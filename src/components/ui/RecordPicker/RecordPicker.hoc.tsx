import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/RecordPicker/RecordPicker.hoc";
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
import type { PickerResult, RecordPickerProps } from "./RecordPicker";

export type PickerItem = {
  id: string;
  label: string;

  kind: string;
  hint?: string;

  terms?: string[];

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

  onSelect?: (id: string) => void;

  onSelectInert?: (item: PickerItem) => void;

  limit?: number;
  placeholder?: string;

  autoFocus?: boolean;
  style?: CSSProperties;
};

const ROW_LABEL_LINE_HEIGHT = 18;
const ROW_HINT_LINE_HEIGHT = 14;
const ROW_VERTICAL_PADDING = 16;

const ROW_GAP = 10;
const ROW_HEIGHT = ROW_LABEL_LINE_HEIGHT + ROW_GAP + ROW_HINT_LINE_HEIGHT + ROW_VERTICAL_PADDING;
const VISIBLE_ROWS = 7;

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

export function withRecordPickerLogic(Component: ComponentType<RecordPickerProps>) {
  const Wrapped = ({
    items,
    onSelect,
    onSelectInert,
    limit = 12,
    placeholder = localized.text1,
    autoFocus,
    style,
    ...rest
  }: WithRecordPickerProps) => {
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
            key: `${item.kind}:${item.label}:${item.id}`,
            label: item.label,
            kind: item.kind,
            hint: item.hint ?? item.id,
            active: isActive,
            inert,

            onSelect: inert ? () => onSelectInert?.(item) : () => onSelect?.(item.id),
            rowStyle: {
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: ROW_GAP,
              padding: "8px 12px",
              background: isActive ? (inert ? color.deadlineSoft : color.tint2) : "transparent",
              borderLeftStyle: "solid",
              borderLeftWidth: 2,
              borderLeftColor: isActive ? (inert ? color.deadline : color.signal) : "transparent",
              cursor: inert ? (onSelectInert ? "pointer" : "default") : "pointer",

              height: ROW_HEIGHT,

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
              color: inert ? color.deadline : color.dim,
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
      () => (query ? `${germanLabels.text161}${query}${localized.text2}` : germanLabels.text162),
      [query],
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
