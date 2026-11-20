/**
 * The eight roles from the role gate ("What are you here for?").
 *
 * The choice determines **the order, not the access**: it decides which lead
 * sentence opens the overview and which numbers appear in it. No section is
 * hidden, no record becomes unreachable.
 */

import type { TextKey } from "../facet/i18n/en";
import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import type { RoleDef, RoleKey } from "./types";

const ROLE_KEYS: readonly RoleKey[] = ["c", "arch", "delivery", "eng", "qa", "po", "gov", "ops"];

/** The eight roles with their tag, title and hint in the language of `text`. */
export function rolesIn(text: FacetText = ENGLISH_TEXT): readonly RoleDef[] {
  return ROLE_KEYS.map((key) => ({
    key,
    tag: text.t(`core.roles.${key}.tag` as TextKey),
    title: text.t(`core.roles.${key}.title` as TextKey),
    hint: text.t(`core.roles.${key}.hint` as TextKey),
  }));
}

/** The eight roles in English. `rolesIn(text)` gives them in another language. */
export const ROLES: readonly RoleDef[] = rolesIn();

export function roleByKey(
  key: RoleKey | null | undefined,
  text: FacetText = ENGLISH_TEXT,
): RoleDef {
  const roles = text === ENGLISH_TEXT ? ROLES : rolesIn(text);
  return roles.find((r) => r.key === key) ?? roles[0];
}

/**
 * The next role in the cycle.
 *
 * The header shows the current role as a plain term; a click moves on. A
 * selection dialog for eight short words would be more detour than choice —
 * the gate appears on first opening, and after that switching is a minor
 * matter.
 */
export function nextRole(key: RoleKey | null | undefined): RoleKey {
  const index = ROLES.findIndex((r) => r.key === key);
  return ROLES[(index + 1) % ROLES.length].key;
}
