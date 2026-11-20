import { SUMMARY } from "./summary";
import type { HistoryEntry, NavItem } from "../shell/Shell";
import { useMemo } from "react";
import { createText, useText, type FacetText } from "../i18n/TextProvider";
/** The reader roles, in menu order; their names and purposes are `shell.role.<key>.*`. */
const OVERVIEW_ROLE_KEYS = [
  "leadership",
  "dev",
  "review",
  "author",
  "owner",
  "newcomer",
  "agent",
] as const;

/** The navigation entries in the language of `t`; `overview` is the current one. */
export function navFor(t: FacetText["t"]): NavItem[] {
  return [
    { key: "overview", label: t("shell.nav.item.overview"), icon: "home", current: true },
    { key: "product", label: t("shell.nav.item.product"), icon: "product" },
    {
      key: "records",
      label: t("shell.nav.item.records"),
      icon: "records",
      badge: SUMMARY.driftRecords,
    },
    { key: "contents", label: t("shell.nav.item.contents"), icon: "contents" },
    { key: "glossary", label: t("shell.nav.item.glossary"), icon: "book" },
    { key: "adr", label: t("shell.nav.item.adr"), icon: "decision", plugin: true },
    { key: "bpmn", label: t("shell.nav.item.bpmn"), icon: "process", plugin: true },
  ];
}

/** `navFor` in the language of the nearest provider. */
export function useNav(): NavItem[] {
  const { t } = useText();
  return useMemo(() => navFor(t), [t]);
}

/** The navigation in English, the default language, for specs and stories. */
export const NAV: NavItem[] = navFor(createText("en").t);

/** The reader roles with their names and purposes in the language of `t`. */
export function rolesFor(t: FacetText["t"]) {
  return OVERVIEW_ROLE_KEYS.map((key) => ({
    key,
    name: t(`shell.role.${key}.name`),
    purpose: t(`shell.role.${key}.purpose`),
  }));
}

/** `rolesFor` in the language of the nearest provider. */
export function useRoles() {
  const { t } = useText();
  return useMemo(() => rolesFor(t), [t]);
}

export const HISTORY: HistoryEntry[] = [
  {
    key: "h1",
    time: "14:08",
    label: "adr-plugin",
    kind: "record",
    sub: "navigation/atlas",
    current: true,
  },
  { key: "h2", time: "14:06", label: "Capability atlas", kind: "overview", sub: "navigation" },
  { key: "h3", time: "14:05", label: "Area navigation", kind: "overview" },
  { key: "h4", time: "14:02", label: "Decisions", kind: "plugin", sub: "480 ADRs" },
  { key: "h5", time: "13:58", label: "commit-gate", kind: "record", sub: "authoring/guardrails" },
  { key: "h6", time: "13:51", label: "Product", kind: "area" },
  { key: "h7", time: "13:50", label: "Overview", kind: "overviewPage" },
];
