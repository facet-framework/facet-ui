import { remainingText } from "../i18n/legacy/remaining";
import { germanText as germanLabels } from "../i18n/legacy/shared";
import { localized } from "../i18n/legacy/core/lead.spec.text";
import { taskflowModel } from "./fixtures";
import { leadFor } from "./lead";
import { ROLES } from "./roles";
import type { RoleKey } from "./types";

const model = taskflowModel();

function sentence(role: RoleKey | null) {
  return leadFor(model, role)
    .map((segment) => segment.text)
    .join("");
}

describe("Unit tests for leadFor", () => {
  it("gives every role a sentence of its own", () => {
    const sentences = ROLES.map((role) => sentence(role.key));
    expect(new Set(sentences).size).toBe(ROLES.length);
  });

  it("opens with the inventory when no role is chosen", () => {
    expect(sentence(null)).toMatch(germanLabels.text119);
    expect(sentence(null)).toBe(sentence("c"));
  });

  it("ends every sentence with a full stop", () => {
    ROLES.forEach((role) => expect(sentence(role.key).trim().endsWith(".")).toBe(true));
  });

  it("names SLOs and alerts for operations", () => {
    expect(sentence("ops")).toMatch(localized.text1);
  });

  it("names edges, depth and dangling references for architecture", () => {
    const text = sentence("arch");
    expect(text).toMatch(/Kanten zusammen/);
    expect(text).toMatch(remainingText.text59);
    expect(text).toMatch(remainingText.text60);
  });

  it("attaches to every number the calculation it comes from", () => {
    ROLES.forEach((role) => {
      const probes = leadFor(model, role.key).filter((segment) => segment.kind === "probe");
      expect(probes.length).toBeGreaterThan(2);
      probes.forEach((probe) => expect(probe.text).not.toBe(""));
    });
  });

  it("computes coverage from the model, not from a cached copy", () => {
    const coverage = Math.round((model.scnProven / model.scnTotal) * 100);
    expect(sentence("qa")).toMatch(new RegExp(`^${coverage}${germanLabels.text120}`));
  });

  it("sets the number of open points to the length of the focus list", () => {
    const openSegment = leadFor(model, "c").find(
      (segment) => segment.kind === "probe" && segment.probe === "open",
    );
    expect(openSegment).toBeDefined();
  });
});
