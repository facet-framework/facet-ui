import { remainingText } from "../i18n/legacy/remaining";
import { ROLES, nextRole, roleByKey } from "./roles";

describe("Unit tests for roles", () => {
  it("recognizes all eight role-gate roles", () => {
    expect(ROLES).toHaveLength(8);
    expect(ROLES.map((role) => role.key)).toContain("gov");
  });

  it("provides a term and hint for every role", () => {
    ROLES.forEach((role) => {
      expect(role.tag).not.toBe("");
      expect(role.title).not.toBe("");
      expect(role.hint).not.toBe("");
    });
  });

  it("preserves numbered role order", () => {
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

  it("finds roles by key", () => {
    expect(roleByKey("ops").title).toBe(remainingText.text15);
  });

  it("falls back to the first role without a selection", () => {
    expect(roleByKey(null).key).toBe("c");
    expect(roleByKey(undefined).key).toBe("c");
  });

  it("cycles through choices", () => {
    expect(nextRole("c")).toBe("arch");
    expect(nextRole("ops")).toBe("c");
  });

  it("starts with the first role without a selection", () => {
    expect(nextRole(null)).toBe("c");
  });
});
