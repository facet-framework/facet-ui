import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/Blind/Blind.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlindWithLogic, { Blind, withBlindLogic } from ".";

const styles = { scrimStyle: {}, panelStyle: {} };

describe("Unit tests for Blind", () => {
  it("renders nothing while closed", () => {
    const { container } = render(
      <Blind
        {...styles}
        open={false}
        label={labelText.text291}
        onScrimClick={jest.fn()}
        onKeyDown={jest.fn()}
      >
        <p>{localized.text2}</p>
      </Blind>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes an accessible dialog when open", () => {
    render(
      <Blind
        {...styles}
        open
        label={labelText.text292}
        onScrimClick={jest.fn()}
        onKeyDown={jest.fn()}
      >
        <p>{localized.text4}</p>
      </Blind>,
    );
    expect(screen.getByRole("dialog", { name: labelText.text292 })).toBeInTheDocument();
  });

  it("names the search scope when nothing matches", () => {
    render(
      <Blind
        {...styles}
        open
        label={labelText.text291}
        onScrimClick={jest.fn()}
        onKeyDown={jest.fn()}
      >
        <p>{localized.text5}</p>
      </Blind>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-right");
  });

  it("closes only through the backdrop", async () => {
    const onScrimClick = jest.fn();
    render(
      <Blind
        {...styles}
        open
        label={labelText.text291}
        onScrimClick={onScrimClick}
        onKeyDown={jest.fn()}
        data-testid="scrim"
      >
        <p>{localized.text7}</p>
      </Blind>,
    );
    await userEvent.click(screen.getByText(localized.text8));
    expect(onScrimClick).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("scrim"));
    expect(onScrimClick).toHaveBeenCalled();
  });
});

describe("Unit tests for withBlindLogic", () => {
  it("closes on Escape", async () => {
    const onClose = jest.fn();
    render(
      <BlindWithLogic open label={labelText.text291} onClose={onClose}>
        <p>{localized.text10}</p>
      </BlindWithLogic>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focuses the panel", () => {
    render(
      <BlindWithLogic open label={labelText.text291}>
        <p>{localized.text12}</p>
      </BlindWithLogic>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("accepts a custom width", () => {
    render(
      <BlindWithLogic open label={labelText.text291} width={420}>
        <p>{localized.text14}</p>
      </BlindWithLogic>,
    );
    expect(screen.getByRole("dialog")).toHaveStyle({ width: "420px" });
  });

  it("stays within the viewport", () => {
    render(
      <BlindWithLogic open label={labelText.text291}>
        <p>{localized.text16}</p>
      </BlindWithLogic>,
    );
    expect(screen.getByRole("dialog")).toHaveStyle({ maxWidth: "100%" });
  });

  it("sets a descriptive displayName", () => {
    expect(withBlindLogic(Blind).displayName).toBe("withBlindLogic(Blind)");
  });
});

describe("Snapshot tests for Blind", () => {
  it("open", () => {
    const { container } = render(
      <BlindWithLogic open label={labelText.text291}>
        <p>{localized.text19}</p>
      </BlindWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("narrow", () => {
    const { container } = render(
      <BlindWithLogic open label={labelText.text291} width={420}>
        <p>{localized.text20}</p>
      </BlindWithLogic>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
