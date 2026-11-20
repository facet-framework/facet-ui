import { render, screen } from "@testing-library/react";
import HairlineWithLogic, { Hairline, withHairlineLogic } from ".";

describe("Unit tests for Hairline", () => {
  it("applies the computed style", () => {
    const { container } = render(<Hairline computedStyle={{ height: 1 }} />);
    expect(container.firstChild).toHaveStyle({ height: "1px" });
  });

  it("forwards the role", () => {
    render(<Hairline computedStyle={{}} role="separator" data-testid="line" />);
    expect(screen.getByTestId("line")).toHaveAttribute("role", "separator");
  });
});

describe("Unit tests for withHairlineLogic", () => {
  it("is horizontal and one pixel high by default", () => {
    const { container } = render(<HairlineWithLogic />);
    expect(container.firstChild).toHaveStyle({ height: "1px", background: "var(--line)" });
  });

  it("supports vertical orientation", () => {
    const { container } = render(<HairlineWithLogic orientation="vertical" />);
    expect(container.firstChild).toHaveStyle({ width: "1px", alignSelf: "stretch" });
  });

  it("uses a stronger line for zones", () => {
    const { container } = render(<HairlineWithLogic strength="line2" />);
    expect(container.firstChild).toHaveStyle({ background: "var(--line-2)" });
  });

  it("applies spacing along the correct axis", () => {
    const { container } = render(<HairlineWithLogic inset={8} />);
    expect(container.firstChild).toHaveStyle({ margin: "0px 8px" });
  });

  it("exposes orientation to assistive technology", () => {
    render(<HairlineWithLogic orientation="vertical" data-testid="line" />);
    expect(screen.getByTestId("line")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("sets a descriptive displayName", () => {
    expect(withHairlineLogic(Hairline).displayName).toBe("withHairlineLogic(Hairline)");
  });
});

describe("Snapshot tests for Hairline", () => {
  it("closed", () => {
    const { container } = render(<HairlineWithLogic />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("vertical and strong", () => {
    const { container } = render(<HairlineWithLogic orientation="vertical" strength="line2" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
