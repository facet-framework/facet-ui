import { localized } from "../../../i18n/legacy/components/ui/Stack/Stack.spec.text";
import { render, screen } from "@testing-library/react";
import StackWithLogic, { Stack, withStackLogic } from ".";

describe("Unit tests for Stack", () => {
  it("forwards props", () => {
    render(<Stack computedStyle={{}}>{localized.text1}</Stack>);
    expect(screen.getByText(localized.text2)).toBeInTheDocument();
  });

  it("applies the computed style", () => {
    const { container } = render(<Stack computedStyle={{ display: "flex", gap: "12px" }} />);
    expect(container.firstChild).toHaveStyle({ display: "flex", gap: "12px" });
  });

  it("highlights placeholders as gaps", () => {
    render(<Stack computedStyle={{}} data-testid={"track"} aria-label="Index" />);
    expect(screen.getByTestId("track")).toHaveAttribute("aria-label", "Index");
  });
});

describe("Unit tests for withStackLogic", () => {
  it("stacks vertically by default", () => {
    const { container } = render(<StackWithLogic />);
    expect(container.firstChild).toHaveStyle({ flexDirection: "column" });
  });

  it("supports a horizontal row", () => {
    const { container } = render(<StackWithLogic direction="row" />);
    expect(container.firstChild).toHaveStyle({ flexDirection: "row" });
  });

  it("accepts parsed steps", () => {
    const { container } = render(<StackWithLogic gap={12} />);
    expect(container.firstChild).toHaveStyle({ gap: "12px" });
  });

  it("resolves spacing tokens", () => {
    const { container } = render(<StackWithLogic gap="s4" />);
    expect(container.firstChild).toHaveStyle({ gap: "var(--space-4)" });
  });

  it("sets wrapping and alignment", () => {
    const { container } = render(<StackWithLogic wrap align="center" justify="space-between" />);
    expect(container.firstChild).toHaveStyle({
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
    });
  });

  it("allows the row to grow and shrink", () => {
    const { container } = render(<StackWithLogic grow />);
    expect(container.firstChild).toHaveStyle({ flex: "1 1 auto", minWidth: "0" });
  });

  it("sets a descriptive displayName", () => {
    expect(withStackLogic(Stack).displayName).toBe("withStackLogic(Stack)");
  });
});

describe("Snapshot tests for Stack", () => {
  it("vertical trail", () => {
    const { container } = render(
      <StackWithLogic gap="s2">
        <span>a</span>
        <span>b</span>
      </StackWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("horizontal wrapping trail", () => {
    const { container } = render(<StackWithLogic direction="row" gap={8} wrap />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
