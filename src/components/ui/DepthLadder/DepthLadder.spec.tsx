import { createText as createGermanText } from "../../../facet/i18n/text";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DepthLadderWithLogic, { DepthLadder, withDepthLadderLogic } from ".";
import { renderInGerman } from "../../../facet/i18n/testing";

const germanText = createGermanText("de");

describe("Unit tests for DepthLadder", () => {
  it("renders the levels as a tab list", () => {
    render(
      <DepthLadder
        containerStyle={{}}
        hintStyle={{}}
        label="Depth ladder"
        hint="→ deeper"
        onKeyDown={jest.fn()}
        steps={[
          { key: "a", label: "Answer", current: true, style: {}, onSelect: jest.fn() },
          { key: "b", label: "Evidence", current: false, style: {}, onSelect: jest.fn() },
        ]}
      />,
    );
    expect(screen.getByRole("tablist", { name: "Depth ladder" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("Answer");
  });

  it("shows the key hint", () => {
    render(
      <DepthLadder
        containerStyle={{}}
        hintStyle={{}}
        label="Depth ladder"
        hint="→ deeper · ← back"
        onKeyDown={jest.fn()}
        steps={[]}
      />,
    );
    expect(screen.getByText("→ deeper · ← back")).toBeInTheDocument();
  });
});

describe("Unit tests for withDepthLadderLogic", () => {
  it("shows three levels", () => {
    render(<DepthLadderWithLogic depth={1} />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("names the default levels and the hint in German under the German locale", () => {
    renderInGerman(<DepthLadderWithLogic depth={2} />);
    expect(
      screen.getByRole("tablist", { name: germanText.t("elements.depthLadder.label") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent(
      germanText.t("elements.depthLadder.evidence"),
    );
    expect(screen.getByText(germanText.t("elements.depthLadder.hint"))).toBeInTheDocument();
  });

  it("marks the current level", () => {
    render(<DepthLadderWithLogic depth={2} />);
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("Evidence");
  });

  it("reports the level choice on click", async () => {
    const onDepthChange = jest.fn();
    render(<DepthLadderWithLogic depth={1} onDepthChange={onDepthChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "Raw source" }));
    expect(onDepthChange).toHaveBeenCalledWith(3);
  });

  it("goes deeper with arrow right and back with arrow left", async () => {
    const onDepthChange = jest.fn();
    render(<DepthLadderWithLogic depth={2} onDepthChange={onDepthChange} />);
    screen.getByRole("tab", { name: "Evidence" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onDepthChange).toHaveBeenLastCalledWith(3);
    await userEvent.keyboard("{ArrowLeft}");
    expect(onDepthChange).toHaveBeenLastCalledWith(1);
  });

  it("stops at the ends", async () => {
    const onDepthChange = jest.fn();
    render(<DepthLadderWithLogic depth={3} onDepthChange={onDepthChange} />);
    screen.getByRole("tab", { name: "Raw source" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onDepthChange).toHaveBeenCalledWith(3);
  });

  it("accepts custom levels", () => {
    render(<DepthLadderWithLogic depth={1} steps={["Summary", "Detail"]} />);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("assigns a descriptive displayName", () => {
    expect(withDepthLadderLogic(DepthLadder).displayName).toBe("withDepthLadderLogic(DepthLadder)");
  });
});

describe("Snapshot tests for DepthLadder", () => {
  it("level answer", () => {
    const { container } = render(<DepthLadderWithLogic depth={1} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("level raw source", () => {
    const { container } = render(<DepthLadderWithLogic depth={3} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
