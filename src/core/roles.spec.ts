import { createText } from "../facet/i18n/text";
import { ROLES, nextRole, roleByKey, rolesIn } from "./roles";

const germanText = createText("de");

describe("Unit tests for roles", () => {
  it("knows the eight roles from the role gate", () => {
    expect(ROLES).toHaveLength(8);
    expect(ROLES.map((role) => role.key)).toContain("gov");
  });

  it("returns every role with its factual term and hint", () => {
    ROLES.forEach((role) => {
      expect(role.tag).not.toBe("");
      expect(role.title).not.toBe("");
      expect(role.hint).not.toBe("");
    });
  });

  it("keeps the order of the numbered roles in the gate", () => {
    expect(ROLES.map((role) => role.key)).toEqual([
      "c",
      "arch",
      "delivery",
      "eng",
      "qa",
      "po",
      "gov",
      "ops",
    ]);
  });

  it("finds a role by its key", () => {
    expect(roleByKey("ops").title).toBe("Operations");
  });

  it("names the roles in German under the German text", () => {
    const de = createText("de");
    expect(roleByKey("ops", de).title).toBe(germanText.t("core.roles.ops.title"));
    expect(roleByKey(null, de).tag).toBe(germanText.t("core.roles.c.tag"));
    expect(rolesIn(de).map((role) => role.key)).toEqual(ROLES.map((role) => role.key));
  });

  it("falls back to the first role without a choice", () => {
    expect(roleByKey(null).key).toBe("c");
    expect(roleByKey(undefined).key).toBe("c");
  });

  it("cycles round", () => {
    expect(nextRole("c")).toBe("arch");
    expect(nextRole("ops")).toBe("c");
  });

  it("starts at the first role without a choice", () => {
    // findIndex gives -1, and -1 + 1 is the start — not the last role.
    expect(nextRole(null)).toBe("c");
  });
});
