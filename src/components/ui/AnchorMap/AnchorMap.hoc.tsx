import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/AnchorMap/AnchorMap.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { Anchor, DriftEntry } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { AnchorEntryView, AnchorMapProps } from "./AnchorMap";

export type WithAnchorMapProps = Omit<
  AnchorMapProps,
  "containerStyle" | "captionStyle" | "entries" | "caption"
> & {
  anchors: Anchor[];

  drift?: DriftEntry[] | null;

  lifecycle?: string;

  buildHref?: (anchor: Anchor) => string | undefined;
  onOpen?: (anchor: Anchor) => void;

  hideExcerpt?: boolean;
  style?: CSSProperties;
};

export function withAnchorMapLogic(Component: ComponentType<AnchorMapProps>) {
  const Wrapped = ({
    anchors,
    drift,
    lifecycle,
    buildHref,
    onOpen,
    hideExcerpt,
    style,
    ...rest
  }: WithAnchorMapProps) => {
    const driftedPaths = useMemo(() => new Set((drift ?? []).map((entry) => entry.path)), [drift]);

    const sorted = useMemo(
      () =>
        [...anchors].sort(
          (a, b) =>
            Number(driftedPaths.has(b.path)) - Number(driftedPaths.has(a.path)) ||
            a.path.localeCompare(b.path),
        ),
      [anchors, driftedPaths],
    );

    const entries = useMemo<AnchorEntryView[]>(
      () =>
        sorted.map((anchor) => {
          const drifted = driftedPaths.has(anchor.path);
          return {
            key: `${anchor.path}:${anchor.line}`,
            path: anchor.path,
            line: `:${anchor.line}`,
            role: anchor.role,
            excerpt: hideExcerpt ? undefined : anchor.excerpt,
            drifted,
            href: buildHref?.(anchor),
            onOpen: onOpen ? () => onOpen(anchor) : undefined,
            rowStyle: {
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto 62px",
              columnGap: 10,
              alignItems: "baseline",
              padding: "6px 0",
              borderTopStyle: "solid",
              borderTopWidth: 1,
              borderTopColor: color.line,
            },
            pathStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.meta,
              color: drifted ? color.deadline : color.ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textDecoration: "none",
            },
            lineStyle: {
              fontFamily: font.mono,
              fontVariantNumeric: "tabular-nums",
              fontSize: fontSize.caption,
              color: color.faint,
              borderBottomStyle: "dotted",
              borderBottomWidth: 1,
              borderBottomColor: color.line2,
              whiteSpace: "nowrap",
            },
            roleStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.micro,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: color.dim,
              whiteSpace: "nowrap",
            },
            excerptStyle: {
              gridColumn: "1 / -1",
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              color: color.soft,
              background: color.tint,
              padding: "4px 6px",
              overflowX: "auto",
              whiteSpace: "pre",
              display: "block",
            },
          };
        }),
      [buildHref, driftedPaths, hideExcerpt, onOpen, sorted],
    );

    const caption = useMemo(() => {
      if (!anchors.length) {
        return lifecycle === "active" ? localized.text1 : localized.text2;
      }
      const files = new Set(anchors.map((anchor) => anchor.path)).size;
      const head = `${anchors.length} ${anchors.length === 1 ? labelText.text203 : labelText.text339} in ${files} ${
        files === 1 ? labelText.text340 : localized.text3
      }.`;
      if (!driftedPaths.size) return head;

      const word = driftedPaths.size === 1 ? labelText.text341 : localized.text4;
      return `${head} ${driftedPaths.size} ${word}${localized.text5}`;
    }, [anchors, driftedPaths, lifecycle]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 4, minWidth: 0, ...style }),
      [style],
    );

    const captionStyle = useMemo<CSSProperties>(
      () => ({
        margin: 0,
        fontFamily: font.sans,
        fontSize: fontSize.base,
        color: !anchors.length && lifecycle === "active" ? color.deadline : color.ink,
      }),
      [anchors.length, lifecycle],
    );

    return (
      <Component
        containerStyle={containerStyle}
        captionStyle={captionStyle}
        entries={entries}
        caption={caption}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withAnchorMapLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
