import { render, screen } from "@testing-library/react";
import StackWithLogic, { Stack, withStackLogic } from ".";

describe("Unit tests for Stack", () => {
  it("renders its children", () => {
    render(<Stack computedStyle={{}}>Content</Stack>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("applies the computed style", () => {
    const { container } = render(<Stack computedStyle={{ display: "flex", gap: "12px" }} />);
    expect(container.firstChild).toHaveStyle({ display: "flex", gap: "12px" });
  });

  it("passes attributes through", () => {
    render(<Stack computedStyle={{}} data-testid="stack" aria-label="Index" />);
    expect(screen.getByTestId("stack")).toHaveAttribute("aria-label", "Index");
  });
});

describe("Unit tests for withStackLogic", () => {
  it("stacks vertically by default", () => {
    const { container } = render(<StackWithLogic />);
    expect(container.firstChild).toHaveStyle({ flexDirection: "column" });
  });

  it("switches to a horizontal track", () => {
    const { container } = render(<StackWithLogic direction="row" />);
    expect(container.firstChild).toHaveStyle({ flexDirection: "row" });
  });

  it("takes the gap as a number", () => {
    const { container } = render(<StackWithLogic gap={12} />);
    expect(container.firstChild).toHaveStyle({ gap: "12px" });
  });

  it("resolves token gaps", () => {
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

  it("lets the track grow and shrink", () => {
    const { container } = render(<StackWithLogic grow />);
    expect(container.firstChild).toHaveStyle({ flex: "1 1 auto", minWidth: "0" });
  });

  it("assigns a descriptive displayName", () => {
    expect(withStackLogic(Stack).displayName).toBe("withStackLogic(Stack)");
  });
});

describe("Snapshot tests for Stack", () => {
  it("vertical track", () => {
    const { container } = render(
      <StackWithLogic gap="s2">
        <span>a</span>
        <span>b</span>
      </StackWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("horizontal, wrapping track", () => {
    const { container } = render(<StackWithLogic direction="row" gap={8} wrap />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
