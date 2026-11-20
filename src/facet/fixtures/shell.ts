import { labelText } from "../../i18n/legacy/labels";
import { germanText as germanLabels } from "../../i18n/legacy/shared";
import { localized } from "../../i18n/legacy/facet/fixtures/shell";
import { SUMMARY } from "./summary";
import type { HistoryEntry, NavItem } from "../shell/Shell";
import { useMemo } from "react";
import { createText, useText, type FacetText } from "../i18n/TextProvider";
import { OVERVIEW_ROLE_KEYS } from "../screens/a-frame/OverviewPage";

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

export function useNav(): NavItem[] {
  const { t } = useText();
  return useMemo(() => navFor(t), [t]);
}

export const NAV: NavItem[] = navFor(createText("de").t);

export function rolesFor(t: FacetText["t"]) {
  return OVERVIEW_ROLE_KEYS.map((key) => ({
    key,
    name: t(`shell.role.${key}.name`),
    purpose: t(`shell.role.${key}.purpose`),
  }));
}

export function useRoles() {
  const { t } = useText();
  return useMemo(() => rolesFor(t), [t]);
}

export const HISTORY: HistoryEntry[] = [
  {
    key: "h1",
    time: "14:08",
    label: "column",
    kind: "dossier",
    sub: "workspace/board",
    current: true,
  },
  { key: "h2", time: "14:06", label: localized.text1, kind: "overview", sub: "workspace" },
  { key: "h3", time: "14:05", label: localized.text2, kind: "overview" },
  { key: "h4", time: "14:02", label: labelText.text65, kind: "plugin", sub: "480 ADRs" },
  { key: "h5", time: "13:58", label: "admin", kind: "dossier", sub: "lists/permissions" },
  { key: "h6", time: "13:51", label: labelText.text43, kind: "area" },
  { key: "h7", time: "13:50", label: germanLabels.text7, kind: "situation" },
];
