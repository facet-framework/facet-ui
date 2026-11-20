import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/QuietLine/QuietLine.spec.text";
import { render, screen } from "@testing-library/react";
import QuietLineWithLogic, { QuietLine, withQuietLineLogic } from ".";

describe("Unit tests for QuietLine", () => {
  it("broad base", () => {
    render(<QuietLine computedStyle={{}}>{localized.text1}</QuietLine>);
    expect(screen.getByText(localized.text2).tagName).toBe("P");
  });

  it("applies the computed style", () => {
    render(
      <QuietLine computedStyle={{ color: "rgb(74, 79, 86)" }} data-testid={"quiet"}>
        still
      </QuietLine>,
    );
    expect(screen.getByTestId("quiet")).toHaveStyle({ color: "rgb(74, 79, 86)" });
  });
});

describe("Unit tests for withQuietLineLogic", () => {
  it("uses muted monospace text", () => {
    render(<QuietLineWithLogic data-testid={"quiet"}>{localized.text5}</QuietLineWithLogic>);
    expect(screen.getByTestId("quiet")).toHaveStyle({
      color: "var(--dim)",
      fontFamily: "var(--font-mono)",
    });
  });

  it("colors a healthy quiet state green", () => {
    render(
      <QuietLineWithLogic tone="ok" data-testid={"quiet"}>
        {germanLabels.text172}
      </QuietLineWithLogic>,
    );
    expect(screen.getByTestId("quiet")).toHaveStyle({ color: "var(--ok)" });
  });

  it("accepts custom styles", () => {
    render(
      <QuietLineWithLogic style={{ maxWidth: 200 }} data-testid={"quiet"}>
        still
      </QuietLineWithLogic>,
    );
    expect(screen.getByTestId("quiet")).toHaveStyle({ maxWidth: "200px" });
  });

  it("sets a descriptive displayName", () => {
    expect(withQuietLineLogic(QuietLine).displayName).toBe("withQuietLineLogic(QuietLine)");
  });
});

describe("Snapshot tests for QuietLine", () => {
  it("Quiet line", () => {
    const { container } = render(<QuietLineWithLogic>{localized.text9}</QuietLineWithLogic>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Quiet line as a positive result", () => {
    const { container } = render(
      <QuietLineWithLogic tone="ok">{localized.text10}</QuietLineWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
