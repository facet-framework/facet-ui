import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/DepthLadder/DepthLadder.spec.text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DepthLadderWithLogic, { DepthLadder, withDepthLadderLogic } from ".";

describe("Unit tests for DepthLadder", () => {
  it("renders levels as a tab list", () => {
    render(
      <DepthLadder
        containerStyle={{}}
        hintStyle={{}}
        label={labelText.text277}
        hint={germanLabels.text155}
        onKeyDown={jest.fn()}
        steps={[
          { key: "a", label: remainingText.text83, current: true, style: {}, onSelect: jest.fn() },
          { key: "b", label: localized.text2, current: false, style: {}, onSelect: jest.fn() },
        ]}
      />,
    );
    expect(screen.getByRole("tablist", { name: labelText.text277 })).toBeInTheDocument();
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent(remainingText.text83);
  });

  it("shows the keyboard hint", () => {
    render(
      <DepthLadder
        containerStyle={{}}
        hintStyle={{}}
        label={labelText.text277}
        hint={localized.text4}
        onKeyDown={jest.fn()}
        steps={[]}
      />,
    );
    expect(screen.getByText(localized.text5)).toBeInTheDocument();
  });
});

describe("Unit tests for withDepthLadderLogic", () => {
  it("shows three levels", () => {
    render(<DepthLadderWithLogic depth={1} />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("marks the current level", () => {
    render(<DepthLadderWithLogic depth={2} />);
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent(localized.text8);
  });

  it("reports a clicked level", async () => {
    const onDepthChange = jest.fn();
    render(<DepthLadderWithLogic depth={1} onDepthChange={onDepthChange} />);
    await userEvent.click(screen.getByRole("tab", { name: remainingText.text84 }));
    expect(onDepthChange).toHaveBeenCalledWith(3);
  });

  it("moves forward with ArrowRight and back with ArrowLeft", async () => {
    const onDepthChange = jest.fn();
    render(<DepthLadderWithLogic depth={2} onDepthChange={onDepthChange} />);
    screen.getByRole("tab", { name: localized.text11 }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onDepthChange).toHaveBeenLastCalledWith(3);
    await userEvent.keyboard("{ArrowLeft}");
    expect(onDepthChange).toHaveBeenLastCalledWith(1);
  });

  it("stops at either end", async () => {
    const onDepthChange = jest.fn();
    render(<DepthLadderWithLogic depth={3} onDepthChange={onDepthChange} />);
    screen.getByRole("tab", { name: remainingText.text84 }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onDepthChange).toHaveBeenCalledWith(3);
  });

  it("accepts custom test levels", () => {
    render(<DepthLadderWithLogic depth={1} steps={[labelText.text278, "Detail"]} />);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("sets a descriptive displayName", () => {
    expect(withDepthLadderLogic(DepthLadder).displayName).toBe("withDepthLadderLogic(DepthLadder)");
  });
});

describe("Snapshot tests for DepthLadder", () => {
  it("Answer level", () => {
    const { container } = render(<DepthLadderWithLogic depth={1} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("Raw source level", () => {
    const { container } = render(<DepthLadderWithLogic depth={3} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
