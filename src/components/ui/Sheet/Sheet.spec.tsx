import { localized } from "../../../i18n/legacy/components/ui/Sheet/Sheet.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SheetWithLogic, { Sheet, withSheetLogic } from ".";

describe("Unit tests for Sheet", () => {
  it("renders nothing while closed", () => {
    const { container } = render(
      <Sheet
        scrimStyle={{}}
        panelStyle={{}}
        open={false}
        label={localized.text2}
        onScrimClick={jest.fn()}
        onKeyDown={jest.fn()}
      >
        <p>{localized.text3}</p>
      </Sheet>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes an accessible dialog while open", () => {
    render(
      <Sheet
        scrimStyle={{}}
        panelStyle={{}}
        open
        label={localized.text5}
        onScrimClick={jest.fn()}
        onKeyDown={jest.fn()}
      >
        <p>{localized.text6}</p>
      </Sheet>,
    );
    expect(screen.getByRole("dialog", { name: localized.text7 })).toHaveAttribute(
      "aria-modal",
      "true",
    );
  });

  it("closes on backdrop clicks but not inside", async () => {
    const onScrimClick = jest.fn();
    render(
      <Sheet
        scrimStyle={{}}
        panelStyle={{}}
        open
        label={localized.text9}
        onScrimClick={onScrimClick}
        onKeyDown={jest.fn()}
        data-testid="scrim"
      >
        <p>{localized.text10}</p>
      </Sheet>,
    );
    await userEvent.click(screen.getByText(localized.text11));
    expect(onScrimClick).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("scrim"));
    expect(onScrimClick).toHaveBeenCalledTimes(1);
  });
});

describe("Unit tests for withSheetLogic", () => {
  it("closes on Escape", async () => {
    const onClose = jest.fn();
    render(
      <SheetWithLogic open label={localized.text13} onClose={onClose}>
        <p>{localized.text14}</p>
      </SheetWithLogic>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focuses the register when opened", () => {
    render(
      <SheetWithLogic open label={localized.text16}>
        <p>{localized.text17}</p>
      </SheetWithLogic>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("accepts a custom height", () => {
    render(
      <SheetWithLogic open label={localized.text19} height="60%">
        <p>{localized.text20}</p>
      </SheetWithLogic>,
    );
    expect(screen.getByRole("dialog")).toHaveStyle({ height: "60%" });
  });

  it("handles a missing close callback", async () => {
    render(
      <SheetWithLogic open label={localized.text22}>
        <p>{localized.text23}</p>
      </SheetWithLogic>,
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("sets a descriptive displayName", () => {
    expect(withSheetLogic(Sheet).displayName).toBe("withSheetLogic(Sheet)");
  });
});

describe("Snapshot tests for Sheet", () => {
  it("open", () => {
    const { container } = render(
      <SheetWithLogic open label={localized.text26}>
        <p>{localized.text27}</p>
      </SheetWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("compact", () => {
    const { container } = render(
      <SheetWithLogic open={false} label={localized.text28}>
        <p>{localized.text29}</p>
      </SheetWithLogic>,
    );
    expect(container).toMatchSnapshot();
  });
});
