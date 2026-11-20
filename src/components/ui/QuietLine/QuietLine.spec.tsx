import { render, screen } from "@testing-library/react";
import QuietLineWithLogic, { QuietLine, withQuietLineLogic } from ".";

describe("Unit tests for QuietLine", () => {
  it("renders the sentence as a paragraph", () => {
    render(<QuietLine computedStyle={{}}>No check is overdue.</QuietLine>);
    expect(screen.getByText("No check is overdue.").tagName).toBe("P");
  });

  it("takes over the computed style", () => {
    render(
      <QuietLine computedStyle={{ color: "rgb(74, 79, 86)" }} data-testid="quiet">
        calm
      </QuietLine>,
    );
    expect(screen.getByTestId("quiet")).toHaveStyle({ color: "rgb(74, 79, 86)" });
  });
});

describe("Unit tests for withQuietLineLogic", () => {
  it("is muted and set in mono", () => {
    render(<QuietLineWithLogic data-testid="quiet">nothing open</QuietLineWithLogic>);
    expect(screen.getByTestId("quiet")).toHaveStyle({
      color: "var(--dim)",
      fontFamily: "var(--font-mono)",
    });
  });

  it("colours a good quiet green", () => {
    render(
      <QuietLineWithLogic tone="ok" data-testid="quiet">
        everything backed
      </QuietLineWithLogic>,
    );
    expect(screen.getByTestId("quiet")).toHaveStyle({ color: "var(--ok)" });
  });

  it("allows custom styles", () => {
    render(
      <QuietLineWithLogic style={{ maxWidth: 200 }} data-testid="quiet">
        calm
      </QuietLineWithLogic>,
    );
    expect(screen.getByTestId("quiet")).toHaveStyle({ maxWidth: "200px" });
  });

  it("gives a meaningful displayName", () => {
    expect(withQuietLineLogic(QuietLine).displayName).toBe("withQuietLineLogic(QuietLine)");
  });
});

describe("Snapshot tests for QuietLine", () => {
  it("quiet line", () => {
    const { container } = render(<QuietLineWithLogic>No check is overdue.</QuietLineWithLogic>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("quiet line as a good result", () => {
    const { container } = render(
      <QuietLineWithLogic tone="ok">Every record has a team.</QuietLineWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
