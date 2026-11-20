import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { germanText as germanLabels } from "../i18n/legacy/shared";
import { localized } from "../i18n/legacy/core/roles";

import type { RoleDef, RoleKey } from "./types";

export const ROLES: readonly RoleDef[] = [
  {
    key: "c",
    tag: localized.text1,
    title: localized.text2,
    hint: labelText.text378,
  },
  { key: "arch", tag: labelText.text379, title: labelText.text380, hint: localized.text3 },
  {
    key: "delivery",
    tag: labelText.text381,
    title: labelText.text382,
    hint: germanLabels.text117,
  },
  { key: "eng", tag: labelText.text383, title: labelText.text49, hint: germanLabels.text118 },
  { key: "qa", tag: localized.text4, title: localized.text5, hint: localized.text6 },
  { key: "po", tag: labelText.text384, title: labelText.text43, hint: localized.text7 },
  { key: "gov", tag: "COMPLIANCE", title: "Compliance", hint: localized.text8 },
  { key: "ops", tag: remainingText.text58, title: remainingText.text15, hint: localized.text9 },
];

export function roleByKey(key: RoleKey | null | undefined): RoleDef {
  return ROLES.find((r) => r.key === key) ?? ROLES[0];
}

export function nextRole(key: RoleKey | null | undefined): RoleKey {
  const index = ROLES.findIndex((r) => r.key === key);
  return ROLES[(index + 1) % ROLES.length].key;
}
