import { render, screen } from "@testing-library/react";
import DotWithLogic, { Dot, withDotLogic } from ".";

describe("Unit tests for Dot", () => {
  it("hides from screen readers as long as it carries no label", () => {
    const { container } = render(<Dot computedStyle={{}} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("becomes an image with plain-text labelling when it has a label", () => {
    render(<Dot computedStyle={{}} label="overdue" />);
    expect(screen.getByRole("img", { name: "overdue" })).toBeInTheDocument();
  });
});

describe("Unit tests for withDotLogic", () => {
  it("is neutral and five pixels large by default", () => {
    const { container } = render(<DotWithLogic />);
    expect(container.firstChild).toHaveStyle({ width: "5px", background: "var(--ink)" });
  });

  it("translates every meaning into its colour", () => {
    const { container, rerender } = render(<DotWithLogic meaning="ok" />);
    expect(container.firstChild).toHaveStyle({ background: "var(--ok)" });
    rerender(<DotWithLogic meaning="due" />);
    expect(container.firstChild).toHaveStyle({ background: "var(--due)" });
    rerender(<DotWithLogic meaning="signal" />);
    expect(container.firstChild).toHaveStyle({ background: "var(--signal)" });
  });

  it("draws hollow dots as a ring", () => {
    const { container } = render(<DotWithLogic meaning="plan" hollow />);
    expect(container.firstChild).toHaveStyle({
      background: "transparent",
      boxShadow: "inset 0 0 0 1px var(--plan)",
    });
  });

  it("takes a custom size", () => {
    const { container } = render(<DotWithLogic size={9} />);
    expect(container.firstChild).toHaveStyle({ width: "9px", height: "9px" });
  });

  it("passes the label through", () => {
    render(<DotWithLogic label="planned" />);
    expect(screen.getByRole("img", { name: "planned" })).toBeInTheDocument();
  });

  it("gives a meaningful displayName", () => {
    expect(withDotLogic(Dot).displayName).toBe("withDotLogic(Dot)");
  });
});

describe("Snapshot tests for Dot", () => {
  it("proven", () => {
    const { container } = render(<DotWithLogic meaning="ok" label="backed" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("open", () => {
    const { container } = render(<DotWithLogic meaning="plan" hollow />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
