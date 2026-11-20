import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SheetWithLogic, { Sheet, withSheetLogic } from ".";

describe("Unit tests for Sheet", () => {
  it("renders nothing while it is closed", () => {
    const { container } = render(
      <Sheet
        scrimStyle={{}}
        panelStyle={{}}
        open={false}
        label="Register"
        onScrimClick={jest.fn()}
        onKeyDown={jest.fn()}
      >
        <p>Content</p>
      </Sheet>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is a dialog with plain words when open", () => {
    render(
      <Sheet
        scrimStyle={{}}
        panelStyle={{}}
        open
        label="Register"
        onScrimClick={jest.fn()}
        onKeyDown={jest.fn()}
      >
        <p>Content</p>
      </Sheet>,
    );
    expect(screen.getByRole("dialog", { name: "Register" })).toHaveAttribute("aria-modal", "true");
  });

  it("closes on a click on the scrim, not inside", async () => {
    const onScrimClick = jest.fn();
    render(
      <Sheet
        scrimStyle={{}}
        panelStyle={{}}
        open
        label="Register"
        onScrimClick={onScrimClick}
        onKeyDown={jest.fn()}
        data-testid="scrim"
      >
        <p>Content</p>
      </Sheet>,
    );
    await userEvent.click(screen.getByText("Content"));
    expect(onScrimClick).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("scrim"));
    expect(onScrimClick).toHaveBeenCalledTimes(1);
  });
});

describe("Unit tests for withSheetLogic", () => {
  it("closes with Escape", async () => {
    const onClose = jest.fn();
    render(
      <SheetWithLogic open label="Register" onClose={onClose}>
        <p>Content</p>
      </SheetWithLogic>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("gives the register the focus when opening", () => {
    render(
      <SheetWithLogic open label="Register">
        <p>Content</p>
      </SheetWithLogic>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("accepts its own height", () => {
    render(
      <SheetWithLogic open label="Register" height="60%">
        <p>Content</p>
      </SheetWithLogic>,
    );
    expect(screen.getByRole("dialog")).toHaveStyle({ height: "60%" });
  });

  it("copes without a close callback", async () => {
    render(
      <SheetWithLogic open label="Register">
        <p>Content</p>
      </SheetWithLogic>,
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("assigns a descriptive displayName", () => {
    expect(withSheetLogic(Sheet).displayName).toBe("withSheetLogic(Sheet)");
  });
});

describe("Snapshot tests for Sheet", () => {
  it("open", () => {
    const { container } = render(
      <SheetWithLogic open label="Register">
        <p>Content</p>
      </SheetWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("closed", () => {
    const { container } = render(
      <SheetWithLogic open={false} label="Register">
        <p>Content</p>
      </SheetWithLogic>,
    );
    expect(container).toMatchSnapshot();
  });
});
