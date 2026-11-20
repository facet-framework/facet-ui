import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/Dot/Dot.spec.text";
import { render, screen } from "@testing-library/react";
import DotWithLogic, { Dot, withDotLogic } from ".";

describe("Unit tests for Dot", () => {
  it("hides from screen readers without a label", () => {
    const { container } = render(<Dot computedStyle={{}} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes a named image when labeled", () => {
    render(<Dot computedStyle={{}} label={localized.text3} />);
    expect(screen.getByRole("img", { name: localized.text4 })).toBeInTheDocument();
  });
});

describe("Unit tests for withDotLogic", () => {
  it("is neutral and five pixels wide by default", () => {
    const { container } = render(<DotWithLogic />);
    expect(container.firstChild).toHaveStyle({ width: "5px", background: "var(--ink)" });
  });

  it("maps each meaning to its color", () => {
    const { container, rerender } = render(<DotWithLogic meaning="ok" />);
    expect(container.firstChild).toHaveStyle({ background: "var(--ok)" });
    rerender(<DotWithLogic meaning="deadline" />);
    expect(container.firstChild).toHaveStyle({ background: "var(--deadline)" });
    rerender(<DotWithLogic meaning="signal" />);
    expect(container.firstChild).toHaveStyle({ background: "var(--signal)" });
  });

  it("shows the value immediately when animation is disabled", () => {
    const { container } = render(<DotWithLogic meaning="plan" hollow />);
    expect(container.firstChild).toHaveStyle({
      background: "transparent",
      boxShadow: "inset 0 0 0 1px var(--plan)",
    });
  });

  it("accepts a custom size", () => {
    const { container } = render(<DotWithLogic size={9} />);
    expect(container.firstChild).toHaveStyle({ width: "9px", height: "9px" });
  });

  it("forwards the label", () => {
    render(<DotWithLogic label={remainingText.text23} />);
    expect(screen.getByRole("img", { name: remainingText.text23 })).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withDotLogic(Dot).displayName).toBe("withDotLogic(Dot)");
  });
});

describe("Snapshot tests for Dot", () => {
  it("describes the share in plain language", () => {
    const { container } = render(<DotWithLogic meaning="ok" label={germanLabels.text185} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("open", () => {
    const { container } = render(<DotWithLogic meaning="plan" hollow />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
