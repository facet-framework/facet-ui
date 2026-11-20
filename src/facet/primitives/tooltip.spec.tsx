/**
 * The document's tooltip. The placement is arithmetic, because jsdom computes
 * no layout; the layer is driven through real controls, so the cases prove the
 * tooltip arrives — for an ordinary `title` and for the keyboard.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconButton } from "./controls";
import { placeTooltip, tooltipDelay, TooltipLayer } from "./tooltip";

describe("placeTooltip", () => {
  const tip = { width: 100, height: 30 };

  it("centres the tooltip above the control, with the arrow at its centre", () => {
    const at = placeTooltip({ left: 200, top: 300, width: 40, height: 20 }, tip, { width: 1000 });
    expect(at).toEqual({ left: 170, top: 262, pos: "top", arrow: 50 });
  });

  it("flips below when there is no room above", () => {
    const at = placeTooltip({ left: 200, top: 10, width: 40, height: 20 }, tip, { width: 1000 });
    expect(at.pos).toBe("bottom");
    expect(at.top).toBe(38);
  });

  it("stays a margin inside the window at both edges", () => {
    const left = placeTooltip({ left: 0, top: 300, width: 20, height: 20 }, tip, { width: 1000 });
    const right = placeTooltip({ left: 985, top: 300, width: 15, height: 20 }, tip, {
      width: 1000,
    });
    expect(left.left).toBe(6);
    expect(right.left + tip.width).toBe(994);
  });

  it("keeps the arrow on the control when the tooltip was pushed aside, never on its corner", () => {
    const pushed = placeTooltip({ left: 20, top: 300, width: 20, height: 20 }, tip, {
      width: 1000,
    });
    // The control's centre is at 30; the box starts at 6, so the arrow sits at 24.
    expect(pushed.arrow).toBe(24);
    const corner = placeTooltip({ left: 0, top: 300, width: 4, height: 20 }, tip, { width: 1000 });
    expect(corner.arrow).toBe(10);
  });

  it("waits for a mouse and not for the keyboard", () => {
    expect(tooltipDelay(true)).toBe(0);
    expect(tooltipDelay(false)).toBe(350);
  });
});

describe("TooltipLayer", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  const tip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

  function setup() {
    render(
      <div>
        <TooltipLayer />
        <button type="button" title="Reads the repository again">
          Reload
        </button>
        <IconButton icon="settings" label="Settings" />
        <button type="button">Without explanation</button>
      </div>,
    );
    return {
      explained: screen.getByRole("button", { name: "Reload" }),
      icon: screen.getByRole("button", { name: "Settings" }),
      bare: screen.getByRole("button", { name: "Without explanation" }),
    };
  }

  function after(ms: number) {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  }

  it("shows nothing until something is hovered", () => {
    setup();
    expect(tip()).toBeNull();
  });

  it("shows a plain title after the delay, hidden from sight and screen reader while measured", () => {
    const { explained } = setup();
    fireEvent.mouseOver(explained);
    after(349);
    expect(tip()).toHaveAttribute("data-ready", "no");
    expect(tip()).toHaveAttribute("aria-hidden", "true");
    expect(tip()).not.toBeVisible();
    after(1);
    expect(tip()).toHaveTextContent("Reads the repository again");
    expect(tip()).toHaveAttribute("data-ready", "yes");
    expect(tip()).not.toHaveAttribute("aria-hidden");
    expect(tip()).toBeVisible();
  });

  it("takes the title away so the browser does not show its own beside it", () => {
    const { explained } = setup();
    fireEvent.mouseOver(explained);
    expect(explained).not.toHaveAttribute("title");
    expect(explained).toHaveAttribute("data-tip", "Reads the repository again");
  });

  it("says nothing about a control with nothing to say", () => {
    const { bare } = setup();
    fireEvent.mouseOver(bare);
    after(400);
    expect(tip()).toBeNull();
  });

  it("appears at once when the keyboard arrives, on an IconButton too", async () => {
    jest.useRealTimers();
    const { icon } = setup();
    // Tab to the second button: the IconButton, whose only text is its label.
    await userEvent.tab();
    await userEvent.tab();
    expect(icon).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Settings");
    expect(tip()).toHaveAttribute("data-ready", "yes");
  });

  it("describes its control through aria-describedby, unless it only repeats the name", () => {
    const { explained, icon } = setup();
    fireEvent.mouseOver(explained);
    after(400);
    expect(explained).toHaveAccessibleDescription("Reads the repository again");
    expect(tip()!.id).toBe(explained.getAttribute("aria-describedby"));
    fireEvent.mouseOut(explained, { relatedTarget: document.body });
    fireEvent.mouseOver(icon);
    after(400);
    expect(tip()).toHaveTextContent("Settings");
    // The label is the name already; pointing at the same words again would read them twice.
    expect(icon).not.toHaveAttribute("aria-describedby");
  });

  it.each([
    ["the mouse leaves", (el: HTMLElement) => fireEvent.mouseOut(el, { relatedTarget: null })],
    ["focus moves on", (el: HTMLElement) => fireEvent.focusOut(el)],
    ["Escape is pressed", () => fireEvent.keyDown(document, { key: "Escape" })],
    ["something scrolls", () => fireEvent.scroll(document)],
    ["the control is pressed", (el: HTMLElement) => fireEvent.mouseDown(el)],
    ["the window resizes", () => fireEvent(window, new Event("resize"))],
  ])("goes away when %s, and the control no longer points at it", (_, act_) => {
    const { explained } = setup();
    fireEvent.mouseOver(explained);
    after(400);
    expect(tip()).not.toBeNull();
    act(() => act_(explained));
    expect(tip()).toBeNull();
    expect(explained).not.toHaveAttribute("aria-describedby");
  });
});
