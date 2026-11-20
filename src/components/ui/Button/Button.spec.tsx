import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/Button/Button.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ButtonWithLogic, { Button, withButtonLogic } from ".";

describe("Unit tests for Button", () => {
  it("renders a button element", () => {
    render(<Button computedStyle={{}}>{localized.text2}</Button>);
    expect(screen.getByRole("button", { name: localized.text3 })).toHaveAttribute("type", "button");
  });

  it("reports clicks", async () => {
    const onClick = jest.fn();
    render(
      <Button computedStyle={{}} onClick={onClick}>
        {localized.text5}
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not click while disabled", async () => {
    const onClick = jest.fn();
    render(
      <Button computedStyle={{}} onClick={onClick} disabled>
        {localized.text7}
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Unit tests for withButtonLogic", () => {
  it("uses the supporting variant by default", () => {
    render(<ButtonWithLogic>{localized.text9}</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({
      background: "var(--surface)",
      borderColor: "var(--line)",
    });
  });

  it("colors the signal variant", () => {
    render(<ButtonWithLogic variant="signal">{localized.text11}</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({
      background: "var(--signal)",
      color: "var(--surface)",
    });
  });

  it("leaves the ghost variant without a background", () => {
    render(<ButtonWithLogic variant="ghost">{germanLabels.text164}</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({
      background: "none",
      borderColor: "transparent",
    });
  });

  it("preserves the minimum target height", () => {
    render(<ButtonWithLogic>{localized.text14}</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({ minHeight: "32px" });
  });

  it("dims disabled buttons", () => {
    render(<ButtonWithLogic disabled>{localized.text16}</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({ opacity: "0.5", cursor: "default" });
  });

  it("optionally fills the available width", () => {
    render(<ButtonWithLogic block>{localized.text18}</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({ width: "100%" });
  });

  it("bricht nie um", () => {
    render(<ButtonWithLogic>{localized.text19}</ButtonWithLogic>);
    expect(screen.getByRole("button")).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("sets a descriptive displayName", () => {
    expect(withButtonLogic(Button).displayName).toBe("withButtonLogic(Button)");
  });
});

describe("Snapshot tests for Button", () => {
  it("supporting", () => {
    const { container } = render(<ButtonWithLogic>{localized.text21}</ButtonWithLogic>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Signal", () => {
    const { container } = render(
      <ButtonWithLogic variant="signal">{localized.text22}</ButtonWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Ghost", () => {
    const { container } = render(
      <ButtonWithLogic variant="ghost">{germanLabels.text165}</ButtonWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
