import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ButtonWithLogic, { Button, withButtonLogic } from ".";

describe("Unit tests for Button", () => {
  it("renders a button of type button", () => {
    render(<Button computedStyle={{}}>Open</Button>);
    expect(screen.getByRole("button", { name: "Open" })).toHaveAttribute("type", "button");
  });

  it("reports clicks", async () => {
    const onClick = jest.fn();
    render(
      <Button computedStyle={{}} onClick={onClick}>
        Open
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not click when disabled", async () => {
    const onClick = jest.fn();
    render(
      <Button computedStyle={{}} onClick={onClick} disabled>
        Open
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Unit tests for withButtonLogic", () => {
  it("is quiet by default", () => {
    render(<ButtonWithLogic>Register</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({
      background: "var(--surface)",
      borderColor: "var(--line)",
    });
  });

  it("colours the signal variant", () => {
    render(<ButtonWithLogic variant="signal">Open</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({
      background: "var(--signal)",
      color: "var(--surface)",
    });
  });

  it("leaves ghost without a fill", () => {
    render(<ButtonWithLogic variant="ghost">all 16</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({
      background: "none",
      borderColor: "transparent",
    });
  });

  it("keeps the minimum height of the hit area", () => {
    render(<ButtonWithLogic>Open</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({ minHeight: "32px" });
  });

  it("dims the disabled button", () => {
    render(<ButtonWithLogic disabled>no target</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({ opacity: "0.5", cursor: "default" });
  });

  it("fills the full width on request", () => {
    render(<ButtonWithLogic block>Open</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({ width: "100%" });
  });

  it("never wraps", () => {
    render(<ButtonWithLogic>A long label</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("assigns a descriptive displayName", () => {
    expect(withButtonLogic(Button).displayName).toBe("withButtonLogic(Button)");
  });
});

describe("Snapshot tests for Button", () => {
  it("quiet", () => {
    const { container } = render(<ButtonWithLogic>Register</ButtonWithLogic>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Signal", () => {
    const { container } = render(<ButtonWithLogic variant="signal">Open</ButtonWithLogic>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Ghost", () => {
    const { container } = render(<ButtonWithLogic variant="ghost">all 16 →</ButtonWithLogic>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
