import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/RestCloud/RestCloud.hoc";
import {
  memo,
  useCallback,
  useMemo,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { color, font, fontSize, MEANING_COLOR, type Meaning } from "../../../design-system/tokens";
import type { RestCloudProps, RestTick } from "./RestCloud";

export type RestItem = {
  id: string;

  meaning?: Meaning;
};

export type WithRestCloudProps = Omit<
  RestCloudProps,
  | "containerStyle"
  | "stripStyle"
  | "labelStyle"
  | "ticks"
  | "label"
  | "onToggle"
  | "onKeyDown"
  | "expanded"
> & {
  expanded?: boolean;

  items: RestItem[];

  noun?: [singular: string, plural: string];
  onToggle?: (expanded: boolean) => void;

  maxTicks?: number;
  style?: CSSProperties;
};

export function withRestCloudLogic(Component: ComponentType<RestCloudProps>) {
  const Wrapped = ({
    items,
    expanded = false,
    noun = [localized.text1, localized.text2],
    onToggle,
    maxTicks = 60,
    style,
    ...rest
  }: WithRestCloudProps) => {
    const ticks = useMemo<RestTick[]>(() => {
      if (items.length <= maxTicks) {
        return items.map((item) => ({
          key: item.id,
          background: MEANING_COLOR[item.meaning ?? "neutral"],
          flexGrow: 1,
        }));
      }

      const bucketSize = Math.ceil(items.length / maxTicks);
      const buckets: RestTick[] = [];
      for (let index = 0; index < items.length; index += bucketSize) {
        const group = items.slice(index, index + bucketSize);
        buckets.push({
          key: `${group[0].id}+${group.length}`,
          background: MEANING_COLOR[group[0].meaning ?? "neutral"],
          flexGrow: group.length,
        });
      }
      return buckets;
    }, [items, maxTicks]);

    const label = useMemo(() => {
      const word = items.length === 1 ? noun[0] : noun[1];
      return expanded
        ? `${items.length} ${word} — einklappen`
        : `${items.length} ${word}${labelText.text432}`;
    }, [expanded, items.length, noun]);

    const handleToggle = useCallback(() => onToggle?.(!expanded), [expanded, onToggle]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleToggle();
        }
      },
      [handleToggle],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gap: 6,
        padding: "10px 0",
        cursor: "pointer",
        minWidth: 0,
        ...style,
      }),
      [style],
    );

    const stripStyle = useMemo<CSSProperties>(
      () => ({
        display: "flex",
        gap: 1,
        height: expanded ? 3 : 9,
        opacity: expanded ? 0.4 : 1,
        transition: "height var(--motion-reveal) var(--motion-ease)",
        background: color.line,
      }),
      [expanded],
    );

    const labelStyle = useMemo<CSSProperties>(
      () => ({
        fontFamily: font.mono,
        fontSize: fontSize.caption,
        letterSpacing: "0.12em",
        color: color.dim,
        whiteSpace: "nowrap",
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        stripStyle={stripStyle}
        labelStyle={labelStyle}
        ticks={ticks}
        label={label}
        expanded={expanded}
        onToggle={handleToggle}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withRestCloudLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
