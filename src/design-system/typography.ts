import type { CSSProperties } from "react";
import { color, font, fontSize } from "./tokens";

export type TextVariant =
  "hero" | "display" | "title" | "lead" | "body" | "meta" | "label" | "caption" | "micro";

export type TextTone =
  "ink" | "soft" | "dim" | "faint" | "signal" | "ok" | "plan" | "deadline" | "inherit";

export const TONE_COLOR: Record<TextTone, string> = {
  ink: color.ink,
  soft: color.soft,
  dim: color.dim,
  faint: color.faint,
  signal: color.signal,
  ok: color.ok,
  plan: color.plan,
  deadline: color.deadline,
  inherit: "inherit",
};

export const VARIANT_STYLE: Record<TextVariant, CSSProperties> = {
  hero: { fontSize: fontSize.hero, lineHeight: 1.18, fontWeight: 300, letterSpacing: "-0.015em" },
  display: { fontSize: fontSize.display, lineHeight: 1.25, fontWeight: 300 },
  title: { fontSize: fontSize.title, lineHeight: 1.3, fontWeight: 400 },
  lead: { fontSize: fontSize.lead, lineHeight: 1.5, fontWeight: 400 },
  body: { fontSize: fontSize.base, lineHeight: 1.6, fontWeight: 400 },
  meta: { fontSize: fontSize.meta, lineHeight: 1.5, fontWeight: 400 },
  label: {
    fontSize: fontSize.label,
    lineHeight: 1.3,
    fontWeight: 500,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  caption: {
    fontSize: fontSize.caption,
    lineHeight: 1.3,
    fontWeight: 500,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  micro: {
    fontSize: fontSize.micro,
    lineHeight: 1.3,
    fontWeight: 500,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
  },
};

export type TextStyleOptions = {
  variant: TextVariant;
  tone: TextTone;

  mono?: boolean;

  truncate?: boolean;

  clamp?: number;
  align?: CSSProperties["textAlign"];
  weight?: CSSProperties["fontWeight"];
  nowrap?: boolean;

  tabular?: boolean;
};

export function textStyle(options: TextStyleOptions): CSSProperties {
  const { variant, tone, mono, truncate, clamp, align, weight, nowrap, tabular } = options;

  const style: CSSProperties = {
    ...VARIANT_STYLE[variant],
    color: TONE_COLOR[tone],
    fontFamily: mono ? font.mono : font.sans,
    margin: 0,
    minWidth: 0,
  };

  if (weight) style.fontWeight = weight;
  if (align) style.textAlign = align;
  if (nowrap) style.whiteSpace = "nowrap";
  if (tabular) style.fontVariantNumeric = "tabular-nums";

  if (truncate) {
    style.whiteSpace = "nowrap";
    style.overflow = "hidden";
    style.textOverflow = "ellipsis";
  }

  if (clamp && clamp > 0) {
    style.display = "-webkit-box";
    style.WebkitBoxOrient = "vertical";
    style.WebkitLineClamp = clamp;
    style.overflow = "hidden";
  }

  return style;
}
