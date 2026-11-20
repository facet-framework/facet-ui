import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { ListRow } from "./display";

/**
 * Names, ids, paths and titles never truncate: they wrap. jsdom has no layout,
 * so the rendered element is tied to the stylesheet rule that styles it, and
 * that rule is read as text.
 */
const baseCss = readFileSync(join(__dirname, "..", "styles", "base.css"), "utf8");

/** Body of the top-level rule whose selector is exactly `.${cls}`, or null. */
function ruleFor(cls: string): string | null {
  const escaped = cls.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
  const match = new RegExp(`(?:^|\\n)\\.${escaped} \\{([^}]*)\\}`).exec(baseCss);
  return match ? match[1] : null;
}

const LONG_ID =
  "authoring/guardrails/a-very-long-item-slug-that-has-no-spaces-and-must-break-somewhere-instead-of-being-cut";

describe("names wrap instead of being cut with an ellipsis", () => {
  it("a list row title renders in full and its rule does not truncate", () => {
    render(<ListRow title={LONG_ID} sub="a short description" />);
    const title = screen.getByText(LONG_ID);
    // The whole name is in the DOM, nothing replaced by "…".
    expect(title.textContent).toBe(LONG_ID);

    const classes = Array.from(title.classList);
    expect(classes.length).toBeGreaterThan(0);
    const rules = classes.map(ruleFor).filter((r): r is string => r !== null);
    // Precondition: the stylesheet rule for the rendered title was found at all.
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule).not.toMatch(/text-overflow:\s*ellipsis/);
      expect(rule).not.toMatch(/white-space:\s*nowrap/);
    }
    expect(rules.join("\n")).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it("a list row sub line wraps but is clamped to two lines", () => {
    render(<ListRow title="Commit gate" sub="a description excerpt" />);
    const sub = screen.getByText("a description excerpt");
    const rules = Array.from(sub.classList)
      .map(ruleFor)
      .filter((r): r is string => r !== null);
    expect(rules.length).toBeGreaterThan(0);
    const text = rules.join("\n");
    expect(text).not.toMatch(/white-space:\s*nowrap/);
    expect(text).toMatch(/-webkit-line-clamp:\s*2/);
    expect(text).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it("the .t-wrap utility exists and breaks long ids", () => {
    const rule = ruleFor("t-wrap");
    expect(rule).not.toBeNull();
    expect(rule).toMatch(/overflow-wrap:\s*anywhere/);
    expect(rule).toMatch(/min-width:\s*0/);
    expect(rule).not.toMatch(/text-overflow|white-space/);
  });
});
