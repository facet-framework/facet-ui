import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { localized } from "../../../i18n/legacy/components/ui/DependencyFan/DependencyFan.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { Edge } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { DependencyFanProps, FanGroup, FanLink } from "./DependencyFan";

export type WithDependencyFanProps = Omit<
  DependencyFanProps,
  | "containerStyle"
  | "captionStyle"
  | "emptyStyle"
  | "groups"
  | "caption"
  | "emptyText"
  | "upstreamLabel"
  | "downstreamLabel"
> & {
  edges: Edge[];

  depth?: Record<string, number>;

  ghosts?: string[];

  labelOf?: (id: string) => string;
  onOpen?: (id: string) => void;
  style?: CSSProperties;
};

export function withDependencyFanLogic(Component: ComponentType<DependencyFanProps>) {
  const Wrapped = ({
    edges,
    depth,
    ghosts,
    labelOf,
    onOpen,
    style,
    ...rest
  }: WithDependencyFanProps) => {
    const ghostSet = useMemo(() => new Set(ghosts ?? []), [ghosts]);

    const groups = useMemo<FanGroup[]>(() => {
      const upstream = new Map<string, string[]>();
      const downstream = new Map<string, string[]>();
      const push = (map: Map<string, string[]>, key: string, value: string) => {
        const list = map.get(key);
        if (list) {
          if (!list.includes(value)) list.push(value);
        } else {
          map.set(key, [value]);
        }
      };

      edges.forEach((edge) => {
        push(upstream, edge.to, edge.from);
        push(downstream, edge.from, edge.to);
      });

      const ids = Array.from(new Set([...upstream.keys(), ...downstream.keys()]));
      ids.sort((a, b) => (depth?.[a] ?? 0) - (depth?.[b] ?? 0) || a.localeCompare(b));

      const link = (id: string): FanLink => {
        const ghost = ghostSet.has(id);
        return {
          id,
          label: labelOf?.(id) ?? id,
          ghost,
          style: linkStyle(ghost, Boolean(onOpen) && !ghost),

          onOpen: onOpen && !ghost ? () => onOpen(id) : undefined,
        };
      };

      return ids.map((id, index) => ({
        key: id,
        label: labelOf?.(id) ?? id,
        rank: String(index + 1).padStart(2, "0"),
        upstream: (upstream.get(id) ?? []).map(link),
        downstream: (downstream.get(id) ?? []).map(link),
        rowStyle: ROW_STYLE,
        rankStyle: RANK_STYLE,
        labelStyle: labelStyle(Boolean(onOpen) && !ghostSet.has(id)),
        armStyle: ARM_STYLE,
        armLabelStyle: ARM_LABEL_STYLE,
        onOpen: onOpen && !ghostSet.has(id) ? () => onOpen(id) : undefined,
      }));
    }, [depth, edges, ghostSet, labelOf, onOpen]);

    const caption = useMemo(() => {
      const open = ghostSet.size;
      const head = `${edges.length} ${edges.length === 1 ? labelText.text302 : remainingText.text157}${labelText.text303}${groups.length} Records.`;
      if (!open) return head;
      return `${head} ${open} ${open === 1 ? localized.text1 : remainingText.text158}${localized.text2}`;
    }, [edges.length, ghostSet.size, groups.length]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 8, minWidth: 0, ...style }),
      [style],
    );

    return (
      <Component
        containerStyle={containerStyle}
        captionStyle={CAPTION_STYLE}
        emptyStyle={CAPTION_STYLE}
        groups={groups}
        caption={caption}
        emptyText={localized.text3}
        upstreamLabel={localized.text4}
        downstreamLabel={localized.text5}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withDependencyFanLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}

const ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "22px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
  gap: 12,
  alignItems: "baseline",
  padding: "8px 0",
  borderTop: `1px solid ${color.line}`,
  minWidth: 0,
};

const RANK_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  fontVariantNumeric: "tabular-nums",
  color: color.faint,
};

function labelStyle(clickable: boolean): CSSProperties {
  return {
    appearance: "none",
    background: "none",
    border: "none",
    padding: 0,
    textAlign: "left",
    fontFamily: font.mono,
    fontSize: fontSize.meta,
    color: color.ink,
    cursor: clickable ? "pointer" : undefined,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
  };
}

const ARM_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "baseline",
  minWidth: 0,
};

const ARM_LABEL_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: color.faint,
};

function linkStyle(ghost: boolean, clickable: boolean): CSSProperties {
  return {
    appearance: "none",
    background: "none",
    border: "none",
    padding: 0,
    fontFamily: font.mono,
    fontSize: fontSize.meta,

    color: ghost ? color.deadline : color.soft,
    cursor: clickable ? "pointer" : undefined,
    overflowWrap: "anywhere",
    minWidth: 0,
  };
}

const CAPTION_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: font.mono,
  fontSize: fontSize.meta,
  color: color.dim,
};
