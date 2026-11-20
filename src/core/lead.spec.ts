import { createText } from "../facet/i18n/text";
import { taskflowModel } from "./fixtures";
import { leadFor } from "./lead";
import { ROLES } from "./roles";
import type { RoleKey } from "./types";

const model = taskflowModel();

/** The sentence as running text, as it appears on screen. */
function sentence(role: RoleKey | null, locale = "en") {
  return leadFor(model, role, createText(locale))
    .map((segment) => segment.text)
    .join("");
}

describe("Unit tests for leadFor", () => {
  it("formats lead probes in the active locale", () => {
    const counted = { ...model, maxDepth: 1000 };
    const depth = (locale: string) =>
      leadFor(counted, "arch", createText(locale)).find(
        (segment) => segment.kind === "probe" && segment.text.includes("000"),
      )?.text;
    expect(depth("en")).toBe("1,000");
    expect(depth("de")).toBe("1.000");
  });

  it("gives every role a sentence of its own", () => {
    const sentences = ROLES.map((role) => sentence(role.key));
    expect(new Set(sentences).size).toBe(ROLES.length);
  });

  it("opens with the inventory when no role is chosen", () => {
    expect(sentence(null)).toMatch(/^This software consists of /);
    expect(sentence(null)).toBe(sentence("c"));
  });

  it("ends every sentence with a full stop", () => {
    ROLES.forEach((role) => expect(sentence(role.key).trim().endsWith(".")).toBe(true));
  });

  it("names SLOs and alerts for operations", () => {
    expect(sentence("ops")).toMatch(/SLOs and .* alerts are on file/);
  });

  it("names edges, depth and dangling references for architecture", () => {
    const text = sentence("arch");
    expect(text).toMatch(/edges, the longest chain/);
    expect(text).toMatch(/levels deep/);
    expect(text).toMatch(/point into nothing/);
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
    expect(sentence("qa")).toMatch(new RegExp(`^${coverage}% of the promised behaviour`));
    expect(sentence("qa", "de")).toMatch(new RegExp(`^${coverage} % des zugesagten Verhaltens`));
  });

  it("speaks German under the German text, with the numbers in the same places", () => {
    expect(sentence(null, "de")).toMatch(/^Diese Software besteht aus /);
    expect(sentence("ops", "de")).toMatch(/SLOs und .* Alarme sind hinterlegt/);
    const probes = (locale: string) =>
      leadFor(model, "arch", createText(locale))
        .filter((segment) => segment.kind === "probe")
        .map((segment) => segment.text);
    expect(probes("de")).toEqual(probes("en"));
  });

  it("keeps a slot the dictionary names but the role does not fill as plain text", () => {
    const text = createText("en", { "core.lead.ops": "{{slos}} SLOs, {{unknown}} more." });
    const segments = leadFor(model, "ops", text);
    expect(segments.map((segment) => segment.kind)).toEqual(["probe", "text", "text", "text"]);
    expect(segments.map((segment) => segment.text).join("")).toMatch(/\{\{unknown\}\} more\.$/);
  });

  it("sets the number of open points to the length of the focus list", () => {
    const openSegment = leadFor(model, "c").find(
      (segment) => segment.kind === "probe" && segment.probe === "open",
    );
    expect(openSegment).toBeDefined();
  });
});
