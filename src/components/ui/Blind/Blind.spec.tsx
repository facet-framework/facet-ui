import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlindWithLogic, { Blind, withBlindLogic } from ".";

const styles = { scrimStyle: {}, panelStyle: {} };

describe("Unit tests for Blind", () => {
  it("renders nothing while it is closed", () => {
    const { container } = render(
      <Blind {...styles} open={false} label="Detail" onScrimClick={jest.fn()} onKeyDown={jest.fn()}>
        <p>Content</p>
      </Blind>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is a dialog with plain words when open", () => {
    render(
      <Blind
        {...styles}
        open
        label="Detail: Quick add"
        onScrimClick={jest.fn()}
        onKeyDown={jest.fn()}
      >
        <p>Content</p>
      </Blind>,
    );
    expect(screen.getByRole("dialog", { name: "Detail: Quick add" })).toBeInTheDocument();
  });

  it("comes from the right", () => {
    render(
      <Blind {...styles} open label="Detail" onScrimClick={jest.fn()} onKeyDown={jest.fn()}>
        <p>Content</p>
      </Blind>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-right");
  });

  it("closes only via the scrim", async () => {
    const onScrimClick = jest.fn();
    render(
      <Blind
        {...styles}
        open
        label="Detail"
        onScrimClick={onScrimClick}
        onKeyDown={jest.fn()}
        data-testid="scrim"
      >
        <p>Content</p>
      </Blind>,
    );
    await userEvent.click(screen.getByText("Content"));
    expect(onScrimClick).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("scrim"));
    expect(onScrimClick).toHaveBeenCalled();
  });
});

describe("Unit tests for withBlindLogic", () => {
  it("closes with Escape", async () => {
    const onClose = jest.fn();
    render(
      <BlindWithLogic open label="Detail" onClose={onClose}>
        <p>Content</p>
      </BlindWithLogic>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("gives the blind the focus", () => {
    render(
      <BlindWithLogic open label="Detail">
        <p>Content</p>
      </BlindWithLogic>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("accepts its own width", () => {
    render(
      <BlindWithLogic open label="Detail" width={420}>
        <p>Content</p>
      </BlindWithLogic>,
    );
    expect(screen.getByRole("dialog")).toHaveStyle({ width: "420px" });
  });

  it("stays below the window width", () => {
    render(
      <BlindWithLogic open label="Detail">
        <p>Content</p>
      </BlindWithLogic>,
    );
    expect(screen.getByRole("dialog")).toHaveStyle({ maxWidth: "100%" });
  });

  it("assigns a descriptive displayName", () => {
    expect(withBlindLogic(Blind).displayName).toBe("withBlindLogic(Blind)");
  });
});

describe("Snapshot tests for Blind", () => {
  it("open", () => {
    const { container } = render(
      <BlindWithLogic open label="Detail">
        <p>Content</p>
      </BlindWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("narrow", () => {
    const { container } = render(
      <BlindWithLogic open label="Detail" width={420}>
        <p>Content</p>
      </BlindWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
